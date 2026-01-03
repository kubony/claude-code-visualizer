import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

// Type definitions
interface GraphNode {
  id: string;
  type: 'agent' | 'skill';
  name: string;
  description: string;
  filePath: string;
  [key: string]: any;
}

interface AgentNode extends GraphNode {
  type: 'agent';
  tools: string[];
  model: string;
  subagents: string[];
  skills: string[];
  systemPrompt: string;
}

interface SkillNode extends GraphNode {
  type: 'skill';
  subtype?: 'command';
  triggers: string[];
  hasScripts: boolean;
  hasWebapp: boolean;
  argumentHint?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'uses' | 'calls';
}

interface GraphMetadata {
  generatedAt: string;
  projectPath: string;
  projectName: string;
  agentCount: number;
  skillCount: number;
  commandCount: number;
  edgeCount: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

/**
 * Parse YAML front matter from markdown content using regex
 */
function parseYamlFrontmatter(content: string): Record<string, any> {
  const yamlPattern = /^---\s*\n(.*?)\n---\s*\n/s;
  const match = content.match(yamlPattern);

  if (!match) {
    return {};
  }

  const yamlContent = match[1];
  const result: Record<string, any> = {};
  let currentKey: string | null = null;
  let currentList: string[] = [];

  for (const line of yamlContent.split('\n')) {
    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Check for list item
    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch && currentKey) {
      currentList.push(listMatch[1].trim());
      continue;
    }

    // Check for key-value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      // Save previous list if exists
      if (currentKey && currentList.length > 0) {
        result[currentKey] = currentList;
        currentList = [];
      }

      const key = kvMatch[1];
      let value = kvMatch[2].trim();

      if (value) {
        // Handle quoted strings
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        result[key] = value;
        currentKey = null;
      } else {
        // Likely a list follows
        currentKey = key;
      }
    }
  }

  // Save final list if exists
  if (currentKey && currentList.length > 0) {
    result[currentKey] = currentList;
  }

  return result;
}

/**
 * Extract content after YAML front matter
 */
function extractBodyContent(content: string): string {
  const yamlPattern = /^---\s*\n.*?\n---\s*\n/s;
  return content.replace(yamlPattern, '').trim();
}

/**
 * Parse a field that can be either a string (comma-separated) or array
 */
function parseListField(value: any): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Scan agents directory for agent definitions
 */
async function scanAgents(claudePath: string): Promise<AgentNode[]> {
  const agents: AgentNode[] = [];
  const agentsDir = path.join(claudePath, 'agents');

  try {
    await fs.access(agentsDir);
  } catch {
    return agents;
  }

  const agentFiles = await glob('*.md', { cwd: agentsDir });

  for (const file of agentFiles) {
    try {
      const filePath = path.join(agentsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const metadata = parseYamlFrontmatter(content);
      const body = extractBodyContent(content);

      const tools = parseListField(metadata.tools);
      const subagents = parseListField(metadata.subagents);
      const skills = parseListField(metadata.skills);

      const basename = path.parse(file).name;
      const relativePath = path.relative(path.dirname(claudePath), filePath);

      const agent: AgentNode = {
        id: `agent:${basename}`,
        type: 'agent',
        name: metadata.name || basename,
        description: metadata.description || '',
        tools,
        model: metadata.model || '',
        subagents,
        skills,
        filePath: relativePath,
        systemPrompt: body.length > 500 ? body.slice(0, 500) + '...' : body
      };

      agents.push(agent);
    } catch (error: any) {
      console.warn(`Warning: Failed to parse ${file}: ${error.message}`);
    }
  }

  return agents;
}

/**
 * Scan skills directory for skill definitions
 */
async function scanSkills(claudePath: string): Promise<SkillNode[]> {
  const skills: SkillNode[] = [];
  const skillsDir = path.join(claudePath, 'skills');

  try {
    await fs.access(skillsDir);
  } catch {
    return skills;
  }

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillDir = path.join(skillsDir, entry.name);
    const skillFile = path.join(skillDir, 'SKILL.md');

    try {
      await fs.access(skillFile);
    } catch {
      continue;
    }

    try {
      const content = await fs.readFile(skillFile, 'utf-8');
      const metadata = parseYamlFrontmatter(content);
      const body = extractBodyContent(content);

      // Extract trigger patterns from body
      const triggers: string[] = [];
      const triggerMatch = body.match(/##\s*(?:Triggers?|사용\s*시점).*?\n(.*?)(?=\n##|\Z)/is);
      if (triggerMatch) {
        const triggerLines = triggerMatch[1].trim().split('\n');
        triggers.push(
          ...triggerLines
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
            .slice(0, 5) // Limit to 5 triggers
        );
      }

      const relativePath = path.relative(path.dirname(claudePath), skillFile);
      const hasScripts = await fs.access(path.join(skillDir, 'scripts'))
        .then(() => true)
        .catch(() => false);
      const hasWebapp = await fs.access(path.join(skillDir, 'webapp'))
        .then(() => true)
        .catch(() => false);

      const skill: SkillNode = {
        id: `skill:${entry.name}`,
        type: 'skill',
        name: metadata.name || entry.name,
        description: metadata.description || '',
        triggers,
        filePath: relativePath,
        hasScripts,
        hasWebapp
      };

      skills.push(skill);
    } catch (error: any) {
      console.warn(`Warning: Failed to parse ${skillFile}: ${error.message}`);
    }
  }

  return skills;
}

/**
 * Scan commands directory for slash command definitions
 */
async function scanCommands(claudePath: string): Promise<SkillNode[]> {
  const commands: SkillNode[] = [];
  const commandsDir = path.join(claudePath, 'commands');

  try {
    await fs.access(commandsDir);
  } catch {
    return commands;
  }

  const commandFiles = await glob('*.md', { cwd: commandsDir });

  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const metadata = parseYamlFrontmatter(content);

      const basename = path.parse(file).name;
      const relativePath = path.relative(path.dirname(claudePath), filePath);

      const command: SkillNode = {
        id: `skill:${basename}`,
        type: 'skill',
        subtype: 'command',
        name: basename,
        description: metadata.description || '',
        argumentHint: metadata['argument-hint'] || '',
        filePath: relativePath,
        hasScripts: false,
        hasWebapp: false,
        triggers: []
      };

      commands.push(command);
    } catch (error: any) {
      console.warn(`Warning: Failed to parse ${file}: ${error.message}`);
    }
  }

  return commands;
}

/**
 * Find relationships between agents and skills
 */
async function findRelationships(
  agents: AgentNode[],
  skills: SkillNode[],
  claudePath: string
): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];
  const addedEdges = new Set<string>();

  function addEdge(source: string, target: string, type: 'uses' | 'calls') {
    const edgeKey = `${source}->${target}`;
    if (!addedEdges.has(edgeKey)) {
      edges.push({ source, target, type });
      addedEdges.add(edgeKey);
    }
  }

  // Build lookup maps
  const agentMap = new Map<string, string>();
  for (const agent of agents) {
    agentMap.set(agent.name.toLowerCase(), agent.id);
    agentMap.set(agent.id.replace('agent:', '').toLowerCase(), agent.id);
  }

  const skillMap = new Map<string, string>();
  for (const skill of skills) {
    skillMap.set(skill.name.toLowerCase(), skill.id);
    skillMap.set(skill.id.replace('skill:', '').toLowerCase(), skill.id);
  }

  // Process agent relationships from YAML metadata
  for (const agent of agents) {
    // Agent -> Subagent relationships
    for (const subagentName of agent.subagents) {
      const subagentKey = subagentName.toLowerCase().trim();
      const subagentId = agentMap.get(subagentKey);
      if (subagentId) {
        addEdge(agent.id, subagentId, 'calls');
      }
    }

    // Agent -> Skill relationships
    for (const skillName of agent.skills) {
      const skillKey = skillName.toLowerCase().trim();
      const skillId = skillMap.get(skillKey);
      if (skillId) {
        addEdge(agent.id, skillId, 'uses');
      }
    }
  }

  // Check agent files for skill references (content-based)
  for (const agent of agents) {
    const agentFilePath = path.join(path.dirname(claudePath), agent.filePath);
    try {
      const content = (await fs.readFile(agentFilePath, 'utf-8')).toLowerCase();

      for (const skill of skills) {
        const skillName = skill.name.toLowerCase();
        const skillId = skill.id.replace('skill:', '');

        if (content.includes(skillName) || content.includes(skillId)) {
          addEdge(agent.id, skill.id, 'uses');
        }
      }
    } catch {
      // Skip if file can't be read
    }
  }

  return edges;
}

/**
 * Scan a Claude Code project and generate graph data
 */
export async function scanProject(
  projectPath: string,
  outputPath: string
): Promise<GraphMetadata> {
  const project = path.resolve(projectPath);
  const claudePath = path.join(project, '.claude');

  // Verify .claude directory exists
  try {
    await fs.access(claudePath);
  } catch {
    throw new Error(`No .claude folder found in ${project}`);
  }

  // Scan all components
  const agents = await scanAgents(claudePath);
  const skills = await scanSkills(claudePath);
  const commands = await scanCommands(claudePath);

  // Combine skills and commands
  const allSkills = [...skills, ...commands];

  // Find relationships
  const edges = await findRelationships(agents, allSkills, claudePath);

  // Build result
  const result: GraphData = {
    nodes: [...agents, ...allSkills],
    edges,
    metadata: {
      generatedAt: new Date().toISOString(),
      projectPath: project,
      projectName: path.basename(project),
      agentCount: agents.length,
      skillCount: skills.length,
      commandCount: commands.length,
      edgeCount: edges.length
    }
  };

  // Write output
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');

  return result.metadata;
}
