import express from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
/**
 * Start the Express server for serving the visualizer webapp
 */
export async function startServer(options) {
    const app = express();
    // Parse JSON request bodies
    app.use(express.json());
    // CORS headers for development
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });
    // API: Execute Claude Code commands
    app.post('/api/execute', (req, res) => {
        const { instruction, skipPermissions } = req.body;
        // Validate instruction
        if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
            return res.status(400).json({ error: 'instruction is required and must be a non-empty string' });
        }
        // Build Claude Code command
        const flag = skipPermissions ? '--dangerously-skip-permissions ' : '';
        const escapedInstruction = instruction.replace(/'/g, "'\\''");
        const claudeCmd = `claude ${flag}'${escapedInstruction}'`;
        // Platform-specific terminal command
        let terminalCmd;
        const platform = process.platform;
        if (platform === 'darwin') {
            // macOS - AppleScript
            const projectPath = options.projectRoot.replace(/'/g, "'\\''");
            const escapedClaudeCmd = claudeCmd.replace(/'/g, "'\\''");
            const applescript = `tell application "Terminal"\nactivate\ndo script "cd '${projectPath}' && ${escapedClaudeCmd}"\nend tell`;
            terminalCmd = `osascript -e '${applescript.replace(/'/g, "'\\''")}'`;
        }
        else if (platform === 'win32') {
            // Windows
            terminalCmd = `start cmd /K "cd /d "${options.projectRoot}" && ${claudeCmd}"`;
        }
        else {
            // Linux
            terminalCmd = `gnome-terminal -- bash -c "cd '${options.projectRoot}' && ${claudeCmd}; exec bash"`;
        }
        // Execute terminal command
        exec(terminalCmd, (error) => {
            if (error) {
                console.error('Execute error:', error);
                return res.status(500).json({
                    error: error.message,
                    message: 'Failed to open terminal. Make sure your terminal application is available.'
                });
            }
            res.json({
                status: 'started',
                instruction,
                message: 'Terminal started with Claude Code command'
            });
        });
    });
    // API: Serve graph data from user's project
    app.get('/api/graph-data', async (req, res) => {
        try {
            const data = await fs.readFile(options.dataPath, 'utf-8');
            res.json(JSON.parse(data));
        }
        catch (error) {
            res.status(404).json({
                error: 'Graph data not found',
                message: 'Run the scanner first to generate graph data',
                path: options.dataPath
            });
        }
    });
    // API: SSE endpoint for activity stream (optional feature)
    app.get('/api/events', (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        // Send connection event
        res.write('event: connected\n');
        res.write('data: {"status":"connected"}\n\n');
        // Watch stream.jsonl if exists (optional enhancement)
        const streamPath = path.join(options.projectRoot, '.claude/stream.jsonl');
        // Keep connection alive with periodic heartbeats
        const heartbeat = setInterval(() => {
            res.write(':heartbeat\n\n');
        }, 30000);
        // Cleanup on client disconnect
        req.on('close', () => {
            clearInterval(heartbeat);
            res.end();
        });
    });
    // API: Health check
    app.get('/api/health', async (req, res) => {
        const dataExists = await fs.access(options.dataPath)
            .then(() => true)
            .catch(() => false);
        res.json({
            status: 'ok',
            dataExists,
            projectRoot: options.projectRoot,
            dataPath: options.dataPath
        });
    });
    // Serve static webapp files from package dist directory
    app.use(express.static(options.distDir));
    // SPA fallback - serve index.html for all other routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(options.distDir, 'index.html'));
    });
    // Start server
    return new Promise((resolve, reject) => {
        const server = app.listen(options.port, () => {
            resolve(server);
        }).on('error', (err) => {
            reject(new Error(`Failed to start server on port ${options.port}: ${err.message}`));
        });
    });
}
//# sourceMappingURL=server.js.map