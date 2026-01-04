# Technology Stack Decision

## Executive Summary

After comprehensive research on desktop application frameworks, Git libraries, and modern development practices, this document outlines the recommended technology stack for building a next-generation Git desktop application for Linux.

---

## 1. Application Framework: Tauri 2.0

### 1.1 Why Tauri Over Electron?

| Metric | Electron | Tauri 2.0 |
|--------|----------|-----------|
| **Binary Size** | 80-120 MB | 2.5-8 MB |
| **RAM Usage (idle)** | Hundreds of MB | 30-40 MB |
| **Startup Time** | 1-2 seconds | <0.5 seconds |
| **Security Model** | Requires hardening | Secure by default |
| **Native APIs** | Via Node.js | Via Rust |
| **Linux WebView** | Bundled Chromium | System WebKitGTK |

### 1.2 Tauri Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Web)                    │
│         React + TypeScript + Tailwind CSS           │
├─────────────────────────────────────────────────────┤
│                  IPC Bridge (Secure)                 │
├─────────────────────────────────────────────────────┤
│                   Backend (Rust)                     │
│     ┌──────────────┬──────────────┬──────────────┐  │
│     │   git2-rs    │   Tauri APIs │   Plugins    │  │
│     │  (libgit2)   │   (OS/FS/Net)│  (Auth/AI)   │  │
│     └──────────────┴──────────────┴──────────────┘  │
├─────────────────────────────────────────────────────┤
│              Operating System (Linux)                │
│                    WebKitGTK                         │
└─────────────────────────────────────────────────────┘
```

### 1.3 Tauri Benefits for Our Use Case

1. **Performance**: Git operations on large repos need speed
2. **Security**: Financial/enterprise repos need protection
3. **Size**: Easy distribution, fast downloads
4. **Native Feel**: Uses system libraries (GTK on Linux)
5. **Rust Backend**: Type-safe, memory-safe Git operations
6. **Cross-Platform**: Same codebase for Linux, macOS, Windows

### 1.4 Tauri Plugins We'll Use

| Plugin | Purpose |
|--------|---------|
| `tauri-plugin-fs` | File system operations |
| `tauri-plugin-shell` | Git CLI fallback |
| `tauri-plugin-http` | API calls (GitHub, GitLab) |
| `tauri-plugin-store` | Settings/credentials storage |
| `tauri-plugin-dialog` | Native dialogs |
| `tauri-plugin-notification` | System notifications |
| `tauri-plugin-os` | OS information |
| `tauri-plugin-updater` | Auto-updates |
| `tauri-plugin-single-instance` | Prevent multiple instances |

---

## 2. Frontend Stack

### 2.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI library |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool |
| **Tailwind CSS** | 3.x | Styling |
| **shadcn/ui** | Latest | Component library |
| **Zustand** | 4.x | State management |
| **TanStack Query** | 5.x | Server state |
| **React Router** | 6.x | Routing |

### 2.2 UI Components

```
Frontend Architecture
│
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── git/                # Git-specific components
│   │   ├── CommitGraph/    # Visual commit history
│   │   ├── DiffViewer/     # Side-by-side diff
│   │   ├── MergeEditor/    # 3-way merge tool
│   │   ├── BranchTree/     # Branch visualization
│   │   └── FileTree/       # Changed files tree
│   └── common/             # Shared components
│
├── hooks/                   # Custom React hooks
│   ├── useGit.ts           # Git operations
│   ├── useRepo.ts          # Repository state
│   └── useAI.ts            # AI features
│
├── stores/                  # Zustand stores
│   ├── repoStore.ts        # Repository state
│   ├── settingsStore.ts    # User preferences
│   └── uiStore.ts          # UI state
│
└── services/               # API/Tauri services
    ├── git.ts              # Git commands
    ├── github.ts           # GitHub API
    ├── gitlab.ts           # GitLab API
    └── ai.ts               # AI providers
```

### 2.3 Key Libraries

| Library | Purpose |
|---------|---------|
| `@tauri-apps/api` | Tauri IPC |
| `react-diff-view` | Diff visualization |
| `monaco-editor` | Code editing (merge conflicts) |
| `d3` or `react-flow` | Commit graph |
| `lucide-react` | Icons |
| `cmdk` | Command palette |
| `react-hot-toast` | Notifications |

---

## 3. Backend Stack (Rust)

### 3.1 Core Crates

| Crate | Purpose |
|-------|---------|
| `tauri` | Application framework |
| `git2` | Git operations (libgit2 bindings) |
| `tokio` | Async runtime |
| `serde` | Serialization |
| `reqwest` | HTTP client |
| `keyring` | Credential storage |
| `notify` | File watching |

### 3.2 Git Operations via git2-rs

```rust
// Example: Repository operations
use git2::{Repository, StatusOptions};

pub fn get_repo_status(path: &str) -> Result<Vec<FileStatus>> {
    let repo = Repository::open(path)?;
    let mut opts = StatusOptions::new();
    opts.include_untracked(true);

    let statuses = repo.statuses(Some(&mut opts))?;
    // ... process statuses
}
```

### 3.3 Why git2-rs (libgit2)?

1. **Production Proven**: Powers GitHub.com, GitKraken, GitLab, Azure DevOps
2. **Pure Implementation**: No Git CLI dependency
3. **Thread-Safe**: Parallel operations
4. **Cross-Platform**: Works on all platforms
5. **Permissive License**: GPL-2.0 with linking exception
6. **Performance**: Native C performance with Rust safety

### 3.4 Git CLI Fallback

Some operations require Git CLI:
- GPG signing (better tooling)
- Git LFS operations
- Complex hooks
- Edge cases

```rust
use std::process::Command;

pub fn git_command(repo_path: &str, args: &[&str]) -> Result<String> {
    let output = Command::new("git")
        .current_dir(repo_path)
        .args(args)
        .output()?;
    // ... handle output
}
```

---

## 4. Authentication Architecture

### 4.1 Supported Methods

| Method | Use Case | Storage |
|--------|----------|---------|
| **SSH Keys** | Git operations | System SSH agent |
| **Personal Access Tokens** | GitHub/GitLab API | OS Keychain |
| **OAuth 2.0** | GitHub/GitLab auth | Encrypted store |
| **GPG Keys** | Commit signing | GPG agent |

### 4.2 Credential Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │ ───► │   Tauri     │ ───► │  OS Keychain│
│  (Request)  │      │   (Rust)    │      │  (Secret)   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Git Remote  │
                     │  Operation  │
                     └─────────────┘
```

### 4.3 Linux Keychain Integration

```rust
use keyring::Entry;

pub fn store_credential(service: &str, user: &str, token: &str) -> Result<()> {
    let entry = Entry::new(service, user)?;
    entry.set_password(token)?;
    Ok(())
}
```

Supported backends:
- **GNOME Keyring** (GNOME/GTK)
- **KDE Wallet** (KDE/Plasma)
- **Secret Service API** (Generic)

---

## 5. AI Integration Architecture

### 5.1 Provider Abstraction

```rust
pub trait AIProvider: Send + Sync {
    async fn generate_commit_message(&self, diff: &str) -> Result<String>;
    async fn generate_pr_description(&self, commits: &[Commit]) -> Result<String>;
    async fn suggest_conflict_resolution(&self, conflict: &Conflict) -> Result<String>;
}

pub struct OpenAIProvider { /* ... */ }
pub struct ClaudeProvider { /* ... */ }
pub struct OllamaProvider { /* ... */ }  // Local, privacy-first
```

### 5.2 Supported Providers

| Provider | Type | Privacy | Cost |
|----------|------|---------|------|
| **Ollama** | Local | Full | Free |
| **OpenAI** | Cloud | Terms | Pay-per-use |
| **Claude** | Cloud | Terms | Pay-per-use |
| **Gemini** | Cloud | Terms | Pay-per-use |
| **Mistral** | Cloud/Local | Terms | Varies |
| **Custom** | API | Varies | Varies |

### 5.3 AI Features

1. **Commit Message Generation**
   - Analyze diff → Generate semantic message
   - Follow Conventional Commits format
   - Customizable prompts

2. **PR/MR Description**
   - Summarize all commits
   - Generate test plan
   - Link related issues

3. **Code Review Hints**
   - Identify potential issues
   - Suggest improvements
   - Security vulnerability detection

4. **Conflict Resolution Suggestions**
   - Analyze conflicting changes
   - Suggest resolution strategy
   - Learn from past resolutions

---

## 6. CI/CD Integration

### 6.1 Platform APIs

| Platform | API | Features |
|----------|-----|----------|
| **GitHub Actions** | REST + GraphQL | Workflow runs, logs, artifacts |
| **GitLab CI** | REST | Pipelines, jobs, logs |
| **Gitea Actions** | REST | Workflow runs |

### 6.2 Real-time Updates

```typescript
// WebSocket/SSE for live pipeline updates
const usePipelineStatus = (runId: string) => {
  const [status, setStatus] = useState<PipelineStatus>();

  useEffect(() => {
    const ws = new WebSocket(`wss://api.github.com/...`);
    ws.onmessage = (event) => setStatus(JSON.parse(event.data));
    return () => ws.close();
  }, [runId]);

  return status;
};
```

---

## 7. Linux Distribution

### 7.1 Package Formats

| Format | Target | Priority |
|--------|--------|----------|
| **AppImage** | All distros | P0 |
| **Flatpak** | Fedora, GNOME | P0 |
| **deb** | Debian, Ubuntu | P1 |
| **rpm** | Fedora, RHEL | P1 |
| **Snap** | Ubuntu | P2 |
| **AUR** | Arch Linux | P1 |

### 7.2 Auto-Update Strategy

```
┌─────────────────────────────────────────┐
│              Update Server              │
│    (GitHub Releases / Self-hosted)      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           Tauri Updater Plugin          │
│  - Check for updates on startup         │
│  - Background download                  │
│  - Apply on next launch                 │
└─────────────────────────────────────────┘
```

---

## 8. Development Tooling

### 8.1 Development Dependencies

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js (via nvm)
nvm install 20

# System dependencies (Ubuntu/Debian)
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# pnpm (package manager)
npm install -g pnpm
```

### 8.2 Project Structure

```
linuxgit/
├── src/                    # React frontend
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   ├── services/
│   └── App.tsx
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── git/           # Git operations
│   │   ├── auth/          # Authentication
│   │   ├── ai/            # AI providers
│   │   └── commands/      # Tauri commands
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 9. Sources

- [Tauri vs Electron 2025](https://www.raftlabs.com/blog/tauri-vs-electron-pros-cons/)
- [Tauri Official Documentation](https://v2.tauri.app/start/create-project/)
- [libgit2 Repository](https://github.com/libgit2/libgit2)
- [git2-rs Crate](https://docs.rs/git2/)
- [Linux Package Formats Comparison](https://www.baeldung.com/linux/snaps-flatpak-appimage)
- [GitKraken AI Features](https://www.gitkraken.com/features/git-ai)
