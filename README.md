# Claude Code Visualizer

> Interactive visualization tool for Claude Code agents and skills

[![npm version](https://img.shields.io/npm/v/viewcc.svg)](https://www.npmjs.com/package/viewcc)
[![npm downloads](https://img.shields.io/npm/dm/viewcc.svg)](https://www.npmjs.com/package/viewcc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

📊 **Claude Code Visualizer** is a powerful tool that visualizes your entire Claude Code project structure in an interactive graph.
Perfect for understanding agent-skill relationships, navigating complex projects, and executing agents/skills directly from the UI.

## ✨ Features

- 🎨 **Interactive Graph Visualization** - Beautiful hierarchical layout showing all agents and skills
- 🔍 **Smart Relationship Mapping** - Automatically detects and visualizes agent-skill connections
- ⚡ **One-Command Setup** - Just run `npx viewcc` - no installation needed
- 🎯 **Execute from UI** - Run agents and skills directly from the graph interface
- 🔄 **Real-time Monitoring** - Live connection status and activity tracking
- 🎭 **Visual Clarity** - Color-coded nodes and Bezier curves for easy understanding
- 🚀 **Zero Configuration** - Works out of the box with any Claude Code project
- 📱 **Responsive Design** - Smooth zoom, pan, and navigation controls

## 🚀 Quick Start

### Prerequisites

**Required:**
- **Node.js 18+** - The visualizer runs on Node.js. [Download here](https://nodejs.org/)
  - Includes `npx` (required to run the command)
  - Check your version: `node --version`

**Project Requirements:**
- A **Claude Code project** with a `.claude/` directory
  - If you don't have one, run `claude init` in your project folder
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
- ✅ Scan your project
- ✅ Start the server
- ✅ Open your browser automatically

### Usage

**Basic usage:**
```bash
# Visualize current project
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

### Local Development

If you want to modify or contribute:

```bash
# Clone the repository
git clone https://github.com/kubony/claude-code-visualizer
cd claude-code-visualizer

# Install dependencies
npm install

# Build the project
npm run build

# Link locally
npm link

# Test in any Claude Code project
cd ~/other-project
viewcc
```

## 📖 How It Works

### Graph Structure

- **Blue nodes**: Agents (AI assistants with specific tasks)
- **Green nodes**: Skills (reusable capabilities)
- **Purple lines**: Agent calls another agent
- **Indigo lines**: Agent uses a skill

### Hierarchy

- **Level 0**: Top-level agents with child agents
- **Level 1**: Child agents
- **Level 2**: Leaf agents (skill-only)
- **Level 3**: Skills

## 🎮 Controls

- **Click node**: View details in sidebar
- **Click "Execute" button**: Run agent/skill via Claude Code
- **Scroll**: Zoom in/out
- **Drag**: Pan around
- **Click background**: Deselect node

## 🛠️ Development

### Project Structure

```
.claude/
├── agents/
│   └── visualizer-launcher.md    # Agent to start servers
└── skills/
    └── agent-skill-visualizer/
        ├── SKILL.md              # Skill definition
        ├── scripts/
        │   ├── scan_agents_skills.py    # Graph data generator
        │   └── stream_server.py         # SSE server
        └── webapp/
            ├── src/              # React/TypeScript app
            └── public/data/      # Generated graph data
```

### Building from Source

```bash
cd .claude/skills/agent-skill-visualizer/webapp
npm install
npm run dev    # Development mode
npm run build  # Production build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for [Claude Code](https://github.com/anthropics/claude-code) by Anthropic
- Inspired by the need to visualize complex agent-skill relationships
- Uses D3.js for graph rendering

## 📧 Contact

- GitHub: [@kubony](https://github.com/kubony)
- Issues: [GitHub Issues](https://github.com/kubony/claude-code-visualizer/issues)

---

**Made with ❤️ for the Claude Code community**
