# LinuxGit

A modern, AI-enabled Git desktop application for Linux built with Tauri, React, and Rust.

![LinuxGit](https://img.shields.io/badge/Platform-Linux-blue) ![Tauri](https://img.shields.io/badge/Tauri-2.0-orange) ![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Modern UI** - Beautiful Aurora-themed interface with dark/light mode support
- **Git Operations** - Stage, commit, branch, merge, and view history
- **AI Commit Messages** - Generate commit messages using Ollama (local) or OpenAI
- **Command Palette** - Quick access to all commands with `Ctrl+Shift+P`
- **Diff Viewer** - Side-by-side diff visualization with syntax highlighting
- **Branch Management** - Create, switch, merge, and delete branches

## Screenshots

*Coming soon*

## Installation

### Prerequisites

- Linux (Ubuntu 22.04+ recommended)
- Node.js 18+ and pnpm
- Rust 1.70+
- System dependencies:

```bash
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev \
  libgdk-pixbuf2.0-dev \
  libcairo2-dev \
  libpango1.0-dev \
  libatk1.0-dev \
  build-essential \
  libssl-dev \
  libxdo-dev \
  pkg-config
```

### Build from Source

```bash
# Clone the repository
git clone https://github.com/Sena1996/LinuxGit.git
cd LinuxGit/app

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Project Structure

```
LinuxGit/
├── Documentation/           # Project documentation
├── app/
│   ├── src/                 # React frontend
│   │   ├── components/      # UI components
│   │   ├── views/           # Main views
│   │   ├── hooks/           # React hooks
│   │   └── stores/          # Zustand state
│   └── src-tauri/           # Rust backend
│       └── src/
│           ├── git/         # Git operations (git2-rs)
│           ├── ai/          # AI integrations
│           └── commands/    # Tauri IPC
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Rust, Tauri 2.0, git2-rs
- **State**: Zustand
- **AI**: Ollama (local), OpenAI API

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+1` | Changes View |
| `Ctrl+2` | History View |
| `Ctrl+3` | Branches View |
| `Ctrl+,` | Settings |

## Configuration

### AI Providers

**Ollama (Local)**
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull codellama`
3. Select "Ollama" in Settings > AI

**OpenAI**
1. Get API key from https://platform.openai.com
2. Enter key in Settings > AI > OpenAI API Key

## Contributing

Contributions are welcome! Please read the documentation in the `Documentation/` folder before contributing.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Tauri](https://tauri.app) - Desktop app framework
- [git2-rs](https://github.com/rust-lang/git2-rs) - Rust bindings for libgit2
- [Ollama](https://ollama.ai) - Local AI models
