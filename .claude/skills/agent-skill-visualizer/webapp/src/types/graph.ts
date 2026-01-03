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
}

export type GraphNode = AgentNode | SkillNode;

export interface GraphEdge {
  source: string;
  target: string;
  type: 'uses' | 'depends' | 'calls';
}

export interface GraphMetadata {
  generatedAt: string;
  projectPath: string;
  projectName: string;
  agentCount: number;
  skillCount: number;
  edgeCount: number;
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
