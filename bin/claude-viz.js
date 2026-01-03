#!/usr/bin/env node

// CLI entry point for claude-viz
import { run } from '../lib/cli.js';

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
