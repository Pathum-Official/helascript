#!/usr/bin/env node

import { runPkgCli } from '../dist/pkg/cli.js';

const args = process.argv.slice(2);
runPkgCli(args);
