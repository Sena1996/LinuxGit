import { create } from 'zustand';

// Project Detection Types
export interface ProjectDetection {
  language: string;
  icon: string;
  packageManager?: string;
  framework?: string;
  buildCommand?: string;
  testCommand?: string;
  lintCommand?: string;
  detected: boolean;
  confidence: 'high' | 'medium' | 'low';
}

// Workflow Template Types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ci' | 'cd' | 'security' | 'release' | 'docs';
  languages: string[];
  icon: string;
  popular: boolean;
  yaml: string;
  variables?: WorkflowVariable[];
}

export interface WorkflowVariable {
  name: string;
  description: string;
  default: string;
  required: boolean;
  options?: string[];
}

// Pre-built Workflow Templates
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // Node.js Templates
  {
    id: 'node-ci',
    name: 'Node.js CI',
    description: 'Build and test Node.js projects with npm, yarn, or pnpm',
    category: 'ci',
    languages: ['Node.js', 'JavaScript', 'TypeScript'],
    icon: '🟢',
    popular: true,
    variables: [
      { name: 'NODE_VERSION', description: 'Node.js version', default: '20', required: false, options: ['18', '20', '22'] },
      { name: 'PACKAGE_MANAGER', description: 'Package manager', default: 'npm', required: false, options: ['npm', 'yarn', 'pnpm'] },
    ],
    yaml: `name: Node.js CI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [{{NODE_VERSION}}]

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: '{{PACKAGE_MANAGER}}'

    - name: Install dependencies
      run: {{PACKAGE_MANAGER}} {{INSTALL_CMD}}

    - name: Run linter
      run: {{PACKAGE_MANAGER}} run lint
      continue-on-error: true

    - name: Run tests
      run: {{PACKAGE_MANAGER}} test

    - name: Build
      run: {{PACKAGE_MANAGER}} run build
`,
  },
  {
    id: 'node-matrix',
    name: 'Node.js Matrix CI',
    description: 'Test across multiple Node.js versions and OS platforms',
    category: 'ci',
    languages: ['Node.js', 'JavaScript', 'TypeScript'],
    icon: '🟢',
    popular: false,
    yaml: `name: Node.js Matrix CI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: \${{ matrix.os }}

    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20, 22]

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'

    - run: npm ci
    - run: npm test
`,
  },

  // Rust Templates
  {
    id: 'rust-ci',
    name: 'Rust CI',
    description: 'Build, test, and lint Rust projects with Cargo',
    category: 'ci',
    languages: ['Rust'],
    icon: '🦀',
    popular: true,
    variables: [
      { name: 'RUST_VERSION', description: 'Rust toolchain', default: 'stable', required: false, options: ['stable', 'beta', 'nightly'] },
    ],
    yaml: `name: Rust CI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

env:
  CARGO_TERM_COLOR: always

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Rust
      uses: dtolnay/rust-toolchain@{{RUST_VERSION}}
      with:
        components: rustfmt, clippy

    - name: Cache cargo
      uses: Swatinem/rust-cache@v2

    - name: Check formatting
      run: cargo fmt --all -- --check

    - name: Run clippy
      run: cargo clippy -- -D warnings

    - name: Build
      run: cargo build --verbose

    - name: Run tests
      run: cargo test --verbose
`,
  },
  {
    id: 'rust-matrix',
    name: 'Rust Matrix CI',
    description: 'Test Rust across multiple platforms and toolchains',
    category: 'ci',
    languages: ['Rust'],
    icon: '🦀',
    popular: false,
    yaml: `name: Rust Matrix CI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

env:
  CARGO_TERM_COLOR: always

jobs:
  build:
    runs-on: \${{ matrix.os }}

    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        rust: [stable, beta]
        include:
          - os: ubuntu-latest
            rust: nightly

    steps:
    - uses: actions/checkout@v4

    - name: Setup Rust \${{ matrix.rust }}
      uses: dtolnay/rust-toolchain@master
      with:
        toolchain: \${{ matrix.rust }}

    - name: Cache cargo
      uses: Swatinem/rust-cache@v2

    - name: Build
      run: cargo build --verbose

    - name: Test
      run: cargo test --verbose
`,
  },

  // Python Templates
  {
    id: 'python-ci',
    name: 'Python CI',
    description: 'Test Python projects with pytest and linting',
    category: 'ci',
    languages: ['Python'],
    icon: '🐍',
    popular: true,
    variables: [
      { name: 'PYTHON_VERSION', description: 'Python version', default: '3.11', required: false, options: ['3.9', '3.10', '3.11', '3.12'] },
    ],
    yaml: `name: Python CI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python {{PYTHON_VERSION}}
      uses: actions/setup-python@v5
      with:
        python-version: '{{PYTHON_VERSION}}'
        cache: 'pip'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install flake8 pytest
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

    - name: Lint with flake8
      run: |
        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
        flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

    - name: Test with pytest
      run: pytest
`,
  },

  // Go Templates
  {
    id: 'go-ci',
    name: 'Go CI',
    description: 'Build and test Go projects',
    category: 'ci',
    languages: ['Go'],
    icon: '🐹',
    popular: true,
    variables: [
      { name: 'GO_VERSION', description: 'Go version', default: '1.22', required: false, options: ['1.21', '1.22', '1.23'] },
    ],
    yaml: `name: Go CI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up Go
      uses: actions/setup-go@v5
      with:
        go-version: '{{GO_VERSION}}'

    - name: Build
      run: go build -v ./...

    - name: Test
      run: go test -v ./...
`,
  },

  // Java Templates
  {
    id: 'java-maven',
    name: 'Java with Maven',
    description: 'Build and test Java projects with Maven',
    category: 'ci',
    languages: ['Java'],
    icon: '☕',
    popular: true,
    yaml: `name: Java CI with Maven

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven

    - name: Build with Maven
      run: mvn -B package --file pom.xml
`,
  },
  {
    id: 'java-gradle',
    name: 'Java with Gradle',
    description: 'Build and test Java projects with Gradle',
    category: 'ci',
    languages: ['Java'],
    icon: '☕',
    popular: false,
    yaml: `name: Java CI with Gradle

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: gradle

    - name: Build with Gradle
      run: ./gradlew build
`,
  },

  // Docker Templates
  {
    id: 'docker-build',
    name: 'Docker Build & Push',
    description: 'Build Docker images and push to GitHub Container Registry',
    category: 'cd',
    languages: ['Docker'],
    icon: '🐳',
    popular: true,
    yaml: `name: Docker Build & Push

on:
  push:
    branches: [ "main" ]
    tags: [ 'v*.*.*' ]
  pull_request:
    branches: [ "main" ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v4

    - name: Log in to Container Registry
      if: github.event_name != 'pull_request'
      uses: docker/login-action@v3
      with:
        registry: \${{ env.REGISTRY }}
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}

    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: \${{ github.event_name != 'pull_request' }}
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}
`,
  },

  // Security Templates
  {
    id: 'codeql',
    name: 'CodeQL Analysis',
    description: 'Find security vulnerabilities with CodeQL',
    category: 'security',
    languages: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'C++', 'C#', 'Ruby'],
    icon: '🔒',
    popular: true,
    yaml: `name: CodeQL Analysis

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  schedule:
    - cron: '0 0 * * 1'

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript' ]

    steps:
    - uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: \${{ matrix.language }}

    - name: Autobuild
      uses: github/codeql-action/autobuild@v3

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
`,
  },
  {
    id: 'dependency-review',
    name: 'Dependency Review',
    description: 'Review dependencies for vulnerabilities on PRs',
    category: 'security',
    languages: ['All'],
    icon: '🔍',
    popular: true,
    yaml: `name: Dependency Review

on: [pull_request]

permissions:
  contents: read
  pull-requests: write

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Dependency Review
      uses: actions/dependency-review-action@v4
      with:
        fail-on-severity: high
`,
  },

  // Release Templates
  {
    id: 'release-please',
    name: 'Release Please',
    description: 'Automated releases with conventional commits',
    category: 'release',
    languages: ['All'],
    icon: '🚀',
    popular: true,
    yaml: `name: Release Please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
    - uses: googleapis/release-please-action@v4
      with:
        release-type: node
`,
  },
  {
    id: 'npm-publish',
    name: 'NPM Publish',
    description: 'Publish packages to npm on release',
    category: 'release',
    languages: ['Node.js', 'JavaScript', 'TypeScript'],
    icon: '📦',
    popular: false,
    yaml: `name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        registry-url: 'https://registry.npmjs.org'

    - run: npm ci
    - run: npm publish
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`,
  },

  // Deployment Templates
  {
    id: 'deploy-pages',
    name: 'Deploy to GitHub Pages',
    description: 'Deploy static sites to GitHub Pages',
    category: 'cd',
    languages: ['All'],
    icon: '📄',
    popular: true,
    yaml: `name: Deploy to GitHub Pages

on:
  push:
    branches: [ "main" ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: './dist'

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
`,
  },
  {
    id: 'deploy-vercel',
    name: 'Deploy to Vercel',
    description: 'Deploy frontend apps to Vercel',
    category: 'cd',
    languages: ['Node.js', 'JavaScript', 'TypeScript'],
    icon: '▲',
    popular: false,
    yaml: `name: Deploy to Vercel

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

env:
  VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Install Vercel CLI
      run: npm install --global vercel@latest

    - name: Pull Vercel Environment
      run: vercel pull --yes --environment=\${{ github.event_name == 'push' && 'production' || 'preview' }} --token=\${{ secrets.VERCEL_TOKEN }}

    - name: Build Project
      run: vercel build \${{ github.event_name == 'push' && '--prod' || '' }} --token=\${{ secrets.VERCEL_TOKEN }}

    - name: Deploy
      run: vercel deploy --prebuilt \${{ github.event_name == 'push' && '--prod' || '' }} --token=\${{ secrets.VERCEL_TOKEN }}
`,
  },

  // Documentation Templates
  {
    id: 'docs-build',
    name: 'Build Documentation',
    description: 'Build and deploy documentation sites',
    category: 'docs',
    languages: ['All'],
    icon: '📚',
    popular: false,
    yaml: `name: Build Documentation

on:
  push:
    branches: [ "main" ]
    paths:
      - 'docs/**'
      - 'README.md'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci
      working-directory: ./docs

    - name: Build docs
      run: npm run build
      working-directory: ./docs
`,
  },

  // Tauri Templates
  {
    id: 'tauri-build',
    name: 'Tauri Build',
    description: 'Build Tauri desktop applications for all platforms',
    category: 'cd',
    languages: ['Rust', 'TypeScript', 'JavaScript'],
    icon: '🖥️',
    popular: false,
    yaml: `name: Tauri Build

on:
  push:
    tags: [ 'v*.*.*' ]

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]

    runs-on: \${{ matrix.platform }}

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install Rust stable
      uses: dtolnay/rust-toolchain@stable

    - name: Install dependencies (Ubuntu only)
      if: matrix.platform == 'ubuntu-latest'
      run: |
        sudo apt-get update
        sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf

    - name: Install frontend dependencies
      run: npm ci

    - name: Build Tauri app
      uses: tauri-apps/tauri-action@v0
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      with:
        tagName: v__VERSION__
        releaseName: 'App v__VERSION__'
        releaseBody: 'See the assets to download this version and install.'
        releaseDraft: true
        prerelease: false
`,
  },
];

// File patterns for project detection
export const FILE_PATTERNS: Record<string, ProjectDetection> = {
  'package.json': {
    language: 'Node.js',
    icon: '🟢',
    detected: false,
    confidence: 'high',
  },
  'Cargo.toml': {
    language: 'Rust',
    icon: '🦀',
    detected: false,
    confidence: 'high',
  },
  'requirements.txt': {
    language: 'Python',
    icon: '🐍',
    detected: false,
    confidence: 'high',
  },
  'pyproject.toml': {
    language: 'Python',
    icon: '🐍',
    detected: false,
    confidence: 'high',
  },
  'setup.py': {
    language: 'Python',
    icon: '🐍',
    detected: false,
    confidence: 'medium',
  },
  'go.mod': {
    language: 'Go',
    icon: '🐹',
    detected: false,
    confidence: 'high',
  },
  'pom.xml': {
    language: 'Java',
    icon: '☕',
    packageManager: 'Maven',
    detected: false,
    confidence: 'high',
  },
  'build.gradle': {
    language: 'Java',
    icon: '☕',
    packageManager: 'Gradle',
    detected: false,
    confidence: 'high',
  },
  'build.gradle.kts': {
    language: 'Kotlin',
    icon: '🟣',
    packageManager: 'Gradle',
    detected: false,
    confidence: 'high',
  },
  'Dockerfile': {
    language: 'Docker',
    icon: '🐳',
    detected: false,
    confidence: 'high',
  },
  'docker-compose.yml': {
    language: 'Docker',
    icon: '🐳',
    detected: false,
    confidence: 'high',
  },
  'docker-compose.yaml': {
    language: 'Docker',
    icon: '🐳',
    detected: false,
    confidence: 'high',
  },
  'Gemfile': {
    language: 'Ruby',
    icon: '💎',
    detected: false,
    confidence: 'high',
  },
  'composer.json': {
    language: 'PHP',
    icon: '🐘',
    detected: false,
    confidence: 'high',
  },
  'pubspec.yaml': {
    language: 'Dart/Flutter',
    icon: '🎯',
    detected: false,
    confidence: 'high',
  },
  'Package.swift': {
    language: 'Swift',
    icon: '🍎',
    detected: false,
    confidence: 'high',
  },
  'CMakeLists.txt': {
    language: 'C/C++',
    icon: '⚙️',
    detected: false,
    confidence: 'high',
  },
  'Makefile': {
    language: 'C/C++',
    icon: '⚙️',
    detected: false,
    confidence: 'medium',
  },
  'tsconfig.json': {
    language: 'TypeScript',
    icon: '🔷',
    detected: false,
    confidence: 'high',
  },
  'tauri.conf.json': {
    language: 'Tauri',
    icon: '🖥️',
    framework: 'Tauri',
    detected: false,
    confidence: 'high',
  },
  'next.config.js': {
    language: 'Node.js',
    icon: '▲',
    framework: 'Next.js',
    detected: false,
    confidence: 'high',
  },
  'next.config.mjs': {
    language: 'Node.js',
    icon: '▲',
    framework: 'Next.js',
    detected: false,
    confidence: 'high',
  },
  'vite.config.ts': {
    language: 'Node.js',
    icon: '⚡',
    framework: 'Vite',
    detected: false,
    confidence: 'high',
  },
  'vite.config.js': {
    language: 'Node.js',
    icon: '⚡',
    framework: 'Vite',
    detected: false,
    confidence: 'high',
  },
};

interface WorkflowTemplatesState {
  // Project detection
  detectedProjects: ProjectDetection[];
  isAnalyzing: boolean;
  analysisComplete: boolean;

  // Template selection
  selectedTemplate: WorkflowTemplate | null;
  customizations: Record<string, string>;

  // Workflow creation
  generatedYaml: string;
  workflowPath: string;
  isCreating: boolean;
  createError: string | null;

  // Existing workflows
  existingWorkflows: string[];

  // Actions
  analyzeRepository: (repoPath: string) => Promise<void>;
  setSelectedTemplate: (template: WorkflowTemplate | null) => void;
  setCustomization: (key: string, value: string) => void;
  generateWorkflow: () => void;
  setWorkflowPath: (path: string) => void;
  createWorkflowFile: (repoPath: string) => Promise<void>;
  checkExistingWorkflows: (repoPath: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  detectedProjects: [],
  isAnalyzing: false,
  analysisComplete: false,
  selectedTemplate: null,
  customizations: {},
  generatedYaml: '',
  workflowPath: '.github/workflows/ci.yml',
  isCreating: false,
  createError: null,
  existingWorkflows: [],
};

export const useWorkflowTemplatesStore = create<WorkflowTemplatesState>((set, get) => ({
  ...initialState,

  analyzeRepository: async (repoPath: string) => {
    set({ isAnalyzing: true, analysisComplete: false });

    try {
      // Import the invoke function from Tauri
      const { invoke } = await import('@tauri-apps/api/core');

      // Call backend to analyze repository files
      const files = await invoke<string[]>('list_repository_files', {
        repoPath,
        maxDepth: 2,
      });

      const detections: ProjectDetection[] = [];
      const seen = new Set<string>();

      for (const file of files) {
        const fileName = file.split('/').pop() || '';
        const pattern = FILE_PATTERNS[fileName];

        if (pattern && !seen.has(pattern.language)) {
          seen.add(pattern.language);

          // Enrich detection based on specific file contents
          const enrichedPattern = { ...pattern, detected: true };

          // Check for package manager specifics
          if (fileName === 'package.json') {
            if (files.includes('pnpm-lock.yaml')) {
              enrichedPattern.packageManager = 'pnpm';
            } else if (files.includes('yarn.lock')) {
              enrichedPattern.packageManager = 'yarn';
            } else if (files.includes('bun.lockb')) {
              enrichedPattern.packageManager = 'bun';
            } else {
              enrichedPattern.packageManager = 'npm';
            }
          }

          detections.push(enrichedPattern);
        }
      }

      // Sort by confidence
      detections.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.confidence] - order[b.confidence];
      });

      set({
        detectedProjects: detections,
        isAnalyzing: false,
        analysisComplete: true,
      });
    } catch (error) {
      console.error('Failed to analyze repository:', error);
      set({ isAnalyzing: false, analysisComplete: true });
    }
  },

  setSelectedTemplate: (template) => {
    if (template) {
      // Set default customizations from template variables
      const defaults: Record<string, string> = {};
      template.variables?.forEach((v) => {
        defaults[v.name] = v.default;
      });

      // Auto-detect package manager
      const { detectedProjects } = get();
      const nodeProject = detectedProjects.find((p) => p.language === 'Node.js');
      if (nodeProject?.packageManager) {
        defaults['PACKAGE_MANAGER'] = nodeProject.packageManager;
        defaults['INSTALL_CMD'] = nodeProject.packageManager === 'npm' ? 'ci' : 'install';
      }

      // Generate initial workflow name from template
      const workflowName = template.id.replace(/-/g, '_');
      set({
        selectedTemplate: template,
        customizations: defaults,
        workflowPath: `.github/workflows/${workflowName}.yml`,
      });
    } else {
      set({ selectedTemplate: template, customizations: {} });
    }
  },

  setCustomization: (key, value) => {
    const { customizations } = get();
    set({ customizations: { ...customizations, [key]: value } });
  },

  generateWorkflow: () => {
    const { selectedTemplate, customizations } = get();
    if (!selectedTemplate) return;

    let yaml = selectedTemplate.yaml;

    // Replace variables
    Object.entries(customizations).forEach(([key, value]) => {
      yaml = yaml.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    set({ generatedYaml: yaml });
  },

  setWorkflowPath: (path) => set({ workflowPath: path }),

  createWorkflowFile: async (repoPath: string) => {
    const { generatedYaml, workflowPath } = get();
    if (!generatedYaml || !workflowPath) return;

    set({ isCreating: true, createError: null });

    try {
      const { invoke } = await import('@tauri-apps/api/core');

      await invoke('create_workflow_file', {
        repoPath,
        workflowPath,
        content: generatedYaml,
      });

      // Refresh existing workflows
      await get().checkExistingWorkflows(repoPath);

      set({ isCreating: false });
    } catch (error) {
      set({
        isCreating: false,
        createError: String(error),
      });
      throw error;
    }
  },

  checkExistingWorkflows: async (repoPath: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const workflows = await invoke<string[]>('list_workflow_files', { repoPath });
      set({ existingWorkflows: workflows });
    } catch {
      set({ existingWorkflows: [] });
    }
  },

  reset: () => set(initialState),
}));

// Helper to get recommended templates based on detected projects
export function getRecommendedTemplates(detectedProjects: ProjectDetection[]): WorkflowTemplate[] {
  const languages = new Set(detectedProjects.map((p) => p.language));
  const frameworks = new Set(detectedProjects.map((p) => p.framework).filter(Boolean));

  return WORKFLOW_TEMPLATES.filter((template) => {
    // Check if any detected language matches
    const languageMatch = template.languages.some(
      (lang) => languages.has(lang) || lang === 'All'
    );

    // Prioritize templates that match detected frameworks
    const frameworkMatch = template.languages.some((lang) => frameworks.has(lang));

    return languageMatch || frameworkMatch;
  }).sort((a, b) => {
    // Sort by: popular first, then by category
    if (a.popular !== b.popular) return a.popular ? -1 : 1;
    return a.category.localeCompare(b.category);
  });
}
