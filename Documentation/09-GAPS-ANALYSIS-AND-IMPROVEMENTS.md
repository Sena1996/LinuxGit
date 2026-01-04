# Gaps Analysis & Improvements

## Overview

This document identifies gaps, missing features, and areas for improvement in the LinuxGit documentation and architecture, based on comprehensive research conducted in January 2025.

---

## 1. Missing Git Features

### 1.1 Sparse Checkout & Partial Clone (CRITICAL for Monorepos)

**Gap Identified**: No documentation on handling large monorepos efficiently.

**Required Implementation**:
```
Feature: Monorepo Performance Optimization
├── Sparse Checkout (Git 2.25+)
│   ├── Cone mode support (recommended, faster pattern matching)
│   ├── Directory-level filtering
│   ├── UI for selecting directories to checkout
│   └── .git/info/sparse-checkout file management
├── Partial Clone
│   ├── --filter=blob:none (blobless clone)
│   ├── --filter=tree:0 (treeless clone)
│   ├── On-demand object fetching
│   └── Clone wizard with filter options
└── Combined Strategy
    ├── Partial clone + sparse checkout wizard
    ├── "Turn a 30GB, 4-hour clone into a 2-minute operation"
    └── CI/CD recommendations (shallow for CI, partial for dev)
```

**Research Source**: [GitHub Blog - Bring your monorepo down to size](https://github.blog/open-source/git/bring-your-monorepo-down-to-size-with-sparse-checkout/)

---

### 1.2 Git Blame/Annotate View (MISSING)

**Gap Identified**: No blame/annotate visualization documented.

**Required Implementation**:
```
Feature: Git Blame View
├── Line-by-line annotation display
│   ├── Commit SHA (abbreviated)
│   ├── Author name/avatar
│   ├── Date (relative + absolute on hover)
│   └── Commit message preview
├── Visual Age Indicators
│   ├── Color gradient (dark blue = recent, light = old)
│   ├── Same-commit grouping with visual markers
│   └── Repeating commit de-emphasis
├── Navigation
│   ├── Click line to view full commit
│   ├── "Blame previous revision" to trace history
│   └── Jump to parent commit
├── Options
│   ├── -w (ignore whitespace changes)
│   ├── -M (detect moved lines)
│   ├── -C (detect copied lines)
│   └── .git-blame-ignore-revs support
└── Performance
    ├── Lazy loading for large files
    ├── Caching blame results
    └── Background computation
```

**Research Source**: [Atlassian - Improving git blame discoverability](https://www.atlassian.com/blog/bitbucket/improving-discoverability-of-the-git-blame-functionality-on-bitbucket-cloud-ui)

---

### 1.3 Image Diff Visualization (MISSING)

**Gap Identified**: No documentation for binary/image file diff support.

**Required Implementation**:
```
Feature: Image Diff Viewer
├── Comparison Modes
│   ├── Side-by-side (swipe between versions)
│   ├── Onion skin (fade slider)
│   ├── Difference highlighting (pixel diff)
│   └── Split view with draggable divider
├── Supported Formats
│   ├── PNG, JPG, GIF, WebP, SVG
│   ├── PSD preview (metadata)
│   └── PDF page comparison
├── Metrics Display
│   ├── Pixel difference percentage
│   ├── File size change
│   └── Dimension changes
├── Integration
│   ├── Built-in ODiff (Rust/SIMD) for speed
│   ├── External tool fallback option
│   └── Custom diff tool configuration
└── Git Attributes
    └── *.png diff=image (custom diff driver)
```

**Research Source**: [GitHub - Image Diff Tools](https://github.com/ewanmellor/git-diff-image)

---

### 1.4 Git Worktrees Management (INSUFFICIENT)

**Gap Identified**: Worktrees mentioned but not detailed.

**Required Implementation**:
```
Feature: Git Worktrees
├── Worktree List View
│   ├── All linked worktrees
│   ├── Branch association
│   ├── Path location
│   ├── Status (clean/dirty)
│   └── Quick switch button
├── Operations
│   ├── Create worktree (from branch, commit, tag)
│   ├── Remove worktree (with cleanup confirmation)
│   ├── Open in new window/tab
│   └── Lock/unlock worktree
├── AI Integration (2024-2025 Trend)
│   ├── Parallel AI agent support
│   ├── "Run 4-5 Claude Code agents in parallel"
│   └── Task isolation for AI-generated changes
├── UI Integration
│   ├── Worktree indicator in status bar
│   ├── Easy directory switching
│   └── Shared Git objects indicator
└── Best Practices
    ├── Sibling directory placement
    ├── projectname-branchname naming
    └── Treat as temporary (create, use, remove)
```

**Research Source**: [DataCamp - Git Worktree Tutorial](https://www.datacamp.com/tutorial/git-worktree-tutorial)

---

### 1.5 Git Hooks Management UI (MISSING)

**Gap Identified**: No GUI for managing Git hooks.

**Required Implementation**:
```
Feature: Git Hooks Manager
├── Hooks Dashboard
│   ├── List all available hooks
│   ├── Status (enabled/disabled/missing)
│   ├── Last execution result
│   └── Edit hook button
├── Supported Hooks
│   ├── pre-commit (code validation)
│   ├── commit-msg (message formatting)
│   ├── pre-push (test execution)
│   ├── post-merge
│   ├── post-checkout
│   └── prepare-commit-msg
├── Integration
│   ├── husky detection and management
│   ├── pre-commit framework support
│   ├── lefthook support
│   └── Custom hook templates
├── UI Features
│   ├── Hook output viewer
│   ├── Bypass option (--no-verify) with warning
│   ├── Hook failure debugging
│   └── Share hooks via .githooks directory
└── Pre-built Hooks Library
    ├── Code formatting (Prettier, Black)
    ├── Linting (ESLint, Clippy)
    ├── Secret detection
    └── Commit message validation
```

**Research Source**: [pre-commit.com](https://pre-commit.com/)

---

### 1.6 Repository Health & Maintenance (MISSING)

**Gap Identified**: No repository health monitoring or maintenance UI.

**Required Implementation**:
```
Feature: Repository Health Dashboard
├── Health Indicators
│   ├── Repository size (objects, pack files)
│   ├── Loose objects count
│   ├── Unreachable objects
│   ├── Last gc execution
│   └── Integrity status (fsck)
├── Maintenance Actions
│   ├── git gc (basic cleanup)
│   ├── git gc --aggressive (deep cleanup)
│   ├── git prune (remove unreachable)
│   ├── git repack (optimize pack files)
│   └── git maintenance start (scheduled)
├── Scheduled Maintenance
│   ├── Background prefetch
│   ├── Incremental gc
│   ├── Loose object cleanup
│   └── Pack file optimization
├── Warnings & Alerts
│   ├── Large repository warning (>1GB)
│   ├── Stale lock files detection
│   ├── Corrupt objects alert
│   └── Maintenance recommendation
└── GitLab-Style Housekeeping
    ├── Daily maintenance window
    ├── Configurable schedule
    └── Background execution
```

**Research Source**: [Git - Maintenance and Data Recovery](https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery)

---

## 2. Missing Architecture Components

### 2.1 Deep Linking / Protocol Handler (MISSING)

**Gap Identified**: No deep linking for URL-based app invocation.

**Required Implementation**:
```
Feature: Deep Linking Support
├── Protocol Registration
│   ├── linuxgit:// custom protocol
│   ├── git-client:// fallback
│   └── Runtime registration (Linux/Windows)
├── Supported URL Patterns
│   ├── linuxgit://open?repo=/path/to/repo
│   ├── linuxgit://clone?url=https://github.com/...
│   ├── linuxgit://commit?sha=abc1234
│   ├── linuxgit://branch?name=feature/x
│   └── linuxgit://pr?number=123
├── OAuth Integration
│   ├── GitHub/GitLab callback redirect
│   ├── linuxgit://auth/callback?code=...
│   └── Secure token exchange
├── Tauri Plugin
│   ├── tauri-plugin-deep-link
│   ├── Single-instance integration
│   └── CLI argument parsing (Linux/Windows)
└── Browser Integration
    ├── "Open in LinuxGit" button (browser extension)
    └── GitHub/GitLab page integration
```

**Research Source**: [Tauri Deep Linking Plugin](https://v2.tauri.app/plugin/deep-linking/)

---

### 2.2 Plugin/Extension System (MISSING)

**Gap Identified**: No extensibility architecture documented.

**Required Implementation**:
```
Feature: Plugin System Architecture
├── Plugin Structure
│   ├── Rust backend plugin (Cargo crate)
│   ├── Frontend plugin (NPM package)
│   ├── Manifest file (plugin.json)
│   └── Permission declarations
├── Plugin Types
│   ├── AI Provider plugins
│   ├── Platform integration plugins
│   ├── Theme plugins
│   ├── Visualization plugins
│   └── Workflow automation plugins
├── API Surface
│   ├── Git operations hook
│   ├── UI extension points
│   ├── Command palette integration
│   ├── Settings page injection
│   └── Event subscription
├── Security
│   ├── Sandboxed execution
│   ├── Permission prompts
│   ├── Code signing verification
│   └── Update mechanism
└── Distribution
    ├── Plugin marketplace (future)
    ├── Manual installation
    └── npm/crates.io publishing
```

**Research Source**: [Tauri Plugin Development](https://v2.tauri.app/develop/plugins/)

---

### 2.3 Offline-First Architecture (MISSING)

**Gap Identified**: No offline capability documented for platform features.

**Required Implementation**:
```
Feature: Offline-First Design
├── Local-First Operations
│   ├── All Git operations work offline
│   ├── Local database for caching
│   ├── Queue for failed network requests
│   └── Auto-sync when online
├── Sync Strategy
│   ├── Last Writer Wins (LWW) for simple data
│   ├── Manual conflict resolution for complex data
│   ├── Delta sync for API data
│   └── Background sync with retry
├── Cached Data
│   ├── User profile and settings
│   ├── Repository metadata
│   ├── Recent commits (configurable depth)
│   ├── PR/MR drafts
│   └── AI-generated content
├── Storage Backend
│   ├── SQLite for structured data
│   ├── LevelDB/RocksDB for key-value
│   └── File-based for large objects
├── Network State
│   ├── Online/offline indicator
│   ├── Sync status per repository
│   ├── Pending operations queue view
│   └── Manual sync trigger
└── Conflict Resolution
    ├── Version-controlled resolver
    ├── User choice prompt
    └── Merge strategies for settings
```

**Research Source**: [Offline-First Architecture Guide](https://hasura.io/blog/design-guide-to-offline-first-apps)

---

## 3. Accessibility & i18n Gaps

### 3.1 WCAG 2.2 Compliance (INCOMPLETE)

**Gap Identified**: Accessibility requirements need more detail.

**Required Implementation**:
```
Feature: WCAG 2.2 AA Compliance
├── Keyboard Navigation
│   ├── Full tab navigation
│   ├── Arrow key navigation in lists
│   ├── Focus trap in modals
│   ├── Skip links
│   └── Consistent tab order
├── Screen Reader Support
│   ├── ARIA labels on all interactive elements
│   ├── Live regions for status updates
│   ├── Meaningful alt text
│   ├── Semantic HTML structure
│   └── Role announcements
├── Visual Accessibility
│   ├── 4.5:1 contrast ratio (text)
│   ├── 3:1 contrast ratio (UI components)
│   ├── Focus visible indicator (WCAG 2.2)
│   ├── Target size minimum 24x24px
│   └── No color-only information
├── Motion & Timing
│   ├── prefers-reduced-motion support
│   ├── Pause/stop animations
│   ├── No auto-playing content
│   └── Adequate time limits
├── Additional WCAG 2.2 Requirements
│   ├── Consistent Help (3.2.6)
│   ├── Accessible Authentication (3.3.8)
│   ├── Redundant Entry (3.3.7)
│   └── Dragging Movements alternative (2.5.7)
└── Testing
    ├── axe-core integration
    ├── Screen reader testing (NVDA, Orca)
    └── Keyboard-only testing protocol
```

**Research Source**: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

---

### 3.2 RTL Language Support (MISSING)

**Gap Identified**: No RTL (Right-to-Left) language support documented.

**Required Implementation**:
```
Feature: RTL Language Support
├── Layout Mirroring
│   ├── CSS logical properties (margin-inline-start)
│   ├── dir="rtl" attribute support
│   ├── Flexbox direction reversal
│   └── Icon mirroring (arrows, etc.)
├── Supported Languages
│   ├── Arabic (ar)
│   ├── Hebrew (he)
│   ├── Persian/Farsi (fa)
│   ├── Urdu (ur)
│   └── Pashto (ps)
├── Implementation
│   ├── tailwindcss-rtl plugin
│   ├── Conditional RTL stylesheet
│   ├── Font selection for RTL scripts
│   └── Number/date formatting
├── Testing
│   ├── Pseudo-RTL mode for developers
│   ├── Layout testing with RTL content
│   └── Bidirectional text handling
└── Edge Cases
    ├── Mixed LTR/RTL content
    ├── Code blocks (always LTR)
    ├── Git diff display
    └── Path separators
```

**Research Source**: [RTL Support Best Practices](https://apps.theodo.com/en/article/i18n-issues-on-rtl-languages-dont-be-left-out-in-the-dark-be-right)

---

## 4. Security Improvements

### 4.1 OWASP Desktop App Security (INCOMPLETE)

**Gap Identified**: Security documentation lacks OWASP Desktop Top 10.

**Required Implementation**:
```
Feature: OWASP Desktop Security Compliance
├── DA1: Injections
│   ├── Input validation on all fields
│   ├── Parameterized queries for local DB
│   ├── Shell command escaping
│   └── XML injection prevention
├── DA2: Broken Authentication
│   ├── Secure credential storage
│   ├── Session timeout
│   ├── MFA support
│   └── Brute-force protection
├── DA3: Sensitive Data Exposure
│   ├── Memory clearing for secrets
│   ├── No sensitive data in logs
│   ├── Encrypted local storage
│   └── Clipboard clearing
├── DA4: Improper Cryptography
│   ├── Strong algorithms only (AES-256)
│   ├── Proper key management
│   ├── TLS 1.3 for network
│   └── Certificate pinning
├── DA5: Improper Authorization
│   ├── Tauri capability system
│   ├── Minimal permissions
│   └── Permission audit logging
├── DA6: Security Misconfiguration
│   ├── Secure defaults
│   ├── Update mechanism security
│   └── Debug mode disabled in prod
├── DA7: Insecure Communication
│   ├── HTTPS only for APIs
│   ├── SSH certificate validation
│   └── Proxy security
├── DA8: Poor Code Quality
│   ├── Rust memory safety
│   ├── clippy linting
│   ├── cargo-audit for dependencies
│   └── Regular security audits
├── DA9: Using Components with Known Vulnerabilities
│   ├── Dependabot alerts
│   ├── RustSec advisory database
│   └── Regular dependency updates
└── DA10: Insufficient Logging
    ├── Security event logging
    ├── Audit trail for auth events
    ├── Log rotation
    └── No sensitive data in logs
```

**Research Source**: [OWASP Desktop App Security Top 10](https://owasp.org/www-project-desktop-app-security-top-10/)

---

### 4.2 Secret Detection (MISSING)

**Gap Identified**: No pre-commit secret detection documented.

**Required Implementation**:
```
Feature: Secret Detection
├── Pre-Commit Scanning
│   ├── Scan staged changes for secrets
│   ├── Block commit with secrets
│   ├── Warning for potential secrets
│   └── Bypass option with acknowledgment
├── Detection Patterns
│   ├── AWS keys
│   ├── GitHub tokens
│   ├── Private keys (RSA, SSH)
│   ├── API keys (generic patterns)
│   ├── Passwords in URLs
│   └── Custom patterns (configurable)
├── Integration
│   ├── gitleaks integration
│   ├── truffleHog patterns
│   ├── detect-secrets framework
│   └── Custom regex rules
├── Post-Detection
│   ├── Remediation guidance
│   ├── History scanning option
│   ├── BFG Repo-Cleaner integration
│   └── git-filter-repo support
└── .gitignore Suggestions
    ├── Common secret file patterns
    ├── Environment file warnings
    └── Auto-suggest based on detection
```

---

## 5. AI Integration Improvements

### 5.1 Local AI (Ollama) Best Practices (INCOMPLETE)

**Gap Identified**: Ollama integration needs more detail.

**Required Implementation**:
```
Feature: Enhanced Ollama Integration
├── Security Configuration
│   ├── Bind to localhost only
│   ├── No exposed ports
│   ├── Firewall recommendations
│   └── Environment variable security
├── Model Management
│   ├── Recommended models list
│   │   ├── codellama (code-focused)
│   │   ├── mistral (general purpose)
│   │   ├── deepseek-coder (coding)
│   │   └── qwen2.5-coder (tool calling)
│   ├── Model download progress
│   ├── Model size/requirements display
│   └── Model update notifications
├── Tool Calling (Ollama 0.8+)
│   ├── Structured output support
│   ├── Function calling for Git operations
│   ├── Streaming with tool calls
│   └── Error handling for tool failures
├── Performance Optimization
│   ├── GPU detection (CUDA, ROCm, Metal)
│   ├── Memory management
│   ├── Context window configuration
│   └── Batch processing for multiple files
├── Privacy Features
│   ├── No telemetry indicator
│   ├── Data stays local badge
│   ├── GDPR compliance benefits
│   └── Offline operation capability
└── Fallback Strategy
    ├── Ollama → Cloud AI fallback
    ├── User consent for cloud
    └── Graceful degradation
```

**Research Source**: [Ollama Blog - Tool Calling](https://ollama.com/blog/building-llm-powered-web-apps)

---

### 5.2 AI Cost Management (MISSING)

**Gap Identified**: No cost tracking for cloud AI providers.

**Required Implementation**:
```
Feature: AI Usage & Cost Tracking
├── Token Counting
│   ├── Input tokens per request
│   ├── Output tokens per request
│   ├── Total tokens display
│   └── Estimation before request
├── Cost Calculation
│   ├── Per-provider pricing database
│   ├── Daily/weekly/monthly usage
│   ├── Cost per repository
│   └── Budget limits with warnings
├── Usage Dashboard
│   ├── Requests by feature
│   ├── Tokens by model
│   ├── Cost trends graph
│   └── Export reports
├── Optimization Suggestions
│   ├── "Switch to local model" prompts
│   ├── Caching repeated requests
│   ├── Batch operations
│   └── Smaller model recommendations
└── Settings
    ├── Monthly budget cap
    ├── Warning thresholds
    ├── Auto-switch to Ollama
    └── Disable AI features option
```

---

## 6. UI/UX Improvements

### 6.1 Drag-and-Drop Staging (MISSING DETAIL)

**Gap Identified**: Hunk staging described but drag-and-drop not detailed.

**Required Implementation**:
```
Feature: Drag-and-Drop Staging
├── File-Level Drag-and-Drop
│   ├── Drag files between staged/unstaged
│   ├── Multi-select drag support
│   ├── Drop zones with visual feedback
│   └── Keyboard alternative (Space to toggle)
├── Hunk-Level Operations
│   ├── Visual hunk separator
│   ├── Click to stage/unstage hunk
│   ├── Drag hunk to staged area
│   └── Hunk splitting (click between lines)
├── Line-Level Staging
│   ├── Shift+click line selection
│   ├── Stage selected lines only
│   ├── Line-level discard
│   └── Interactive line picker
├── Visual Feedback
│   ├── Drag ghost preview
│   ├── Valid drop zone highlighting
│   ├── Animation on drop
│   └── Undo action (Ctrl+Z)
└── Accessibility
    ├── Keyboard-only equivalent
    ├── Screen reader announcements
    └── Focus management after action
```

**Research Source**: [Sublime Merge - Hunk Staging](https://www.sublimemerge.com/)

---

### 6.2 Multiple Window Support (MISSING)

**Gap Identified**: No multi-window architecture documented.

**Required Implementation**:
```
Feature: Multi-Window Support
├── Window Types
│   ├── Main repository window
│   ├── Detached diff viewer
│   ├── Commit detail popup
│   ├── Merge conflict editor
│   └── Settings window
├── Window Management
│   ├── Multiple repository windows
│   ├── Window position persistence
│   ├── Tab-based alternative
│   └── Tauri multi-webview support
├── State Synchronization
│   ├── Shared settings across windows
│   ├── Repository state sync
│   ├── Theme sync
│   └── IPC between windows
└── Shortcuts
    ├── New window (Ctrl+Shift+N)
    ├── Open repo in new window
    └── Detach panel to window
```

---

## 7. Missing Documentation

### 7.1 Error Handling & Recovery (MISSING)

**Gap Identified**: No error recovery documentation.

**Required Implementation**:
```
Document: Error Handling Guide
├── Common Git Errors
│   ├── "Permission denied (publickey)" → SSH key troubleshooter
│   ├── "fatal: refusing to merge unrelated histories" → Solution
│   ├── "error: failed to push some refs" → Pull first guidance
│   ├── "CONFLICT (content)" → Conflict resolution flow
│   └── "fatal: Not a git repository" → Repo detection
├── Recovery Operations
│   ├── git reflog for lost commits
│   ├── git stash recovery
│   ├── Aborted merge/rebase recovery
│   ├── Detached HEAD resolution
│   └── Corrupted repository repair
├── Undo Operations
│   ├── Undo last commit (soft reset)
│   ├── Discard all changes
│   ├── Revert pushed commit
│   └── Undo merge
├── User-Friendly Error Messages
│   ├── Plain language explanations
│   ├── Suggested actions
│   ├── One-click fixes where safe
│   └── Link to documentation
└── Logging & Diagnostics
    ├── Error log viewer
    ├── Export logs for support
    ├── Debug mode toggle
    └── Crash reporting (opt-in)
```

---

### 7.2 Testing Strategy Details (INCOMPLETE)

**Gap Identified**: Testing strategy needs more detail.

**Required Implementation**:
```
Document: Comprehensive Testing Strategy
├── Unit Testing
│   ├── Rust: cargo test + mockall
│   ├── TypeScript: Vitest + @testing-library/react
│   ├── Coverage targets: 80%+ core, 60%+ UI
│   └── Mutation testing (cargo-mutants)
├── Integration Testing
│   ├── Git operation tests with temp repos
│   ├── API mocking (wiremock-rs)
│   ├── Database integration tests
│   └── IPC round-trip tests
├── E2E Testing
│   ├── WebdriverIO + Tauri driver
│   ├── Playwright for web view
│   ├── Critical user journeys
│   └── Visual regression (Percy/Argos)
├── Performance Testing
│   ├── Criterion.rs benchmarks
│   ├── Memory profiling (heaptrack)
│   ├── Large repo stress tests
│   └── Startup time monitoring
├── Accessibility Testing
│   ├── axe-core automated checks
│   ├── Manual screen reader testing
│   ├── Keyboard-only navigation test
│   └── Color contrast validation
├── Security Testing
│   ├── cargo-audit (dependency CVEs)
│   ├── npm audit
│   ├── SAST (static analysis)
│   └── Fuzzing (cargo-fuzz)
└── CI/CD Integration
    ├── Pre-merge gates
    ├── Nightly comprehensive runs
    ├── Performance regression alerts
    └── Security scan schedules
```

---

## 8. Feature Priority Matrix (Updated)

Based on research, here are the priorities for missing features:

| Feature | Priority | Complexity | User Impact |
|---------|----------|------------|-------------|
| Git Blame View | P0 | Medium | High |
| Sparse Checkout/Partial Clone | P0 | High | High (Monorepos) |
| Secret Detection | P0 | Low | Critical (Security) |
| Drag-and-Drop Staging | P1 | Medium | High (UX) |
| Image Diff | P1 | Medium | Medium |
| Worktrees Management | P1 | Medium | Medium |
| Deep Linking | P1 | Medium | Medium |
| Git Hooks UI | P1 | Medium | Medium |
| Repository Health | P2 | Low | Medium |
| RTL Support | P2 | Medium | Regional |
| Plugin System | P2 | High | Future |
| Offline-First | P2 | High | Medium |
| Multi-Window | P2 | Medium | Low |
| AI Cost Tracking | P3 | Low | Low |

---

## 9. Action Items Summary

### Immediate (Before MVP)
1. Add Git Blame view to Feature Specification
2. Add Secret Detection to Security Features
3. Document Sparse Checkout/Partial Clone support
4. Add Deep Linking architecture to 04-ARCHITECTURE-DESIGN.md
5. Expand WCAG 2.2 compliance details

### Short-Term (Phase 2)
1. Implement Image Diff viewer
2. Add Git Hooks management UI
3. Implement Worktrees management
4. Add Repository Health dashboard
5. Implement drag-and-drop staging

### Long-Term (Phase 3+)
1. Plugin/extension system architecture
2. Offline-first data sync
3. RTL language support
4. Multi-window support
5. AI cost tracking dashboard

---

## 10. Sources & References

### Git Features
- [GitHub - Sparse Checkout](https://github.blog/open-source/git/bring-your-monorepo-down-to-size-with-sparse-checkout/)
- [DataCamp - Git Worktree](https://www.datacamp.com/tutorial/git-worktree-tutorial)
- [Git Maintenance Documentation](https://git-scm.com/docs/git-maintenance)
- [pre-commit Framework](https://pre-commit.com/)

### Desktop App Architecture
- [Tauri Deep Linking](https://v2.tauri.app/plugin/deep-linking/)
- [Tauri Plugin Development](https://v2.tauri.app/develop/plugins/)
- [Offline-First Guide](https://hasura.io/blog/design-guide-to-offline-first-apps)

### Security
- [OWASP Desktop Top 10](https://owasp.org/www-project-desktop-app-security-top-10/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)

### Accessibility & i18n
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WCAG2ICT for Desktop Apps](https://www.w3.org/TR/wcag2ict-22/)
- [RTL Support Best Practices](https://apps.theodo.com/en/article/i18n-issues-on-rtl-languages-dont-be-left-out-in-the-dark-be-right)

### AI Integration
- [Ollama Documentation](https://ollama.com/)
- [Local LLM Best Practices](https://www.cohorte.co/blog/run-llms-locally-with-ollama-privacy-first-ai-for-developers-in-2025)

---

*Document created: January 2025*
*Based on comprehensive first-principles research*
