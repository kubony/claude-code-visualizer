import express, { Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Server } from 'http';
import { exec, execFile } from 'child_process';

export interface ServerOptions {
  port: number;
  projectRoot: string;
  distDir: string;
  dataPath: string;
}

/**
 * Start the Express server for serving the visualizer webapp
 */
export async function startServer(options: ServerOptions): Promise<Server> {
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
  app.post('/api/execute', (req: Request, res: Response) => {
    const { instruction, skipPermissions } = req.body;

    // Validate instruction
    if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
      return res.status(400).json({ error: 'instruction is required and must be a non-empty string' });
    }

    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS - AppleScript using execFile to avoid shell escaping issues
      const flag = skipPermissions ? '--dangerously-skip-permissions ' : '';

      // Build the shell command that will run in Terminal
      // Use JSON.stringify to properly escape for the shell
      const shellCommand = `cd ${JSON.stringify(options.projectRoot)} && claude ${flag}${JSON.stringify(instruction)}`;

      // Build AppleScript - use JSON.stringify again for AppleScript string escaping
      const applescript = `tell application "Terminal"\nactivate\ndo script ${JSON.stringify(shellCommand)}\nend tell`;

      // Use execFile with arguments array to avoid shell escaping
      execFile('osascript', ['-e', applescript], (error) => {
        if (error) {
          console.error('Execute error:', error);
          return res.status(500).json({
            error: error.message,
            message: 'Failed to open terminal. Make sure Terminal.app is available.'
          });
        }

        res.json({
          status: 'started',
          instruction,
          message: 'Terminal started with Claude Code command'
        });
      });
    } else if (platform === 'win32') {
      // Windows
      const flag = skipPermissions ? '--dangerously-skip-permissions ' : '';
      const terminalCmd = `start cmd /K "cd /d "${options.projectRoot}" && claude ${flag}"${instruction}""`;

      exec(terminalCmd, (error) => {
        if (error) {
          console.error('Execute error:', error);
          return res.status(500).json({
            error: error.message,
            message: 'Failed to open terminal.'
          });
        }

        res.json({
          status: 'started',
          instruction,
          message: 'Terminal started with Claude Code command'
        });
      });
    } else {
      // Linux
      const flag = skipPermissions ? '--dangerously-skip-permissions ' : '';
      const terminalCmd = `gnome-terminal -- bash -c "cd '${options.projectRoot}' && claude ${flag}'${instruction.replace(/'/g, "'\\''")}'; exec bash"`;

      exec(terminalCmd, (error) => {
        if (error) {
          console.error('Execute error:', error);
          return res.status(500).json({
            error: error.message,
            message: 'Failed to open terminal. Make sure gnome-terminal is available.'
          });
        }

        res.json({
          status: 'started',
          instruction,
          message: 'Terminal started with Claude Code command'
        });
      });
    }
  });

  // API: Serve graph data from user's project
  app.get('/api/graph-data', async (req: Request, res: Response) => {
    try {
      const data = await fs.readFile(options.dataPath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error: any) {
      res.status(404).json({
        error: 'Graph data not found',
        message: 'Run the scanner first to generate graph data',
        path: options.dataPath
      });
    }
  });

  // API: SSE endpoint for activity stream (optional feature)
  app.get('/api/events', (req: Request, res: Response) => {
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
  app.get('/api/health', async (req: Request, res: Response) => {
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
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(options.distDir, 'index.html'));
  });

  // Start server
  return new Promise((resolve, reject) => {
    const server = app.listen(options.port, () => {
      resolve(server);
    }).on('error', (err: Error) => {
      reject(new Error(`Failed to start server on port ${options.port}: ${err.message}`));
    });
  });
}
