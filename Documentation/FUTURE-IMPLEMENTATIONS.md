# Future Implementations

This document tracks features planned for future implementation in LinuxGit.

---

## 1. GitHub OAuth Integration (Account Linking)

**Priority:** High
**Complexity:** Medium
**Status:** Planned

### Description
Implement proper OAuth-based GitHub account linking, similar to GitHub Desktop. Users will be able to sign in with their GitHub account directly within the app.

### Requirements
1. **Register OAuth App** - Create OAuth App at github.com/settings/developers
2. **Get Client ID** - Embed in app (public, safe to share)
3. **Implement Device Flow** - Recommended for desktop apps

### Technical Implementation

#### Backend (Rust)
```rust
// New commands needed:
- github_device_login_start() -> DeviceCodeResponse
- github_device_login_poll(device_code) -> Result<AccessToken, PendingOrError>
- github_get_user(token) -> GitHubUser
- github_logout()
- get_stored_github_token() -> Option<AccessToken>
```

#### Frontend
- "Sign in with GitHub" button in Settings > Authentication
- Show device code and link to github.com/login/device
- Poll for completion
- Display logged-in user info (avatar, username)

#### OAuth Device Flow
```
1. App requests device code from GitHub
2. User goes to github.com/login/device
3. User enters code (e.g., ABCD-1234)
4. App polls GitHub until authorized
5. App receives access token
6. Token stored in system keychain
```

#### Secure Token Storage
- Use `keyring` crate for Linux secret service
- Store: `linuxgit:github_token`

### API Endpoints
```
POST https://github.com/login/device/code
POST https://github.com/login/oauth/access_token
GET  https://api.github.com/user
```

### UI Design
```
┌─────────────────────────────────────────────┐
│ GitHub Account                              │
├─────────────────────────────────────────────┤
│  ┌──────┐                                   │
│  │Avatar│  @username                        │
│  └──────┘  user@email.com                   │
│                                             │
│  [Sign Out]                                 │
└─────────────────────────────────────────────┘
```

Or when not signed in:
```
┌─────────────────────────────────────────────┐
│ GitHub Account                              │
├─────────────────────────────────────────────┤
│                                             │
│  Sign in to GitHub to:                      │
│  • Push/pull without entering credentials   │
│  • Create pull requests                     │
│  • View issues and notifications            │
│                                             │
│  [  Sign in with GitHub  ]                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 2. GitLab OAuth Integration

**Priority:** Medium
**Complexity:** Medium
**Status:** Planned

Similar to GitHub OAuth but for GitLab accounts.

---

## 3. Repository Cloning

**Priority:** High
**Complexity:** Low
**Status:** Planned

### Description
Add ability to clone repositories from URL.

### Features
- Clone from HTTPS URL
- Clone from SSH URL
- Clone from GitHub (with OAuth integration)
- Progress indicator during clone
- Choose destination folder

---

## 4. File Watching / Auto-Refresh

**Priority:** Medium
**Complexity:** Medium
**Status:** Planned

### Description
Automatically detect file system changes and refresh the UI.

### Implementation
- Use `notify` crate for file system watching
- Watch .git directory for changes
- Debounce rapid changes
- Refresh status, commits, branches when changes detected

---

## 5. Conflict Resolution UI

**Priority:** High
**Complexity:** High
**Status:** Planned

### Description
Visual merge conflict resolution tool.

### Features
- Side-by-side diff view
- Accept left/right/both options
- Inline editing
- Mark as resolved

---

## 6. Stash Management

**Priority:** Medium
**Complexity:** Low
**Status:** Planned

### Features
- View stash list
- Create stash with message
- Apply/pop stash
- Drop stash
- View stash diff

---

## 7. Interactive Rebase

**Priority:** Low
**Complexity:** High
**Status:** Planned

### Features
- Reorder commits
- Squash commits
- Edit commit messages
- Drop commits

---

## 8. GitHub Pull Request Integration

**Priority:** Medium
**Complexity:** Medium
**Status:** Planned

### Description
View and create pull requests directly in the app.

### Features
- List open PRs
- Create new PR
- View PR diff
- PR review comments

---

## 9. Notifications

**Priority:** Low
**Complexity:** Low
**Status:** Planned

### Features
- Desktop notifications for:
  - Push/pull complete
  - New commits on remote
  - PR reviews
  - CI status

---

## 10. Multiple Repository Tabs

**Priority:** Medium
**Complexity:** Medium
**Status:** Planned

### Description
Open multiple repositories in tabs within a single window.

---

## Implementation Order (Suggested)

1. Repository Cloning (foundational feature)
2. GitHub OAuth Integration (user request, high value)
3. File Watching (UX improvement)
4. Stash Management (common operation)
5. Conflict Resolution UI (critical for merges)
6. GitHub PR Integration (requires OAuth)
7. GitLab OAuth
8. Interactive Rebase
9. Notifications
10. Multiple Repository Tabs
