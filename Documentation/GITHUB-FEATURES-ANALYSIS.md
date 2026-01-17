# GitHub Features Analysis for LinuxGit

## Executive Summary

This document provides a comprehensive analysis of GitHub's DevOps features and capabilities, serving as a roadmap for integrating them into LinuxGit as a smart, developer-focused Git client with full CI/CD management capabilities.

---

## 1. GitHub Actions - Complete Overview

### 1.1 Core Components

| Component | Description |
|-----------|-------------|
| **Workflows** | Configurable automated processes defined in YAML, stored in `.github/workflows/` |
| **Jobs** | Set of steps executed on the same runner, can run in parallel or sequentially |
| **Steps** | Individual tasks - either shell scripts or reusable actions |
| **Runners** | Servers that execute workflows (GitHub-hosted or self-hosted) |
| **Actions** | Pre-defined, reusable code from GitHub Marketplace |

### 1.2 Available Runners (GitHub-Hosted)

| Runner | OS | Use Case |
|--------|----|-----------|
| `ubuntu-latest` | Ubuntu Linux | Most common, general purpose |
| `ubuntu-22.04`, `ubuntu-24.04` | Ubuntu (specific) | When specific version needed |
| `windows-latest` | Windows Server | Windows builds, .NET |
| `windows-2022`, `windows-2019` | Windows (specific) | Specific Windows versions |
| `macos-latest` | macOS | iOS/macOS builds |
| `macos-14`, `macos-13` | macOS (specific) | Specific macOS versions |

### 1.3 Workflow Triggers

```yaml
on:
  # Code events
  push:
    branches: [main, develop]
    paths: ['src/**', '!docs/**']
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main]

  # Manual triggers
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy environment'
        required: true
        type: choice
        options: [staging, production]

  # Scheduled
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

  # Other events
  release:
    types: [published]
  issues:
    types: [opened, labeled]
  workflow_call:  # Reusable workflow
```

---

## 2. Starter Workflow Templates (Official)

### 2.1 CI Templates by Language

| Language/Framework | Template File | Key Actions |
|--------------------|---------------|-------------|
| **Node.js** | `node.js.yml` | `actions/setup-node@v4`, npm ci, test, build |
| **Python** | `python-app.yml` | `actions/setup-python@v5`, pip install, pytest |
| **Rust** | `rust.yml` | `actions-rs/toolchain`, cargo build, cargo test |
| **Go** | `go.yml` | `actions/setup-go@v5`, go build, go test |
| **Java/Maven** | `maven.yml` | `actions/setup-java@v4`, mvn test, mvn package |
| **Java/Gradle** | `gradle.yml` | `actions/setup-java@v4`, gradle build |
| **.NET** | `dotnet.yml` | `actions/setup-dotnet@v4`, dotnet build, dotnet test |
| **Ruby** | `ruby.yml` | `ruby/setup-ruby@v1`, bundle install, rake test |
| **PHP** | `php.yml` | `shivammathur/setup-php@v2`, composer install |
| **Swift** | `swift.yml` | Native macOS runner, swift build |
| **Kotlin/Android** | `android.yml` | Android SDK setup, gradlew build |

### 2.2 Deployment Templates

| Target Platform | Template | Description |
|-----------------|----------|-------------|
| **AWS** | `aws.yml` | Deploy to AWS services (ECS, Lambda, S3) |
| **Azure Web App** | `azure-webapps-*.yml` | Deploy to Azure App Service |
| **Azure Kubernetes** | `azure-kubernetes-*.yml` | Deploy to AKS with Helm/Kustomize |
| **Google Cloud Run** | `google.yml` | Deploy containers to Cloud Run |
| **GitHub Pages** | `pages/*.yml` | Deploy static sites (Jekyll, Hugo, etc.) |
| **Docker Hub** | `docker-publish.yml` | Build and push Docker images |
| **Terraform** | `terraform.yml` | Infrastructure as Code deployments |

### 2.3 Security & Quality Templates

| Template | Purpose |
|----------|---------|
| `codeql-analysis.yml` | Code scanning with CodeQL |
| `dependency-review.yml` | Review dependency changes |
| `super-linter.yml` | Multi-language linting |

---

## 3. Matrix Strategy - Multi-Platform Testing

### 3.1 Basic Matrix Configuration

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
        exclude:
          - os: macos-latest
            node: 18
        include:
          - os: ubuntu-latest
            node: 22
            experimental: true
      fail-fast: false  # Continue other jobs if one fails
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
```

### 3.2 Matrix Best Practices

- **Use `fail-fast: false`** when you need results from all combinations
- **Use `include`** for special configurations outside the standard matrix
- **Use `exclude`** to remove invalid/unnecessary combinations
- **Dynamic matrices** can be generated from previous job outputs

---

## 4. Caching & Artifacts

### 4.1 Dependency Caching

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      npm-${{ runner.os }}-
```

**Cache Keys by Package Manager:**

| Package Manager | Cache Path | Key Pattern |
|-----------------|------------|-------------|
| npm | `~/.npm` | `npm-${{ hashFiles('package-lock.json') }}` |
| yarn | `~/.cache/yarn` | `yarn-${{ hashFiles('yarn.lock') }}` |
| pnpm | `~/.pnpm-store` | `pnpm-${{ hashFiles('pnpm-lock.yaml') }}` |
| pip | `~/.cache/pip` | `pip-${{ hashFiles('requirements.txt') }}` |
| Cargo | `~/.cargo` | `cargo-${{ hashFiles('Cargo.lock') }}` |
| Maven | `~/.m2/repository` | `maven-${{ hashFiles('pom.xml') }}` |
| Gradle | `~/.gradle/caches` | `gradle-${{ hashFiles('*.gradle*') }}` |

### 4.2 Build Artifacts

```yaml
# Upload artifact
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: dist/
    retention-days: 7

# Download in another job
- uses: actions/download-artifact@v4
  with:
    name: build-output
```

**Limits:**
- Max artifact size: 10GB per repository
- Default retention: 90 days (configurable 1-90)

---

## 5. Environments & Deployments

### 5.1 Environment Configuration

```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.com
    steps:
      - name: Deploy
        run: ./deploy.sh
```

### 5.2 Protection Rules

| Rule Type | Description |
|-----------|-------------|
| **Required Reviewers** | Specific users/teams must approve deployment |
| **Wait Timer** | Delay deployment by N minutes (0-43200) |
| **Branch Restrictions** | Only specific branches can deploy |
| **Custom Rules** | Third-party approval systems via GitHub Apps |

### 5.3 Environment Secrets & Variables

- **Secrets**: Encrypted, only available to workflows referencing the environment
- **Variables**: Non-sensitive configuration values
- **Availability**: Free for public repos; Pro/Team/Enterprise for private repos

---

## 6. GitHub Packages & Container Registry

### 6.1 Supported Registries

| Registry | Domain | Package Types |
|----------|--------|---------------|
| **Container Registry** | `ghcr.io` | Docker/OCI images |
| **npm** | `npm.pkg.github.com` | JavaScript packages |
| **Maven** | `maven.pkg.github.com` | Java packages |
| **Gradle** | `maven.pkg.github.com` | Java packages |
| **NuGet** | `nuget.pkg.github.com` | .NET packages |
| **RubyGems** | `rubygems.pkg.github.com` | Ruby gems |

### 6.2 Container Registry Usage

```yaml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    push: true
    tags: ghcr.io/${{ github.repository }}:latest
```

---

## 7. Security Features

### 7.1 GitHub Advanced Security (2025 Products)

| Product | Price | Features |
|---------|-------|----------|
| **Secret Protection** | $19/month/committer | Push protection, secret scanning, AI detection |
| **Code Security** | $30/month/committer | CodeQL scanning, Copilot Autofix, Dependabot |

### 7.2 Free Security Features

| Feature | Description | Availability |
|---------|-------------|--------------|
| **Dependency Graph** | Visualize all dependencies | All repos |
| **Dependabot Alerts** | Vulnerable dependency notifications | All repos |
| **Dependabot Updates** | Auto-create PRs for updates | All repos |
| **Secret Scanning** | Detect leaked secrets | Public repos (free) |
| **Code Scanning** | CodeQL analysis | Public repos (free) |

### 7.3 Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        dependency-type: "development"
```

---

## 8. Branch Protection & Status Checks

### 8.1 Protection Rules

```
✓ Require pull request before merging
  ├─ Required approvals: 2
  ├─ Dismiss stale reviews: Yes
  └─ Require review from code owners: Yes

✓ Require status checks before merging
  ├─ ci / build (required)
  ├─ ci / test (required)
  └─ security / codeql (required)

✓ Require conversation resolution
✓ Require signed commits
✓ Require linear history
✓ Restrict who can push
```

### 8.2 Status Checks Best Practices

- Job names must be **unique across all workflows**
- Checks must have run within **last 7 days** to be selectable
- Use `merge_group` event trigger for merge queues
- Skipped jobs (via `if:` or path filters) report as "Success"

---

## 9. Reusable Workflows & Composite Actions

### 9.1 Reusable Workflows

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build
on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
    secrets:
      npm-token:
        required: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
```

**Calling a reusable workflow:**
```yaml
jobs:
  call-build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      node-version: '20'
    secrets:
      npm-token: ${{ secrets.NPM_TOKEN }}
```

### 9.2 Composite Actions

```yaml
# .github/actions/setup-project/action.yml
name: 'Setup Project'
description: 'Setup Node.js and install dependencies'
inputs:
  node-version:
    description: 'Node.js version'
    default: '20'
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
    - run: npm ci
      shell: bash
```

### 9.3 When to Use Which

| Use Case | Reusable Workflow | Composite Action |
|----------|-------------------|------------------|
| Standardize entire CI/CD pipeline | ✓ | |
| Share steps across different workflows | | ✓ |
| Different runner requirements | ✓ | |
| Nest within other actions | | ✓ (up to 10 levels) |
| Flexible step placement | | ✓ |

---

## 10. Self-Hosted Runners

### 10.1 Supported Platforms

| Architecture | Linux | Windows | macOS |
|--------------|-------|---------|-------|
| x64 | ✓ | ✓ | ✓ |
| ARM64 | ✓ | Preview | ✓ |
| ARM32 | ✓ | | |

### 10.2 Setup Process

1. Navigate to Repository → Settings → Actions → Runners
2. Click "New self-hosted runner"
3. Select OS and architecture
4. Run the provided commands to download and configure

### 10.3 Labels

- **Default labels**: `self-hosted`, `linux`/`windows`/`macos`, `x64`/`ARM64`
- **Custom labels**: Assign any labels for targeting specific runners

### 10.4 Autoscaling with ARC

For Kubernetes-based autoscaling, use **Actions Runner Controller (ARC)**:
- Ephemeral runners recommended
- Scales based on workflow demand
- Works with EKS, AKS, GKE, or bare metal K8s

---

## 11. Most Popular GitHub Actions (2025)

### 11.1 Essential Actions (>90% usage)

| Action | Purpose |
|--------|---------|
| `actions/checkout@v4` | Clone repository |
| `actions/setup-node@v4` | Setup Node.js with caching |
| `actions/setup-python@v5` | Setup Python with pip/poetry |
| `actions/setup-java@v4` | Setup JDK with Maven/Gradle |
| `actions/cache@v4` | Cache dependencies |
| `actions/upload-artifact@v4` | Upload build artifacts |
| `actions/download-artifact@v4` | Download artifacts |
| `actions/github-script@v7` | Run scripts using GitHub API |

### 11.2 Build & Deploy Actions

| Action | Purpose |
|--------|---------|
| `docker/build-push-action@v5` | Build and push Docker images |
| `docker/login-action@v3` | Authenticate to container registries |
| `aws-actions/configure-aws-credentials@v4` | AWS authentication |
| `azure/login@v2` | Azure authentication |
| `google-github-actions/auth@v2` | GCP authentication |

### 11.3 Code Quality Actions

| Action | Purpose |
|--------|---------|
| `github/codeql-action/analyze@v3` | CodeQL security scanning |
| `codecov/codecov-action@v4` | Upload coverage to Codecov |
| `sonarsource/sonarcloud-github-action@v2` | SonarCloud analysis |

---

## 12. Automatic Release Notes

### 12.1 Built-in Feature

GitHub can auto-generate release notes from:
- Merged pull requests
- Contributors (including first-time contributors)
- Commit history

### 12.2 Configuration

```yaml
# .github/release.yml
changelog:
  categories:
    - title: '🚀 Features'
      labels: [enhancement, feature]
    - title: '🐛 Bug Fixes'
      labels: [bug, bugfix]
    - title: '📦 Dependencies'
      labels: [dependencies]
  exclude:
    labels: [skip-changelog]
```

### 12.3 Third-Party Tools

| Tool | Description |
|------|-------------|
| `semantic-release` | Fully automated versioning and changelog |
| `conventional-changelog` | Generate from commit messages |
| `release-please` | Google's release automation |

---

## 13. REST API Endpoints

### 13.1 Workflows API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/repos/{owner}/{repo}/actions/workflows` | GET | List all workflows |
| `/repos/{owner}/{repo}/actions/workflows/{id}` | GET | Get specific workflow |
| `/repos/{owner}/{repo}/actions/workflows/{id}/dispatches` | POST | Trigger workflow |

### 13.2 Workflow Runs API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/repos/{owner}/{repo}/actions/runs` | GET | List all runs |
| `/repos/{owner}/{repo}/actions/runs/{id}` | GET | Get specific run |
| `/repos/{owner}/{repo}/actions/runs/{id}/cancel` | POST | Cancel run |
| `/repos/{owner}/{repo}/actions/runs/{id}/rerun` | POST | Re-run workflow |
| `/repos/{owner}/{repo}/actions/runs/{id}/rerun-failed-jobs` | POST | Re-run failed jobs only |

### 13.3 Deployments API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/repos/{owner}/{repo}/deployments` | GET | List deployments |
| `/repos/{owner}/{repo}/deployments` | POST | Create deployment |
| `/repos/{owner}/{repo}/deployments/{id}/statuses` | GET | Get deployment statuses |
| `/repos/{owner}/{repo}/environments` | GET | List environments |

---

## 14. Implementation Plan for LinuxGit

### Phase 1: Smart Setup Wizard (Priority: HIGH)

**Goal**: Help users set up CI/CD even without prior GitHub Actions knowledge

#### 14.1 Repository Analysis Engine

```typescript
interface RepositoryAnalysis {
  // Detected from files
  languages: { name: string; percentage: number }[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo' | 'maven' | 'gradle' | null;
  frameworks: string[];  // react, django, rails, etc.
  hasDockerfile: boolean;
  hasTests: boolean;

  // Existing CI/CD
  existingWorkflows: WorkflowFile[];

  // Recommendations
  suggestedWorkflows: WorkflowTemplate[];
  suggestedEnvironments: EnvironmentConfig[];
}
```

#### 14.2 Template Selection UI

```
┌─────────────────────────────────────────────────────────────────────┐
│  Setup CI/CD for your repository                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📊 We detected: Node.js (TypeScript) with Jest tests               │
│                                                                      │
│  Recommended Workflows:                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ ✓ CI Pipeline                                    [Customize]│    │
│  │   Triggers: push, pull_request                              │    │
│  │   Jobs: lint → test → build                                 │    │
│  │   Estimated time: ~3 minutes                                │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ ○ Deploy to GitHub Pages                        [Customize]│    │
│  │   Deploy built assets to GitHub Pages                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ ○ Docker Build & Push                           [Customize]│    │
│  │   Build Docker image and push to ghcr.io                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  [Preview YAML] [Create Workflows] [Learn More]                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Workflow Visualization & Management

#### 14.3 Pipeline Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│  CI Pipeline - Run #1234                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Trigger: push to main by @developer                                │
│  Commit: abc1234 "Add new feature"                                  │
│                                                                      │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐      │
│  │  lint   │────▶│  test   │────▶│  build  │────▶│ deploy  │      │
│  │  ✓ 45s  │     │  ✓ 2m   │     │  ● 1m   │     │  ○ wait │      │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘      │
│                                                                      │
│  Matrix: ubuntu-latest + node-20                                    │
│  ┌─────────┐┌─────────┐┌─────────┐                                 │
│  │ node-18 ││ node-20 ││ node-22 │                                 │
│  │  ✓ pass ││  ● run  ││  ✓ pass │                                 │
│  └─────────┘└─────────┘└─────────┘                                 │
│                                                                      │
│  [Cancel] [Re-run] [View Logs] [View Artifacts]                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Environments Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  Environments                                          [+ Create]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🟢 production                                           Protected   │
│  ├─ URL: https://myapp.com                                          │
│  ├─ Last deploy: v1.2.3 (2 hours ago)                              │
│  ├─ Protection: 2 reviewers required, 30min wait                    │
│  └─ [Deploy] [History] [Settings]                                   │
│                                                                      │
│  🟢 staging                                              Protected   │
│  ├─ URL: https://staging.myapp.com                                  │
│  ├─ Last deploy: v1.2.4-rc.1 (30 mins ago)                         │
│  └─ [Deploy] [Promote to Production] [Settings]                     │
│                                                                      │
│  🔵 preview                                              Ephemeral   │
│  ├─ Auto-deploys from pull request branches                         │
│  ├─ Active previews: 3                                              │
│  └─ [View All] [Settings]                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 4: Security Center

```
┌─────────────────────────────────────────────────────────────────────┐
│  Security Overview                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Dependabot Alerts        Code Scanning           Secret Scanning   │
│  ┌────────────────┐      ┌────────────────┐      ┌────────────────┐│
│  │ 🔴 3 Critical  │      │ ⚠️  2 High     │      │ ✓ No leaks     ││
│  │ 🟠 5 High      │      │ ℹ️  8 Medium   │      │   detected     ││
│  │ 🟡 8 Medium    │      │               │      │               ││
│  └────────────────┘      └────────────────┘      └────────────────┘│
│                                                                      │
│  Priority Actions:                                                   │
│  ├─ [Fix] lodash@4.17.20 → 4.17.21 (Prototype Pollution)          │
│  ├─ [Fix] axios@0.21.1 → 1.6.0 (SSRF vulnerability)               │
│  └─ [Review] SQL injection in src/db/query.ts:45                   │
│                                                                      │
│  [Enable Code Scanning] [Configure Dependabot] [Full Report]        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 15. Required Backend Additions

### 15.1 New Rust Commands

```rust
// Workflow Management
pub async fn github_list_workflow_templates() -> Result<Vec<WorkflowTemplate>, String>
pub async fn github_create_workflow_file(owner: String, repo: String, workflow: WorkflowContent) -> Result<(), String>

// Repository Analysis
pub async fn analyze_repository_for_ci(repo_path: String) -> Result<RepositoryAnalysis, String>
pub async fn generate_workflow_yaml(analysis: RepositoryAnalysis, template: String) -> Result<String, String>

// Security
pub async fn github_list_dependabot_alerts(owner: String, repo: String) -> Result<Vec<DependabotAlert>, String>
pub async fn github_list_code_scanning_alerts(owner: String, repo: String) -> Result<Vec<CodeScanningAlert>, String>
pub async fn github_list_secret_scanning_alerts(owner: String, repo: String) -> Result<Vec<SecretScanningAlert>, String>

// Branch Protection
pub async fn github_get_branch_protection(owner: String, repo: String, branch: String) -> Result<BranchProtection, String>
pub async fn github_update_branch_protection(owner: String, repo: String, branch: String, rules: BranchProtectionRules) -> Result<(), String>

// Required Status Checks
pub async fn github_list_required_status_checks(owner: String, repo: String, branch: String) -> Result<Vec<StatusCheck>, String>
pub async fn github_add_required_status_check(owner: String, repo: String, branch: String, check: String) -> Result<(), String>
```

### 15.2 File Detection Patterns

```rust
pub struct ProjectDetection {
    pub language: String,
    pub package_manager: Option<String>,
    pub build_command: Option<String>,
    pub test_command: Option<String>,
    pub lint_command: Option<String>,
}

pub fn detect_project_type(repo_path: &str) -> Vec<ProjectDetection> {
    let mut detections = vec![];

    // Node.js
    if path_exists(repo_path, "package.json") {
        let pm = if path_exists(repo_path, "pnpm-lock.yaml") { "pnpm" }
                 else if path_exists(repo_path, "yarn.lock") { "yarn" }
                 else { "npm" };
        detections.push(ProjectDetection {
            language: "Node.js".into(),
            package_manager: Some(pm.into()),
            build_command: Some(format!("{pm} run build")),
            test_command: Some(format!("{pm} test")),
            lint_command: Some(format!("{pm} run lint")),
        });
    }

    // Rust
    if path_exists(repo_path, "Cargo.toml") {
        detections.push(ProjectDetection {
            language: "Rust".into(),
            package_manager: Some("cargo".into()),
            build_command: Some("cargo build --release".into()),
            test_command: Some("cargo test".into()),
            lint_command: Some("cargo clippy".into()),
        });
    }

    // ... more languages

    detections
}
```

---

## 16. Sources & References

### Official GitHub Documentation
- [Understanding GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions)
- [Starter Workflows Repository](https://github.com/actions/starter-workflows)
- [Events that trigger workflows](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows)
- [Managing environments for deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Using secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Caching dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [REST API for GitHub Actions](https://docs.github.com/en/rest/actions)
- [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub security features](https://docs.github.com/en/code-security/getting-started/github-security-features)

### Third-Party Resources
- [GitHub Actions: Complete 2025 Guide](https://octopus.com/devops/github-actions/)
- [Advanced GitHub Actions Matrix Strategy](https://devopsdirective.com/posts/2025/08/advanced-github-actions-matrix/)
- [Composite Actions vs Reusable Workflows](https://dev.to/n3wt0n/composite-actions-vs-reusable-workflows-what-is-the-difference-github-actions-11kd)
- [Best Practices for Managing Secrets](https://www.blacksmith.sh/blog/best-practices-for-managing-secrets-in-github-actions)
- [GitHub Actions Caching Best Practices](https://github.com/actions/cache)
- [Awesome GitHub Actions](https://github.com/sdras/awesome-actions)
