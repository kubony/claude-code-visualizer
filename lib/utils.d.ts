/**
 * Validates if the given directory is a Claude Code project
 * by checking for the existence of .claude directory
 */
export declare function validateClaudeProject(projectRoot: string): Promise<boolean>;
/**
 * Ensures the visualizer directory exists and creates .gitignore if needed
 */
export declare function ensureVisualizerDir(vizDir: string): Promise<void>;
/**
 * Finds an available port, starting from the preferred port
 * Tries up to 10 ports after the preferred one if it's in use
 */
export declare function findAvailablePort(preferred: number): Promise<number>;
//# sourceMappingURL=utils.d.ts.map