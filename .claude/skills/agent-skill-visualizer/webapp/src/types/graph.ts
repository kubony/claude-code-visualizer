export type NodeScope = 'local' | 'global';

export interface AgentNode {
  id: string;
  type: 'agent';
  name: string;
  description: string;
  tools: string[];
  model: string;
  subagents: string[];
  skills: string[];
  filePath: string;
  systemPrompt: string;
  scope: NodeScope;
}

export interface SkillNode {
  id: string;
  type: 'skill';
  name: string;
  description: string;
  triggers: string[];
  filePath: string;
  hasScripts: boolean;
  hasWebapp: boolean;
  scope: NodeScope;
  subagents?: string[];
}

export interface CommandNode {
  id: string;
  type: 'command';
  name: string;
  description: string;
  argumentHint: string;
  filePath: string;
  scope: NodeScope;
}

export type GraphNode = AgentNode | SkillNode | CommandNode;

export interface GraphEdge {
  source: string;
  target: string;
  type: 'uses' | 'depends' | 'calls' | 'orchestrates';
}

export interface GraphMetadata {
  generatedAt: string;
  projectPath: string;
  projectName: string;
  agentCount: number;
  skillCount: number;
  commandCount: number;
  edgeCount: number;
  globalAgentCount?: number;
  globalSkillCount?: number;
  globalCommandCount?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

// Helper type guards
export function isAgentNode(node: GraphNode): node is AgentNode {
  return node.type === 'agent';
}

export function isSkillNode(node: GraphNode): node is SkillNode {
  return node.type === 'skill';
}

export function isCommandNode(node: GraphNode): node is CommandNode {
  return node.type === 'command';
}
