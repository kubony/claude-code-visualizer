# Claude Code Visualizer

> Interactive visualization tool for Claude Code agents and skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Claude Code Visualizer** helps you understand and navigate your Claude Code project structure through an interactive graph visualization.

## ✨ Features

- 📊 **Interactive Graph Visualization** - See all your agents and skills in a hierarchical layout
- 🔄 **Real-time Connection Status** - Monitor SSE server connectivity
- 🎯 **Execute from UI** - Run agents and skills directly from the graph
- 🎨 **Clear Visual Hierarchy** - Distinguish between agents, skills, and their relationships
- ⚡ **Fast Navigation** - Click nodes to see details, zoom and pan freely

## 🚀 Quick Start

### Prerequisites

- [Claude Code](https://github.com/anthropics/claude-code) installed (optional)
- Node.js 18+

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
npx viewcc
```

**Advanced options:**
```bash
npx viewcc --no-open       # Don't open browser
npx viewcc --no-scan       # Use existing data
npx viewcc --port 8080     # Custom port
npx viewcc --verbose       # Show detailed logs
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
