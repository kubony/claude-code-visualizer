# View Claude Code

> Interactive visualization tool for Claude Code agents, skills, and commands

[![npm version](https://img.shields.io/npm/v/viewcc.svg)](https://www.npmjs.com/package/viewcc)
[![npm downloads](https://img.shields.io/npm/dm/viewcc.svg)](https://www.npmjs.com/package/viewcc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**View Claude Code** is a powerful tool that visualizes your Claude Code agents, skills, and commands in an interactive graph.
Perfect for understanding agent-skill relationships, navigating complex configurations, and executing agents/skills directly from the UI.

## Features

- **Interactive Graph Visualization** - Beautiful hierarchical layout showing all agents, skills, and commands
- **Global + Local Support** - Scans both project `.claude/` and global `~/.claude/` directories
- **Smart Relationship Mapping** - Automatically detects and visualizes agent-skill connections
- **One-Command Setup** - Just run `npx viewcc` - no installation needed
- **Execute from UI** - Run agents and skills directly from the graph interface
- **Visual Clarity** - Color-coded nodes with distinct styling for local vs global scope
- **Zero Configuration** - Works out of the box with any Claude Code project
- **Responsive Design** - Smooth zoom, pan, and navigation controls

## Quick Start

### Prerequisites

**Required:**
- **Node.js 18+** - The visualizer runs on Node.js. [Download here](https://nodejs.org/)
  - Includes `npx` (required to run the command)
  - Check your version: `node --version`

**Project Requirements:**
- A **Claude Code project** with a `.claude/` directory
  - If you don't have one, run `claude` in your project folder
  - Or use this tool to explore any existing Claude Code project

**Optional:**
- [Claude Code CLI](https://github.com/anthropics/claude-code) - For executing agents/skills from the UI

### Installation

**No installation required!** Just run with npx:

```bash
# Navigate to any Claude Code project
cd ~/my-claude-project

# Run visualizer
npx viewcc
```

That's it! The visualizer will:
- Scan your project's `.claude/` directory
- Scan your global `~/.claude/` directory
- Start the server
- Open your browser automatically

### Usage

**Basic usage:**
```bash
# Visualize current project (local + global)
npx viewcc

# Visualize specific project
cd /path/to/my-claude-project
npx viewcc
```

**CLI Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --port <number>` | Server port | `3000` |
| `--no-open` | Don't open browser automatically | `false` |
| `--no-scan` | Skip scanning, use existing data | `false` |
| `-v, --verbose` | Show detailed logs | `false` |

**Examples:**

```bash
# Use custom port
npx viewcc --port 8080

# Don't open browser (useful for remote servers)
npx viewcc --no-open

# Skip rescanning (faster startup)
npx viewcc --no-scan

# Debug mode with verbose logging
npx viewcc --verbose

# Combine options
npx viewcc --port 5000 --no-open --verbose
```

## How It Works

### Node Types

| Type | Color | Description |
|------|-------|-------------|
| **Agent** | Blue | AI assistants with specific tasks |
| **Skill** | Green | Reusable capabilities with scripts/webapp |
| **Command** | Amber | Slash commands (`/command-name`) |

### Scope

| Scope | Border Style | Location |
|-------|--------------|----------|
| **Local** | Solid | `.claude/` in project |
| **Global** | Dashed (orange) | `~/.claude/` in home |

Use the **Global** toggle button to show/hide global nodes.

### Edge Types

| Type | Style | Meaning |
|------|-------|---------|
| **uses** | Solid indigo | Agent uses a skill/command |
| **calls** | Dashed purple | Agent calls another agent |

### Hierarchy

- **Level 0**: Top-level agents with child agents
- **Level 1+**: Child agents
- **Rightmost**: Skills and commands

## Controls

| Action | Effect |
|--------|--------|
| **Click node** | View details in sidebar |
| **Click "Execute"** | Run agent/skill via Claude Code |
| **Scroll** | Zoom in/out |
| **Drag background** | Pan around |
| **Drag node** | Move node position |
| **Click background** | Deselect node |
| **Global button** | Toggle global nodes visibility |

## Development

### Local Development

If you want to modify or contribute:

```bash
# Clone the repository
git clone https://github.com/kubony/claude-code-visualizer
cd claude-code-visualizer

# Install root dependencies
npm install

# Build the project (TypeScript + webapp, webapp deps auto-installed)
npm run build

# Link locally for testing
npm link

# Test in any Claude Code project
cd ~/other-project
viewcc
```

### Project Structure

```
claude-code-visualizer/
├── src/                    # TypeScript source
│   ├── cli.ts              # CLI entry point
│   ├── scanner.ts          # Project scanner
│   └── server.ts           # Express server
├── lib/                    # Compiled JavaScript
├── dist/                   # Built webapp
└── .claude/
    └── skills/
        └── agent-skill-visualizer/
            └── webapp/     # React/TypeScript app
```

### Building from Source

```bash
# Build everything (TypeScript + webapp)
npm run build

# Webapp only
cd .claude/skills/agent-skill-visualizer/webapp
npm install
npm run dev    # Development mode
npm run build  # Production build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for [Claude Code](https://github.com/anthropics/claude-code) by Anthropic
- Inspired by the need to visualize complex agent-skill relationships

## Contact

- GitHub: [@kubony](https://github.com/kubony)
- Issues: [GitHub Issues](https://github.com/kubony/claude-code-visualizer/issues)

---

**Made with Claude Code**
