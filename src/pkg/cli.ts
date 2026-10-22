/**
 * HelaScript Package Manager CLI (hela-pkg)
 */

import * as fs from 'fs';
import * as path from 'path';
import { initManifest, manifestExists, readManifest } from './manifest.js';
import { installPackage, installAll, getModulesDir } from './installer.js';
import { runScript } from './runner.js';

export async function runPkgCli(args: string[]): Promise<void> {
  const command = args[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  if (command === '--version' || command === '-v' || command === 'version') {
    console.log('hela-pkg v1.0.0 (HelaScript Package Manager)');
    return;
  }

  try {
    switch (command) {
      case 'init': {
        const pkgName = args[1];
        if (manifestExists()) {
          console.log(`⚠️ 'hela.json' දැනටමත් මෙම ස්ථානයේ පවතී.`);
          return;
        }
        const manifest = initManifest(pkgName);
        console.log(`✅ 'hela.json' සාර්ථකව නිර්මාණය විය! (පැකේජය: ${manifest.name})`);
        break;
      }

      case 'install':
      case 'i':
      case 'add': {
        const pkgSource = args[1];
        if (pkgSource) {
          console.log(`📦 පැකේජය ස්ථාපනය කරමින්: ${pkgSource}...`);
          const res = await installPackage(pkgSource);
          console.log(`✅ පැකේජය සාර්ථකව ස්ථාපනය විය: '${res.packageName}' -> hela_modules/${res.packageName}`);
        } else {
          console.log(`📦 hela.json හි සඳහන් සියලු පැකේජ ස්ථාපනය කරමින්...`);
          const results = await installAll();
          if (results.length === 0) {
            console.log(`ℹ️ ස්ථාපනය කිරීමට යැපීම් (dependencies) නොමැත.`);
          } else {
            console.log(`✅ පැකේජ ${results.length}ක් සාර්ථකව ස්ථාපනය විය!`);
          }
        }
        break;
      }

      case 'run': {
        const scriptName = args[1];
        if (!scriptName) {
          console.error(`❌ ධාවනය කිරීමට script නමක් ලබා දෙන්න: 'hela-pkg run <script>'`);
          process.exit(1);
        }
        runScript(scriptName);
        break;
      }

      case 'list':
      case 'ls': {
        const modulesDir = getModulesDir();
        if (!fs.existsSync(modulesDir)) {
          console.log(`ℹ️ ස්ථාපිත පැකේජ කිසිවක් හමු නොවීය (hela_modules හිස්ය).`);
          return;
        }
        const entries = fs.readdirSync(modulesDir);
        console.log(`📋 ස්ථාපිත HelaScript පැකේජ (${entries.length}):`);
        for (const e of entries) {
          console.log(`  - ${e}`);
        }
        break;
      }

      default: {
        console.error(`❌ හඳුනා නොගත් විධානයකි: '${command}'`);
        console.log(`උදව් සඳහා: hela-pkg --help`);
        process.exit(1);
      }
    }
  } catch (err: any) {
    console.error(`\n❌ [hela-pkg දෝෂයකි]: ${err.message}`);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  📦 hela-pkg (හෙළස්ක්‍රිප්ට් පැකේජ කළමනාකරු) v1.0.0            ║
╚══════════════════════════════════════════════════════════════╝

භාවිතය:
  hela-pkg <විධානය> [විකල්ප]

විධාන (Commands):
  init [නම]               නව 'hela.json' ව්‍යාපෘති ලේඛනයක් සකසයි
  install [පැකේජය]        පැකේජයක් ස්ථාපනය කරයි (Local හෝ GitHub repo)
  run <script>            hela.json හි අර්ථ දක්වා ඇති script එකක් ධාවනය කරයි
  list                    ස්ථාපිත පැකේජ ලැයිස්තුගත කරයි
  --help, -h              උදව් පණිවිඩය පෙන්වයි
  --version, -v           අනුවාදය පෙන්වයි

උදාහරණ:
  hela-pkg init
  hela-pkg install ./my-library
  hela-pkg install owner/repo
  hela-pkg run start
`);
}
