#!/bin/bash

set -e

echo "🚀 Installing Claude Code Visualizer..."
echo ""

# Check if .claude directory exists
if [ ! -d ".claude" ]; then
  echo "❌ Error: .claude directory not found."
  echo "   Are you in a Claude Code project?"
  echo "   Run 'claude init' first if this is a new project."
  exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "❌ Error: Python 3 is required but not installed."
  exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js is required but not installed."
  exit 1
fi

# Create directories if they don't exist
mkdir -p .claude/skills
mkdir -p .claude/agents

# Download and extract
echo "📦 Downloading visualizer..."
TEMP_DIR=$(mktemp -d)
curl -sL https://github.com/YOUR_USERNAME/claude-code-visualizer/archive/main.tar.gz | \
  tar xz --strip-components=1 -C "$TEMP_DIR"

# Copy files
echo "📋 Copying agent and skill files..."
cp -r "$TEMP_DIR/.claude/skills/agent-skill-visualizer" .claude/skills/
cp "$TEMP_DIR/.claude/agents/visualizer-launcher.md" .claude/agents/

# Install webapp dependencies
echo "📦 Installing webapp dependencies..."
cd .claude/skills/agent-skill-visualizer/webapp
npm install

# Build webapp
echo "🔨 Building webapp..."
npm run build

cd - > /dev/null

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Installation complete!"
echo ""
echo "📖 Usage:"
echo "   1. Scan your project:"
echo "      python .claude/skills/agent-skill-visualizer/scripts/scan_agents_skills.py"
echo ""
echo "   2. Start the visualizer:"
echo "      Use the 'visualizer-launcher' agent in Claude Code"
echo ""
echo "   3. Open in browser:"
echo "      http://localhost:5173"
echo ""
echo "📚 Documentation: https://github.com/YOUR_USERNAME/claude-code-visualizer"
