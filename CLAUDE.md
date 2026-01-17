# CLAUDE.md - AI Assistant Guide for Claude Code Visualizer

> **Last Updated:** 2026-01-17
> **Repository:** Claude Code Visualizer
> **Purpose:** Interactive visualization tool for Claude Code projects

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Key Components](#key-components)
4. [Development Workflows](#development-workflows)
5. [Common Tasks](#common-tasks)
6. [Guidelines](#guidelines)

---

## Project Overview

### Purpose
An **open-source visualization tool** for Claude Code projects that helps developers understand and navigate their agent-skill relationships through an interactive graph.

### Tech Stack
- **Backend**: Python 3.8+ (scanning, SSE server)
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Graph**: Custom D3.js-like bezier curves
- **Real-time**: Server-Sent Events (SSE)

### Key Features
- Interactive graph visualization with hierarchical layout
- Real-time connection status monitoring
- Execute agents/skills directly from UI
- One-line installation script
- Clean, handle-free node connections

---

## Architecture

### Directory Structure

```
claude-code-visualizer/
├── README.md                    # User-facing documentation
├── CLAUDE.md                    # This file - AI assistant guide
├── LICENSE                      # MIT License
├── install.sh                   # Installation script
├── .gitignore                   # Git ignore rules
│
├── .claude/
│   ├── agents/
│   │   └── visualizer-launcher.md    # Agent to start both servers
│   │
│   └── skills/
│       └── agent-skill-visualizer/
│           ├── SKILL.md               # Skill definition
│           ├── README.md              # Skill documentation
│           │
│           ├── scripts/
│           │   ├── scan_agents_skills.py    # Graph data generator
│           │   └── stream_server.py         # SSE server for activity
│           │
│           └── webapp/
│               ├── package.json
│               ├── vite.config.ts
│               ├── tailwind.config.js
│               │
│               ├── src/
│               │   ├── main.tsx                     # Entry point
│               │   ├── App.tsx                      # Main app component
│               │   │
│               │   ├── components/
│               │   │   ├── NodeCard.tsx            # Graph node rendering
│               │   │   ├── BezierEdge.tsx          # Edge/connection rendering
│               │   │   ├── DetailPanel.tsx         # Right sidebar
│               │   │   ├── CallStack.tsx           # Activity stream
│               │   │   ├── CommandBuilder.tsx      # Execute modal
│               │   │   ├── Legend.tsx              # Graph legend
│               │   │   └── SearchBar.tsx           # Search functionality
│               │   │
│               │   ├── hooks/
│               │   │   ├── useGraphData.ts         # Load graph data
│               │   │   └── useActivityStream.ts    # SSE connection
│               │   │
│               │   ├── types/
│               │   │   └── graph.ts                # TypeScript types
│               │   │
│               │   └── styles/
│               │       └── index.css               # Tailwind base
│               │
│               └── public/
│                   └── data/
│                       └── graph-data.json         # Generated graph data
│
└── docs/                         # Future: detailed documentation
```

---

## Key Components

### 1. scan_agents_skills.py

**Purpose**: Scans `.claude/` folder to extract metadata and generate graph data.

**How it works**:
1. Scans `.claude/agents/*.md` for agent definitions
2. Scans `.claude/skills/*/SKILL.md` for skill definitions
3. Parses YAML frontmatter for metadata
4. Detects relationships:
   - `calls`: Agent → Agent (from `subagents:` field in agent YAML)
   - `uses`: Agent → Skill (from `skills:` field in agent YAML or content references)
   - `orchestrates`: Skill → Agent (from `subagents:` field in skill YAML) **[v1.5.0]**
5. Generates `graph-data.json` with nodes and edges

**YAML Frontmatter Fields**:

Agents (`agents/*.md`):
```yaml
---
name: agent-name
description: Brief description (single line)
tools: [Read, Write, Bash]  # or comma-separated
model: sonnet
subagents:                   # agents this agent calls
  - child-agent-1
skills:                      # skills this agent uses
  - skill-name-1
---
```

Skills (`skills/*/SKILL.md`):
```yaml
---
name: skill-name
description: Brief description (single line)
subagents:                   # agents this skill orchestrates [v1.5.0]
  - agent-name-1
---
```

**Important Notes**:
- Default output: `.claude/skills/agent-skill-visualizer/webapp/public/data/graph-data.json`
- Runs on project root (scans current directory's `.claude/`)
- Content-based detection: mentions of skill names in agent files create edges

**Usage**:
```bash
python .claude/skills/agent-skill-visualizer/scripts/scan_agents_skills.py
# Or with custom output:
python .claude/skills/agent-skill-visualizer/scripts/scan_agents_skills.py --output custom-path.json
```

### 2. stream_server.py

**Purpose**: SSE (Server-Sent Events) server for real-time activity streaming.

**How it works**:
- Watches `.claude/stream.jsonl` for agent/skill activity
- Broadcasts events to connected clients via SSE
- Endpoint: `http://localhost:8765/events`

**Current Status**:
- Connection monitoring works
- Real-time activity tracking is **limited** by Claude Code's current capabilities
- Displays "Connected/Disconnected" status only

**Usage**:
```bash
python .claude/skills/agent-skill-visualizer/scripts/stream_server.py
```

### 3. React Webapp

**Purpose**: Interactive graph visualization UI.

**Key Features**:
- **Graph Layout Algorithm** (`App.tsx:70-180`):
  - Hierarchical layout based on depth
  - Parent agents at depth 0
  - Child agents at increasing depths
  - Skills at rightmost column

- **Node Rendering** (`NodeCard.tsx`):
  - Blue for agents, green for skills
  - No input/output handles (direct box-to-box connections)
  - Displays name, description, model, badges

- **Edge Rendering** (`BezierEdge.tsx`):
  - Indigo solid: Agent → Skill (uses)
  - Purple dashed: Agent → Agent (calls)
  - Emerald short-dash: Skill → Agent (orchestrates) **[v1.5.0]**
  - Bezier curves for smooth connections

- **Interaction**:
  - Click node: show details in sidebar
  - Click "Execute" in sidebar: open command modal
  - Command modal: execute agent/skill via Claude Code CLI

**Build & Run**:
```bash
cd .claude/skills/agent-skill-visualizer/webapp
npm install          # Install dependencies
npm run dev          # Development server (http://localhost:5173)
npm run build        # Production build
```

### 4. visualizer-launcher Agent

**Purpose**: Automates the process of starting both servers and opening the browser.

**Workflow**:
1. Check Python/Node.js installation
2. Install webapp dependencies if needed
3. Generate graph data with `scan_agents_skills.py`
4. Start SSE server in background (PID tracked)
5. Start Vite dev server in background
6. Open browser at `http://localhost:5173`
7. Provide shutdown instructions

---

## Development Workflows

### Workflow 1: Making UI Changes

1. **Start development server**:
   ```bash
   cd .claude/skills/agent-skill-visualizer/webapp
   npm run dev
   ```

2. **Edit files** in `webapp/src/`

3. **Hot reload** automatically applies changes

4. **Build for production**:
   ```bash
   npm run build
   ```

### Workflow 2: Changing Graph Data Structure

1. **Edit `scan_agents_skills.py`** to modify scanning logic

2. **Regenerate data**:
   ```bash
   python .claude/skills/agent-skill-visualizer/scripts/scan_agents_skills.py
   ```

3. **Refresh browser** to see updated graph

### Workflow 3: Adding New Features

1. **Identify component** to modify (see Architecture section)

2. **Make changes** following existing patterns

3. **Test locally** with dev server

4. **Commit with descriptive message**:
   ```bash
   git add .
   git commit -m "[Category] Brief description

   - Detailed change 1
   - Detailed change 2"
   ```

   Categories: `[UI개선]`, `[기능추가]`, `[버그수정]`, `[리팩토링]`, `[문서]`

---

## Common Tasks

### Task 1: Update README badges or links

**Files to edit**:
- `README.md`: Replace `YOUR_USERNAME` with actual GitHub username

**Example**:
```markdown
<!-- Before -->
https://github.com/YOUR_USERNAME/claude-code-visualizer

<!-- After -->
https://github.com/johndoe/claude-code-visualizer
```

### Task 2: Add screenshots to README

1. **Take screenshots** of the visualizer in action

2. **Save to** `docs/screenshots/` directory:
   ```bash
   mkdir -p docs/screenshots
   ```

3. **Add to README**:
   ```markdown
   ## Screenshots

   ![Graph View](docs/screenshots/graph-view.png)
   ![Detail Panel](docs/screenshots/detail-panel.png)
   ```

### Task 3: Modify graph layout algorithm

**File**: `webapp/src/App.tsx` (lines 70-180)

**Current algorithm**:
1. Assign depth 0 to parent agents (have child agents)
2. BFS to calculate child depths
3. Place skill-only agents at max depth + 1
4. Place skills at rightmost column

**To modify**:
- Adjust `HORIZONTAL_GAP` or `VERTICAL_GAP` for spacing
- Change depth calculation logic
- Modify positioning formulas

### Task 4: Change node appearance

**File**: `webapp/src/components/NodeCard.tsx`

**Key sections**:
- Line 17-19: Icon and color config
- Line 22-30: Header styling
- Line 91-118: Border and hover effects

### Task 5: Add new edge type

**Example (v1.5.0 - orchestrates)**:

1. **Update scanner** (`scan_agents_skills.py`):
   ```python
   # Skill → Agent relationships (from subagents field in skills)
   for skill in skills:
       for subagent_name in skill.get("subagents", []):
           subagent_key = subagent_name.lower().strip()
           if subagent_key in agent_map:
               add_edge(skill["id"], agent_map[subagent_key], "orchestrates")
   ```

2. **Update TypeScript types** (`webapp/src/types/graph.ts`):
   ```typescript
   type: 'uses' | 'calls' | 'orchestrates' | 'depends';
   ```

3. **Add color mapping** (`webapp/src/components/BezierEdge.tsx`):
   ```typescript
   const colorMap = {
     uses: '#6366f1',        // indigo (agent→skill)
     calls: '#a855f7',       // purple (agent→agent)
     orchestrates: '#10b981', // emerald (skill→agent)
     depends: '#6b7280'      // gray
   };
   ```

4. **Update Legend** (`webapp/src/components/Legend.tsx`)

### Task 6: Update install.sh URL

**File**: `install.sh` (line 39)

**Change**:
```bash
# Before
curl -sL https://github.com/YOUR_USERNAME/claude-code-visualizer/archive/main.tar.gz

# After
curl -sL https://github.com/johndoe/claude-code-visualizer/archive/main.tar.gz
```

---

## Guidelines

### Do's ✅

1. **Follow existing patterns** - Look at similar components before creating new ones
2. **Keep it simple** - This is a visualization tool, not a full IDE
3. **Test locally** - Always run dev server and test before committing
4. **Write clear commits** - Use Korean category prefixes for consistency
5. **Update docs** - Keep README and this file in sync with code changes
6. **Use TypeScript** - Leverage type safety in React components
7. **Responsive design** - Ensure UI works on different screen sizes

### Don'ts ❌

1. **Don't commit generated files** - `graph-data.json`, `dist/`, `node_modules/`
2. **Don't break installation** - Test `install.sh` on clean environment
3. **Don't add heavy dependencies** - Keep bundle size small
4. **Don't hardcode paths** - Use relative paths or environment variables
5. **Don't remove Activity Stream** - Even if limited, connection status is useful
6. **Don't use emoji in code** - Only in UI text when appropriate
7. **Don't add "depends" edges** - We removed these intentionally (see git history)

### Code Style

**React Components**:
```typescript
// Use functional components with TypeScript
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks at top
  const [state, setState] = useState<Type>(initial);

  // Event handlers
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies]);

  // Render
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};
```

**Python**:
```python
# Type hints
def function_name(param: str) -> dict[str, Any]:
    """Docstring explaining purpose."""
    # Implementation
    return result

# Use pathlib for paths
from pathlib import Path
path = Path("some/path")
```

### Commit Message Format

```
[Category] Brief summary (50 chars or less)

- Detailed explanation of changes
- Why the change was necessary
- Any side effects or considerations

Example:
[UI개선] 그래프 노드 크기 조정

- NODE_WIDTH 240 → 260으로 증가
- 긴 에이전트 이름이 잘리지 않도록 개선
- 레이아웃 간격도 함께 조정하여 균형 유지
```

---

## Important Context

### History of Key Decisions

1. **No handles on nodes**: We removed input/output handles for cleaner design. All connections go directly from box to box.

2. **No "depends" edges**: Skill-to-skill dependencies were removed because they were based on text mentions, not actual runtime dependencies.

3. **Simplified Activity Stream**: Reduced to connection status only because real-time agent tracking is limited in current Claude Code.

4. **Default output path**: Changed to `webapp/public/data/graph-data.json` to avoid sync issues between root and webapp.

5. **Hierarchical layout**: Parent agents (with children) at top, skill-only agents near skills, for clear visual hierarchy.

6. **YAML frontmatter for relationships (v1.5.0)**: Added explicit `skills`/`subagents` fields to YAML frontmatter instead of relying solely on content-based detection. Provides more accurate relationship mapping and enables Skill→Agent orchestration.

### Known Limitations

- **Real-time tracking**: Limited by Claude Code's current streaming capabilities
- **Large graphs**: Performance may degrade with 50+ nodes
- **Mobile support**: Primarily designed for desktop browsers
- **Browser compatibility**: Tested on Chrome/Firefox/Safari, may not work on older browsers

### Future Improvements (Ideas)

- [ ] Search and filter nodes
- [ ] Export graph as image
- [ ] Collapse/expand sections
- [ ] Dark/light theme toggle
- [ ] Graph layout presets (circular, force-directed, etc.)
- [ ] Performance optimization for large graphs
- [ ] Better mobile support
- [ ] Integration tests

---

## Getting Help

When working on this project:
1. Check this CLAUDE.md first
2. Review existing code for patterns
3. Check git history for context on decisions
4. Test changes locally before committing
5. Ask user if unsure about design decisions

**Remember**: This is meant to be a simple, clean visualization tool. Don't over-engineer!

---

## Quick Reference

### File Locations

| Purpose | Path |
|---------|------|
| **Main README** | `/README.md` |
| **This guide** | `/CLAUDE.md` |
| **Install script** | `/install.sh` |
| **Agent** | `/.claude/agents/visualizer-launcher.md` |
| **Skill** | `/.claude/skills/agent-skill-visualizer/SKILL.md` |
| **Scanner** | `/.claude/skills/agent-skill-visualizer/scripts/scan_agents_skills.py` |
| **SSE server** | `/.claude/skills/agent-skill-visualizer/scripts/stream_server.py` |
| **React app** | `/.claude/skills/agent-skill-visualizer/webapp/src/` |
| **Graph data** | `/.claude/skills/agent-skill-visualizer/webapp/public/data/graph-data.json` |

### Common Commands

```bash
# Scan project
python .claude/skills/agent-skill-visualizer/scripts/scan_agents_skills.py

# Start SSE server
python .claude/skills/agent-skill-visualizer/scripts/stream_server.py

# Webapp dev
cd .claude/skills/agent-skill-visualizer/webapp
npm install
npm run dev

# Webapp build
npm run build

# Git
git status
git add .
git commit -m "[Category] Message"
git push

# npm 배포 (viewcc 패키지)
npm publish --access public
# 브라우저에서 npm 인증 페이지가 열리면 로그인하여 인증
```

---

**Last Updated**: 2026-01-17
**Version**: 1.5.0
**Maintainer**: Claude Code community
