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

- [Claude Code](https://github.com/anthropics/claude-code) installed
- Python 3.8+
- Node.js 18+

### Installation

#### Option 1: One-line Install (Recommended)

```bash
curl -sL https://raw.githubusercontent.com/YOUR_USERNAME/claude-code-visualizer/main/install.sh | bash
```

#### Option 2: Manual Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/claude-code-visualizer

# Copy files to your Claude Code project
cp -r claude-code-visualizer/.claude/skills/agent-skill-visualizer .claude/skills/
cp claude-code-visualizer/.claude/agents/visualizer-launcher.md .claude/agents/

# Install webapp dependencies
cd .claude/skills/agent-skill-visualizer/webapp
npm install
npm run build
```

### Usage

1. **Scan your project** to generate the graph data:
   ```bash
   python .claude/skills/agent-skill-visualizer/scripts/scan_agents_skills.py
   ```

2. **Start the visualizer**:
   - Use Claude Code and invoke the `visualizer-launcher` agent
   - Or manually:
     ```bash
     # Terminal 1: Start SSE server
     python .claude/skills/agent-skill-visualizer/scripts/stream_server.py

     # Terminal 2: Start webapp
     cd .claude/skills/agent-skill-visualizer/webapp
     npm run dev
     ```

3. **Open in browser**: http://localhost:5173

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

- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)
- Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/claude-code-visualizer/issues)

---

**Made with ❤️ for the Claude Code community**
