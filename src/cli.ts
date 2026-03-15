#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import open from 'open';
import { fileURLToPath } from 'url';
import { scanProject } from './scanner.js';
import { startServer } from './server.js';
import {
  validateClaudeProject,
  findAvailablePort,
  ensureVisualizerDir
} from './utils.js';

const DEFAULT_PORT = 3000;
const VISUALIZER_DIR = '.claude/visualizer';
const DATA_FILE = 'graph-data.json';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function run() {
  const program = new Command();

  program
    .name('viewcc')
    .description('Interactive visualization for Claude Code projects')
    .version('1.0.0')
    .option('-p, --port <number>', 'Server port (default: 3000)', '3000')
    .option('--no-open', "Don't open browser automatically")
    .option('--no-scan', 'Skip scanning, use existing data')
    .option('-l, --local', 'Show only local project skills (exclude global)')
    .option('-g, --global', 'Show only global skills (exclude local project)')
    .option('-v, --verbose', 'Verbose logging')
    .parse(process.argv);

  const options = program.opts();
  const cwd = process.cwd();

  try {
    // 0. Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    const REQUIRED_NODE_VERSION = 18;

    if (majorVersion < REQUIRED_NODE_VERSION) {
      console.error(chalk.red('✗ Node.js version too old'));
      console.error(chalk.yellow(`  Current: ${nodeVersion}`));
      console.error(chalk.yellow(`  Required: Node.js ${REQUIRED_NODE_VERSION}+`));
      console.error('');
      console.error(chalk.dim('  Download the latest version:'));
      console.error(chalk.dim('  https://nodejs.org/'));
      process.exit(1);
    }

    if (options.verbose) {
      console.log(chalk.dim(`Node.js ${nodeVersion} ✓`));
    }

    // Determine scan scope
    const includeLocal = !options.global;
    const includeGlobal = !options.local;

    // 1. Validate Claude Code project
    if (options.verbose) {
      console.log(chalk.dim('Checking for .claude directory...'));
    }

    const isValid = await validateClaudeProject(cwd);
    const home = process.env.HOME || process.env.USERPROFILE || '';
    const globalClaudePath = `${home}/.claude`;

    // Check if we have at least one valid source
    let hasGlobal = false;
    try {
      const fs = await import('fs/promises');
      await fs.access(globalClaudePath);
      hasGlobal = true;
    } catch {}

    if (!isValid && !hasGlobal) {
      console.error(chalk.red('✗ No .claude directory found'));
      console.error(chalk.yellow('  Run this command from a Claude Code project root'));
      console.error(chalk.yellow('  Or run "claude init" to create a new project'));
      process.exit(1);
    }

    if (!isValid && includeLocal && !includeGlobal) {
      console.error(chalk.red('✗ No local .claude directory found'));
      console.error(chalk.yellow('  Use --global to view only global skills'));
      process.exit(1);
    }

    if (isValid) {
      console.log(chalk.green('✓ Claude Code project detected'));
    }
    if (hasGlobal && includeGlobal) {
      console.log(chalk.green('✓ Global Claude directory found'));
    }

    // 2. Setup visualizer directory
    const vizDir = path.join(cwd, VISUALIZER_DIR);
    await ensureVisualizerDir(vizDir);
    if (options.verbose) {
      console.log(chalk.dim(`Created ${VISUALIZER_DIR}/`));
    }

    // 3. Scan project (unless --no-scan)
    const dataPath = path.join(vizDir, DATA_FILE);
    if (options.scan !== false) {
      console.log(chalk.blue('📊 Scanning project structure...'));
      const stats = await scanProject(cwd, dataPath, { includeLocal, includeGlobal });
      console.log(chalk.green('✓ Scan complete'));
      if (includeLocal) {
        console.log(chalk.dim(`  Local:  Agents: ${stats.agentCount}, Skills: ${stats.skillCount}, Commands: ${stats.commandCount}`));
      }
      if (includeGlobal) {
        console.log(chalk.dim(`  Global: Agents: ${stats.globalAgentCount}, Skills: ${stats.globalSkillCount}, Commands: ${stats.globalCommandCount}`));
      }
      console.log(chalk.dim(`  Edges: ${stats.edgeCount}`));
    } else {
      console.log(chalk.yellow('⊘ Skipping scan (using existing data)'));
    }

    // 4. Find available port
    const requestedPort = parseInt(options.port);
    const port = await findAvailablePort(requestedPort);
    if (port !== requestedPort) {
      console.log(chalk.yellow(`⚠ Port ${requestedPort} in use, using ${port} instead`));
    }

    // 5. Start server
    console.log(chalk.blue('🚀 Starting server...'));

    // Find dist directory (relative to this compiled file in lib/)
    const distDir = path.join(__dirname, '..', 'dist');

    const { forceShutdown } = await startServer({
      port,
      projectRoot: cwd,
      distDir,
      dataPath
    });

    const url = `http://localhost:${port}`;
    console.log(chalk.green('✓ Server running'));

    // 6. Open browser
    if (options.open !== false) {
      console.log(chalk.blue('🌐 Opening browser...'));
      try {
        await open(url);
      } catch (error) {
        console.log(chalk.yellow('⚠ Could not open browser automatically'));
        console.log(chalk.dim(`  Please open ${url} manually`));
      }
    }

    // 7. Show success message
    console.log('');
    console.log(chalk.green.bold('✨ Claude Code Visualizer is ready!'));
    console.log('');
    console.log(`   ${chalk.cyan.bold(url)}`);
    console.log('');
    console.log(chalk.dim('   Controls:'));
    console.log(chalk.dim('   • Click nodes to view details'));
    console.log(chalk.dim('   • Drag to pan, scroll to zoom'));
    console.log(chalk.dim('   • Use search to filter nodes'));
    console.log('');
    console.log(`   Press ${chalk.yellow('Ctrl+C')} to stop`);
    console.log('');

    // 8. Graceful shutdown
    let isShuttingDown = false;
    const shutdown = async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log('');
      console.log(chalk.blue('👋 Shutting down...'));
      await forceShutdown();
      console.log(chalk.green('✓ Server stopped'));
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error: any) {
    console.error('');
    console.error(chalk.red.bold('✗ Error:'), error.message);
    if (options.verbose && error.stack) {
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
