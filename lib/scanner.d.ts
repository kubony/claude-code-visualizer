interface GraphMetadata {
    generatedAt: string;
    projectPath: string;
    projectName: string;
    agentCount: number;
    skillCount: number;
    commandCount: number;
    edgeCount: number;
}
/**
 * Scan a Claude Code project and generate graph data
 */
export declare function scanProject(projectPath: string, outputPath: string): Promise<GraphMetadata>;
export {};
//# sourceMappingURL=scanner.d.ts.map