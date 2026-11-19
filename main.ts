// Leonida Platinum II — the hand-in program for the gta6-trophy-guide-02 bounty.
//
// The guide itself is app/: plain static files (index.html, ES modules under js/,
// one stylesheet under css/, and data/trophies.json with the 55 official trophies
// plus our own guides). It runs offline from its own files and makes no network
// request at run time. screenshots/ holds four real renders of the running guide.
//
// This program copies app/ and screenshots/ into the output directory and writes
// dossier.json with the vendored make.fun library (vendor/makefun-frontend.ts,
// byte for byte the kit's copy — never edited). The scorer rebuilds the dossier
// from the same files and requires the two to match byte for byte.
//
// It runs on Node 22 with the standard library only; nothing is installed.
// In the grader the output directory is /output; outside it, set
// MAKEFUN_OUTPUT_DIR, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// POST.json is not copied: the house reads it from the repository at the
// submitted commit, not from /output.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from an empty output directory so a stale file from an earlier run can
// never survive into the hand-in.
mkdirSync(outputDir, { recursive: true });
rmSync(join(outputDir, 'app'), { recursive: true, force: true });
rmSync(join(outputDir, 'screenshots'), { recursive: true, force: true });
rmSync(join(outputDir, 'dossier.json'), { force: true });

cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps for this bounty (reference/gate.json): at most 4 screenshots
// of 256 KiB each, app/ at most 993 files and directories and 48 MiB in all, and
// the dossier text at most 163,840 bytes. buildDossier refuses anything past
// them, so a bad hand-in fails loudly here instead of silently at the gate.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
