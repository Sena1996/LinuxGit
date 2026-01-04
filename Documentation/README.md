# LinuxGit Documentation

## Overview

This documentation folder contains comprehensive research and planning materials for building **LinuxGit** - a modern, AI-enabled Git desktop application for Linux.

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Market Research](./01-MARKET-RESEARCH.md) | Competitor analysis, user personas, market opportunity |
| 02 | [Technology Stack](./02-TECHNOLOGY-STACK.md) | Framework decisions, libraries, architecture choices |
| 03 | [Feature Specification](./03-FEATURE-SPECIFICATION.md) | Detailed feature requirements and priorities |
| 04 | [Architecture Design](./04-ARCHITECTURE-DESIGN.md) | System architecture, data flow, component design |
| 05 | [Development Plan](./05-DEVELOPMENT-PLAN.md) | Phased development approach, milestones, tasks |
| 06 | [UI/UX Guidelines](./06-UI-UX-GUIDELINES.md) | Design system, component patterns, accessibility |
| 07 | [Authentication Guide](./07-GIT-AUTHENTICATION-GUIDE.md) | SSH, OAuth, PAT, GPG implementation details |
| 08 | [Branch Visualization Mockups](./08-BRANCH-VISUALIZATION-MOCKUPS.md) | River Flow, 3D, Sankey diagram visual mockups |
| 09 | [Gaps Analysis](./09-GAPS-ANALYSIS-AND-IMPROVEMENTS.md) | Missing features, improvements, research findings |

---

## Project Summary

### The Problem
GitHub Desktop is not available for Linux, leaving developers with:
- Command-line only Git (steep learning curve)
- Third-party tools with limitations (paid, resource-heavy, incomplete)
- Web interfaces (not integrated with local workflow)

### The Solution
Build a native, open-source Git desktop application for Linux that:
- Provides all essential Git features with an intuitive UI
- Integrates with GitHub, GitLab, and Gitea/Forgejo
- Offers AI-powered assistance (commit messages, code review)
- Runs fast and uses minimal resources (Tauri-based)
- Respects user privacy (local AI option, no telemetry by default)

---

## Technology Decisions

### Why Tauri 2.0?
| Aspect | Tauri | Electron |
|--------|-------|----------|
| Binary Size | ~8 MB | ~120 MB |
| RAM Usage | ~40 MB | ~200+ MB |
| Startup | <0.5s | 1-2s |
| Security | Rust-based, secure by default | Requires hardening |

### Frontend Stack
- **React 18** + **TypeScript** - Modern, type-safe UI
- **Tailwind CSS** + **shadcn/ui** - Beautiful, consistent design
- **Zustand** - Simple state management
- **Vite** - Fast development experience

### Backend Stack
- **Rust** - Performance and safety
- **git2-rs** (libgit2) - Git operations
- **keyring** - Credential storage
- **tokio** - Async runtime

---

## Key Features

### Core Git (MVP)
- Repository management (open, clone, init)
- Staging and committing with visual diff
- Branch management and merging
- Push/pull/fetch with progress
- Commit history visualization

### Platform Integration
- GitHub (OAuth, PRs, Issues, Actions)
- GitLab (OAuth, MRs, CI/CD)
- Gitea/Forgejo (self-hosted support)

### AI Features
- Commit message generation
- PR description generation
- Code review suggestions
- Conflict resolution hints
- Multiple providers (Ollama, OpenAI, Claude)

### Developer Experience
- Command palette (Ctrl+Shift+P)
- Full keyboard navigation
- Integrated terminal
- Dark/light themes
- Customizable workflows

---

## Development Phases

```
Phase 1: MVP (Foundation)
├── Project setup & UI shell
├── Basic Git operations
├── Changes view with diff
├── History view with graph
└── Branch management

Phase 2: Enhanced Features
├── Remote operations & auth
├── Conflict resolution UI
├── Advanced Git (rebase, stash, cherry-pick)
├── GitHub integration
└── AI features

Phase 3: Polish & Platform
├── GitLab integration
├── Gitea/Forgejo support
├── Performance optimization
├── Accessibility & i18n
└── Distribution packages

Phase 4: Expansion
├── macOS port
└── Windows port
```

---

## Quick Start (Development)

### Prerequisites

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20

# System dependencies (Ubuntu/Debian)
sudo apt install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl wget file \
    libxdo-dev libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# pnpm
npm install -g pnpm
```

### Create Project

```bash
pnpm create tauri-app linuxgit --template react-ts
cd linuxgit
pnpm install
pnpm tauri dev
```

---

## Contributing

We welcome contributions. Please read:
1. [Development Plan](./05-DEVELOPMENT-PLAN.md) for current priorities
2. [Architecture Design](./04-ARCHITECTURE-DESIGN.md) for code structure
3. [UI/UX Guidelines](./06-UI-UX-GUIDELINES.md) for design standards

---

## Research Sources

### Git & Workflows
- [Git Documentation](https://git-scm.com/doc)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
- [libgit2 Documentation](https://libgit2.org/)

### Competitors
- [GitKraken](https://www.gitkraken.com/)
- [GitHub Desktop](https://desktop.github.com/)
- [Sourcetree](https://www.sourcetreeapp.com/)

### Frameworks
- [Tauri Documentation](https://v2.tauri.app/)
- [React Documentation](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)

### AI Integration
- [GitKraken AI](https://www.gitkraken.com/features/git-ai)
- [Ollama](https://ollama.ai/)
- [OpenAI API](https://platform.openai.com/)

---

## License

Documentation: CC BY 4.0
Application: MIT (proposed)

---

*Last updated: January 2025*
