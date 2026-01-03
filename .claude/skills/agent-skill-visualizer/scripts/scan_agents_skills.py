#!/usr/bin/env python3
"""
Agent-Skill Scanner for Claude Code Projects

Scans .claude/ folder structure to extract agent and skill metadata,
generating a JSON file for visualization.

Usage:
    python scan_agents_skills.py /path/to/project --output graph-data.json
    python scan_agents_skills.py . --output webapp/public/data/graph-data.json
"""

import argparse
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any


def parse_yaml_frontmatter(content: str) -> dict[str, Any]:
    """Parse YAML front matter from markdown content using regex."""
    yaml_pattern = r'^---\s*\n(.*?)\n---\s*\n'
    match = re.search(yaml_pattern, content, re.DOTALL)

    if not match:
        return {}

    yaml_content = match.group(1)
    result = {}

    current_key = None
    current_list = []

    for line in yaml_content.split('\n'):
        # Skip empty lines
        if not line.strip():
            continue

        # Check for list item
        list_match = re.match(r'^\s+-\s+(.+)$', line)
        if list_match and current_key:
            current_list.append(list_match.group(1).strip())
            continue

        # Check for key-value pair
        kv_match = re.match(r'^(\w+):\s*(.*)$', line)
        if kv_match:
            # Save previous list if exists
            if current_key and current_list:
                result[current_key] = current_list
                current_list = []

            key = kv_match.group(1)
            value = kv_match.group(2).strip()

            if value:
                # Handle quoted strings
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                result[key] = value
                current_key = None
            else:
                # Likely a list follows
                current_key = key

    # Save final list if exists
    if current_key and current_list:
        result[current_key] = current_list

    return result


def extract_body_content(content: str) -> str:
    """Extract content after YAML front matter."""
    yaml_pattern = r'^---\s*\n.*?\n---\s*\n'
    return re.sub(yaml_pattern, '', content, flags=re.DOTALL).strip()


def scan_agents(claude_path: Path) -> list[dict[str, Any]]:
    """Scan agents directory for agent definitions."""
    agents = []
    agents_dir = claude_path / "agents"

    if not agents_dir.exists():
        return agents

    for agent_file in agents_dir.glob("*.md"):
        try:
            content = agent_file.read_text(encoding='utf-8')
            metadata = parse_yaml_frontmatter(content)
            body = extract_body_content(content)

            # Parse tools - can be a list or comma-separated string
            tools_raw = metadata.get("tools", [])
            if isinstance(tools_raw, str):
                tools = [t.strip() for t in tools_raw.split(",") if t.strip()]
            elif isinstance(tools_raw, list):
                tools = tools_raw
            else:
                tools = []

            # Parse subagents - can be a list or comma-separated string
            subagents_raw = metadata.get("subagents", [])
            if isinstance(subagents_raw, str):
                subagents = [s.strip() for s in subagents_raw.split(",") if s.strip()]
            elif isinstance(subagents_raw, list):
                subagents = subagents_raw
            else:
                subagents = []

            # Parse skills - can be a list or comma-separated string
            skills_raw = metadata.get("skills", [])
            if isinstance(skills_raw, str):
                skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
            elif isinstance(skills_raw, list):
                skills = skills_raw
            else:
                skills = []

            agent = {
                "id": f"agent:{agent_file.stem}",
                "type": "agent",
                "name": metadata.get("name", agent_file.stem),
                "description": metadata.get("description", ""),
                "tools": tools,
                "model": metadata.get("model", ""),
                "subagents": subagents,
                "skills": skills,
                "filePath": str(agent_file.relative_to(claude_path.parent)),
                "systemPrompt": body[:500] + "..." if len(body) > 500 else body
            }
            agents.append(agent)
        except Exception as e:
            print(f"Warning: Failed to parse {agent_file}: {e}")

    return agents


def scan_skills(claude_path: Path) -> list[dict[str, Any]]:
    """Scan skills directory for skill definitions."""
    skills = []
    skills_dir = claude_path / "skills"

    if not skills_dir.exists():
        return skills

    for skill_dir in skills_dir.iterdir():
        if not skill_dir.is_dir():
            continue

        skill_file = skill_dir / "SKILL.md"
        if not skill_file.exists():
            continue

        try:
            content = skill_file.read_text(encoding='utf-8')
            metadata = parse_yaml_frontmatter(content)
            body = extract_body_content(content)

            # Extract trigger patterns from body
            triggers = []
            trigger_match = re.search(r'##\s*(?:Triggers?|사용\s*시점).*?\n(.*?)(?=\n##|\Z)', body, re.DOTALL | re.IGNORECASE)
            if trigger_match:
                trigger_lines = trigger_match.group(1).strip().split('\n')
                triggers = [line.strip('- ').strip() for line in trigger_lines if line.strip().startswith('-')]

            skill = {
                "id": f"skill:{skill_dir.name}",
                "type": "skill",
                "name": metadata.get("name", skill_dir.name),
                "description": metadata.get("description", ""),
                "triggers": triggers[:5],  # Limit to 5 triggers
                "filePath": str(skill_file.relative_to(claude_path.parent)),
                "hasScripts": (skill_dir / "scripts").exists(),
                "hasWebapp": (skill_dir / "webapp").exists()
            }
            skills.append(skill)
        except Exception as e:
            print(f"Warning: Failed to parse {skill_file}: {e}")

    return skills


def scan_commands(claude_path: Path) -> list[dict[str, Any]]:
    """Scan commands directory for slash command definitions."""
    commands = []
    commands_dir = claude_path / "commands"

    if not commands_dir.exists():
        return commands

    for cmd_file in commands_dir.glob("*.md"):
        try:
            content = cmd_file.read_text(encoding='utf-8')
            metadata = parse_yaml_frontmatter(content)
            body = extract_body_content(content)

            # Commands are treated as skills in the graph
            command = {
                "id": f"skill:{cmd_file.stem}",  # Use "skill:" prefix for consistency
                "type": "skill",
                "subtype": "command",  # Mark as command for styling
                "name": cmd_file.stem,
                "description": metadata.get("description", ""),
                "argumentHint": metadata.get("argument-hint", ""),
                "filePath": str(cmd_file.relative_to(claude_path.parent)),
                "hasScripts": False,
                "hasWebapp": False,
                "triggers": []
            }
            commands.append(command)
        except Exception as e:
            print(f"Warning: Failed to parse {cmd_file}: {e}")

    return commands


def find_relationships(agents: list[dict], skills: list[dict], claude_path: Path) -> list[dict[str, str]]:
    """Find relationships between agents and skills."""
    edges = []
    added_edges = set()  # Track added edges to avoid duplicates

    def add_edge(source: str, target: str, edge_type: str):
        edge_key = f"{source}->{target}"
        if edge_key not in added_edges:
            edges.append({
                "source": source,
                "target": target,
                "type": edge_type
            })
            added_edges.add(edge_key)

    # Build lookup maps
    agent_map = {a["name"].lower(): a["id"] for a in agents}
    agent_map.update({a["id"].replace("agent:", "").lower(): a["id"] for a in agents})
    skill_map = {s["name"].lower(): s["id"] for s in skills}
    skill_map.update({s["id"].replace("skill:", "").lower(): s["id"] for s in skills})

    # Read settings.json for skill configurations
    settings_file = claude_path / "settings.json"
    settings = {}
    if settings_file.exists():
        try:
            settings = json.loads(settings_file.read_text(encoding='utf-8'))
        except:
            pass

    # Process agent relationships from YAML metadata
    for agent in agents:
        # Agent -> Subagent relationships (from subagents field)
        for subagent_name in agent.get("subagents", []):
            subagent_key = subagent_name.lower().strip()
            if subagent_key in agent_map:
                add_edge(agent["id"], agent_map[subagent_key], "calls")

        # Agent -> Skill relationships (from skills field)
        for skill_name in agent.get("skills", []):
            skill_key = skill_name.lower().strip()
            if skill_key in skill_map:
                add_edge(agent["id"], skill_map[skill_key], "uses")

    # Check agent files for skill references (content-based)
    for agent in agents:
        agent_file = claude_path.parent / agent["filePath"]
        if agent_file.exists():
            content = agent_file.read_text(encoding='utf-8').lower()

            for skill in skills:
                skill_name = skill["name"].lower()
                skill_id = skill["id"].replace("skill:", "")

                # Check if agent references this skill
                if skill_name in content or skill_id in content:
                    add_edge(agent["id"], skill["id"], "uses")

    return edges


def scan_project(project_path: str, output_path: str) -> dict[str, Any]:
    """Scan a project and generate graph data."""
    project = Path(project_path).resolve()
    claude_path = project / ".claude"

    if not claude_path.exists():
        raise ValueError(f"No .claude folder found in {project}")

    print(f"Scanning: {project}")

    agents = scan_agents(claude_path)
    skills = scan_skills(claude_path)
    commands = scan_commands(claude_path)

    # Combine skills and commands for relationship finding
    all_skills = skills + commands
    edges = find_relationships(agents, all_skills, claude_path)

    # Combine nodes
    nodes = agents + all_skills

    # Build result
    result = {
        "nodes": nodes,
        "edges": edges,
        "metadata": {
            "generatedAt": datetime.now().isoformat(),
            "projectPath": str(project),
            "projectName": project.name,
            "agentCount": len(agents),
            "skillCount": len(skills),
            "commandCount": len(commands),
            "edgeCount": len(edges)
        }
    }

    # Write output
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')

    print(f"Generated: {output}")
    print(f"  Agents: {len(agents)}")
    print(f"  Skills: {len(skills)}")
    print(f"  Commands: {len(commands)}")
    print(f"  Edges: {len(edges)}")

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Scan Claude Code project for agents and skills"
    )
    parser.add_argument(
        "project_path",
        nargs="?",
        default=".",
        help="Path to project root (default: current directory)"
    )
    parser.add_argument(
        "--output", "-o",
        default=".claude/skills/agent-skill-visualizer/webapp/public/data/graph-data.json",
        help="Output JSON file path (default: .claude/skills/agent-skill-visualizer/webapp/public/data/graph-data.json)"
    )

    args = parser.parse_args()

    try:
        scan_project(args.project_path, args.output)
    except Exception as e:
        print(f"Error: {e}")
        exit(1)


if __name__ == "__main__":
    main()
