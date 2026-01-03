import * as fs from 'fs/promises';
import * as path from 'path';
import * as net from 'net';
/**
 * Validates if the given directory is a Claude Code project
 * by checking for the existence of .claude directory
 */
export async function validateClaudeProject(projectRoot) {
    try {
        const claudeDir = path.join(projectRoot, '.claude');
        const stat = await fs.stat(claudeDir);
        return stat.isDirectory();
    }
    catch {
        return false;
    }
}
/**
 * Ensures the visualizer directory exists and creates .gitignore if needed
 */
export async function ensureVisualizerDir(vizDir) {
    // Create directory if it doesn't exist
    await fs.mkdir(vizDir, { recursive: true });
    // Create .gitignore to ignore graph-data.json
    const gitignorePath = path.join(vizDir, '.gitignore');
    try {
        await fs.access(gitignorePath);
        // File exists, don't overwrite
    }
    catch {
        // File doesn't exist, create it
        await fs.writeFile(gitignorePath, '# Visualizer generated data\ngraph-data.json\n', 'utf-8');
    }
}
/**
 * Finds an available port, starting from the preferred port
 * Tries up to 10 ports after the preferred one if it's in use
 */
export async function findAvailablePort(preferred) {
    const isPortAvailable = (port) => {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => {
                resolve(false);
            });
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen(port);
        });
    };
    // Try preferred port first
    if (await isPortAvailable(preferred)) {
        return preferred;
    }
    // Try next 10 ports
    for (let i = 1; i <= 10; i++) {
        const port = preferred + i;
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error(`No available port found near ${preferred}. ` +
        `Tried ports ${preferred}-${preferred + 10}.`);
}
//# sourceMappingURL=utils.js.map