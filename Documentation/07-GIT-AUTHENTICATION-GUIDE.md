# Git Authentication Guide

## Overview

This document covers all authentication methods for Git operations and platform integrations that LinuxGit needs to support.

---

## 1. Authentication Methods Matrix

| Method | Git Operations | Platform API | Security Level | Complexity |
|--------|----------------|--------------|----------------|------------|
| SSH Keys | Yes | No | High | Medium |
| Personal Access Tokens (PAT) | Yes (HTTPS) | Yes | Medium | Low |
| OAuth 2.0 | No | Yes | High | High |
| GPG Keys | Signing only | No | High | Medium |
| GitHub App | No | Yes | High | High |

---

## 2. SSH Key Authentication

### 2.1 How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  SSH Client │────▶│  SSH Agent  │────▶│  Git Remote │
│  (our app)  │     │ (system)    │     │  (GitHub)   │
└─────────────┘     └─────────────┘     └─────────────┘
        │                  │
        │   Request key    │
        │─────────────────▶│
        │                  │
        │   Sign challenge │
        │◀─────────────────│
        │                  │
        │   Auth success   │
        └──────────────────│
```

### 2.2 Implementation in Rust

```rust
use git2::{Cred, CredentialType, RemoteCallbacks};
use std::env;
use std::path::Path;

pub fn create_ssh_callbacks() -> RemoteCallbacks<'static> {
    let mut callbacks = RemoteCallbacks::new();

    callbacks.credentials(|_url, username_from_url, allowed_types| {
        if allowed_types.contains(CredentialType::SSH_KEY) {
            // Try SSH agent first
            if let Ok(cred) = Cred::ssh_key_from_agent(username_from_url.unwrap_or("git")) {
                return Ok(cred);
            }

            // Fall back to default key locations
            let home = env::var("HOME").expect("HOME not set");
            let private_key = Path::new(&home).join(".ssh").join("id_ed25519");
            let public_key = Path::new(&home).join(".ssh").join("id_ed25519.pub");

            Cred::ssh_key(
                username_from_url.unwrap_or("git"),
                Some(&public_key),
                &private_key,
                None, // passphrase - handled by agent
            )
        } else {
            Err(git2::Error::from_str("SSH authentication not supported"))
        }
    });

    callbacks
}
```

### 2.3 Key Types Supported

| Key Type | Algorithm | Security | Recommended |
|----------|-----------|----------|-------------|
| ED25519 | Ed25519 | High | Yes |
| ECDSA | ECDSA-SHA2 | High | Yes |
| RSA (4096) | RSA | High | Yes |
| RSA (2048) | RSA | Medium | No |
| DSA | DSA | Low | No |

### 2.4 Key Discovery Order

1. SSH Agent (`SSH_AUTH_SOCK`)
2. `~/.ssh/id_ed25519`
3. `~/.ssh/id_ecdsa`
4. `~/.ssh/id_rsa`
5. User-specified key path

---

## 3. Personal Access Tokens (PAT)

### 3.1 Token Scopes Required

#### GitHub
```
repo           - Full repository access
read:org       - Read org membership
workflow       - Manage GitHub Actions
gist           - Create gists (optional)
```

#### GitLab
```
api            - Full API access
read_user      - Read user info
read_repository - Read repo access
write_repository - Write repo access
```

#### Gitea/Forgejo
```
All scopes (simpler permission model)
```

### 3.2 Secure Storage

```rust
use keyring::Entry;

pub struct CredentialStore {
    service_name: String,
}

impl CredentialStore {
    pub fn new(service: &str) -> Self {
        Self {
            service_name: format!("linuxgit-{}", service),
        }
    }

    pub fn store_token(&self, account: &str, token: &str) -> Result<(), keyring::Error> {
        let entry = Entry::new(&self.service_name, account)?;
        entry.set_password(token)
    }

    pub fn get_token(&self, account: &str) -> Result<String, keyring::Error> {
        let entry = Entry::new(&self.service_name, account)?;
        entry.get_password()
    }

    pub fn delete_token(&self, account: &str) -> Result<(), keyring::Error> {
        let entry = Entry::new(&self.service_name, account)?;
        entry.delete_credential()
    }
}
```

### 3.3 Linux Keychain Backends

| Desktop | Backend | Secret Service |
|---------|---------|----------------|
| GNOME | gnome-keyring | Yes |
| KDE Plasma | KWallet | Yes |
| XFCE | gnome-keyring | Yes |
| Headless | Secret Service daemon | Maybe |

---

## 4. OAuth 2.0 Flow

### 4.1 Authorization Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          OAuth 2.0 Authorization Flow                     │
└──────────────────────────────────────────────────────────────────────────┘

1. User clicks "Sign in with GitHub"
           │
           ▼
┌─────────────────────┐
│     LinuxGit App    │
│  Generate PKCE      │
│  code_verifier      │
│  code_challenge     │
└─────────────────────┘
           │
2. Open browser with authorization URL
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ https://github.com/login/oauth/authorize?                               │
│   client_id=YOUR_CLIENT_ID                                              │
│   redirect_uri=http://localhost:PORT/callback                           │
│   scope=repo,read:org                                                   │
│   state=RANDOM_STATE                                                    │
│   code_challenge=CODE_CHALLENGE                                         │
│   code_challenge_method=S256                                            │
└─────────────────────────────────────────────────────────────────────────┘
           │
3. User authorizes in browser
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ GitHub redirects to:                                                    │
│ http://localhost:PORT/callback?code=AUTH_CODE&state=RANDOM_STATE        │
└─────────────────────────────────────────────────────────────────────────┘
           │
4. Local server receives callback
           │
           ▼
┌─────────────────────┐
│     LinuxGit App    │
│  Exchange code for  │
│  access token       │
└─────────────────────┘
           │
5. POST to token endpoint
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ POST https://github.com/login/oauth/access_token                        │
│ {                                                                       │
│   client_id: YOUR_CLIENT_ID,                                           │
│   code: AUTH_CODE,                                                     │
│   code_verifier: CODE_VERIFIER                                         │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
           │
6. Receive and store tokens
           │
           ▼
┌─────────────────────┐
│     LinuxGit App    │
│  Store in keychain  │
│  - access_token     │
│  - refresh_token    │
└─────────────────────┘
```

### 4.2 Implementation

```rust
use oauth2::{
    AuthorizationCode, CsrfToken, PkceCodeChallenge, PkceCodeVerifier,
    Scope, TokenResponse,
};
use oauth2::basic::BasicClient;

pub async fn github_oauth_flow() -> Result<TokenResponse, OAuthError> {
    // Create OAuth client
    let client = BasicClient::new(
        ClientId::new("YOUR_CLIENT_ID".to_string()),
        None,
        AuthUrl::new("https://github.com/login/oauth/authorize".to_string())?,
        Some(TokenUrl::new("https://github.com/login/oauth/access_token".to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new("http://localhost:8765/callback".to_string())?);

    // Generate PKCE challenge
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    // Generate authorization URL
    let (auth_url, csrf_token) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("repo".to_string()))
        .add_scope(Scope::new("read:org".to_string()))
        .set_pkce_challenge(pkce_challenge)
        .url();

    // Open browser
    webbrowser::open(auth_url.as_str())?;

    // Start local server to receive callback
    let code = start_callback_server(csrf_token).await?;

    // Exchange code for token
    let token_result = client
        .exchange_code(code)
        .set_pkce_verifier(pkce_verifier)
        .request_async(async_http_client)
        .await?;

    Ok(token_result)
}
```

---

## 5. GPG Signing

### 5.1 Commit Signing Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GPG Commit Signing                            │
└─────────────────────────────────────────────────────────────────────┘

1. User creates commit
           │
           ▼
┌─────────────────────┐
│   LinuxGit detects  │
│   signing enabled   │
└─────────────────────┘
           │
2. Get signing key
           │
           ▼
┌─────────────────────┐
│   GPG Agent         │
│   (gpg-agent)       │
└─────────────────────┘
           │
3. Sign commit object
           │
           ▼
┌─────────────────────┐
│   Create signed     │
│   commit with       │
│   signature         │
└─────────────────────┘
```

### 5.2 Configuration

```rust
pub fn configure_gpg_signing(repo: &Repository, key_id: &str) -> Result<()> {
    let mut config = repo.config()?;
    config.set_str("user.signingkey", key_id)?;
    config.set_bool("commit.gpgsign", true)?;
    Ok(())
}

pub fn create_signed_commit(
    repo: &Repository,
    message: &str,
    // ... other params
) -> Result<Oid> {
    // For GPG signing, we need to use git CLI
    // as git2-rs doesn't fully support GPG
    let output = Command::new("git")
        .args(&["commit", "-S", "-m", message])
        .current_dir(repo.workdir().unwrap())
        .output()?;

    // ... handle output
}
```

### 5.3 SSH Signing (Git 2.34+)

```toml
# Alternative to GPG: SSH signing
[user]
    signingkey = ~/.ssh/id_ed25519.pub
[gpg]
    format = ssh
[gpg "ssh"]
    allowedSignersFile = ~/.ssh/allowed_signers
```

---

## 6. Platform-Specific Authentication

### 6.1 GitHub

| Auth Method | Git Clone | API Access | Recommended |
|-------------|-----------|------------|-------------|
| SSH Key | Yes | No | For Git only |
| PAT (Fine-grained) | Yes | Yes | Yes |
| OAuth App | No | Yes | For API only |
| GitHub App | No | Yes | Enterprise |

### 6.2 GitLab

| Auth Method | Git Clone | API Access | Recommended |
|-------------|-----------|------------|-------------|
| SSH Key | Yes | No | For Git only |
| PAT | Yes | Yes | Yes |
| OAuth 2.0 | No | Yes | Enterprise |
| Deploy Token | Yes (read) | No | CI/CD |

### 6.3 Gitea/Forgejo

| Auth Method | Git Clone | API Access | Recommended |
|-------------|-----------|------------|-------------|
| SSH Key | Yes | No | For Git only |
| PAT | Yes | Yes | Yes |
| OAuth 2.0 | No | Yes | Optional |

---

## 7. Credential Helper Integration

### 7.1 Git Credential Helper Protocol

```bash
# Git asks for credentials
$ git credential fill
protocol=https
host=github.com

# Helper responds
username=octocat
password=ghp_xxxx
```

### 7.2 LinuxGit as Credential Helper

```bash
# User can configure git to use LinuxGit for credentials
git config --global credential.helper linuxgit
```

```rust
// Implementation of credential helper protocol
pub fn handle_credential_request(operation: &str) -> Result<()> {
    match operation {
        "get" => {
            let input = read_credential_input()?;
            if let Some(cred) = lookup_credential(&input.host, &input.protocol)? {
                println!("username={}", cred.username);
                println!("password={}", cred.password);
            }
        }
        "store" => {
            let input = read_credential_input()?;
            store_credential(&input)?;
        }
        "erase" => {
            let input = read_credential_input()?;
            delete_credential(&input)?;
        }
        _ => {}
    }
    Ok(())
}
```

---

## 8. Security Best Practices

### 8.1 Token Security

1. **Never store tokens in plain text**
2. **Use OS keychain** for secure storage
3. **Prefer fine-grained PATs** over classic tokens
4. **Set token expiration** (90 days recommended)
5. **Minimal scopes** - only request what's needed
6. **Rotate regularly** - automatic reminders

### 8.2 SSH Key Security

1. **Use ED25519** over RSA
2. **Set strong passphrase** - or use SSH agent
3. **Use per-host keys** for different services
4. **Monitor authorized keys** on GitHub/GitLab

### 8.3 Application Security

1. **PKCE required** for OAuth flows
2. **State parameter** to prevent CSRF
3. **Secure token storage** - encrypted at rest
4. **Memory protection** - clear sensitive data
5. **Audit logging** - track auth events

---

## 9. Error Handling

### 9.1 Common Auth Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Permission denied (publickey)` | SSH key not found/wrong | Check key path, agent |
| `Bad credentials` | Invalid/expired token | Re-authenticate |
| `Rate limit exceeded` | Too many API calls | Wait or use OAuth |
| `SSO authorization required` | Enterprise SSO | Complete SSO flow |
| `Token expired` | OAuth token expired | Refresh token |

### 9.2 User-Friendly Messages

```typescript
const AUTH_ERROR_MESSAGES = {
  'ssh_key_not_found': {
    title: 'SSH Key Not Found',
    description: 'No SSH key was found. Would you like to generate one?',
    actions: ['Generate Key', 'Use HTTPS Instead', 'Cancel']
  },
  'token_expired': {
    title: 'Session Expired',
    description: 'Your GitHub session has expired. Please sign in again.',
    actions: ['Sign In', 'Cancel']
  },
  'permission_denied': {
    title: 'Access Denied',
    description: 'You don\'t have permission to access this repository.',
    actions: ['Request Access', 'OK']
  }
};
```

---

## 10. References

- [GitHub Token Authentication](https://github.blog/security/application-security/token-authentication-requirements-for-git-operations/)
- [GitHub Fine-Grained PATs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitLab OAuth 2.0](https://docs.gitlab.com/ee/api/oauth2.html)
- [libgit2 Credentials](https://libgit2.org/libgit2/#HEAD/group/credential)
- [Git Credential Helpers](https://git-scm.com/docs/gitcredentials)
