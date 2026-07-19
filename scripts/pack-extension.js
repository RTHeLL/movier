#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const extDir = path.join(root, 'extension');
const outDir = path.join(root, 'dist', 'extension');
const zipPath = path.join(root, 'dist', 'movier-extension.zip');
const releasesDir = path.join(root, 'releases', 'extension');
const releasesUnpacked = path.join(releasesDir, 'unpacked');
const releasesZip = path.join(releasesDir, 'movier-extension.zip');
const webPublicExt = path.join(root, 'web', 'public', 'extension');

const SKIP_DIR = new Set(['_metadata', 'node_modules']);
/** Только в корне extension/, не во вложенных папках. */
const SKIP_ROOT_FILE = new Set([
  'jquery.js',
  'background.js',
  'background_process.js',
  'config.js',
  'backToOrigKP.js',
  'adblock-frame.js',
  'logo.png',
  '.DS_Store',
]);

function rimraf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyTree(src, dest, isRoot) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (SKIP_DIR.has(name)) continue;
    if (isRoot && SKIP_ROOT_FILE.has(name)) continue;
    if (name === '.DS_Store') continue;
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) copyTree(from, to, false);
    else fs.copyFileSync(from, to);
  }
}

function writeZipWithPython(sourceDir, destinationZip) {
  const script = `
import zipfile, os, sys
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, _dirs, files in os.walk(src):
        for name in files:
            full = os.path.join(root, name)
            arc = os.path.relpath(full, src).replace(os.sep, '/')
            zf.write(full, arcname=arc)
`;
  const tmp = path.join(root, 'dist', '_zip_pack.py');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, script);
  try {
    execFileSync('python', [tmp, sourceDir, destinationZip], { stdio: 'inherit' });
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

function writeVersionJson(destDir, manifest, size, fileCount) {
  const payload = {
    name: 'Movier',
    version: manifest.version,
    updated: new Date().toISOString().slice(0, 10),
    zip: 'movier-extension.zip',
    bytes: size,
    files: Number(fileCount),
    github: {
      repo: 'https://github.com/RTHeLL/movier',
      releasesDir: 'https://github.com/RTHeLL/movier/tree/main/releases/extension',
      zipRaw:
        'https://github.com/RTHeLL/movier/raw/main/releases/extension/movier-extension.zip',
      unpacked:
        'https://github.com/RTHeLL/movier/tree/main/releases/extension/unpacked',
    },
  };
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(
    path.join(destDir, 'version.json'),
    JSON.stringify(payload, null, 2) + '\n',
  );
}

execFileSync(process.execPath, [path.join(__dirname, 'validate-extension.js')], {
  stdio: 'inherit',
});

rimraf(outDir);
copyTree(extDir, outDir, true);

fs.mkdirSync(path.dirname(zipPath), { recursive: true });
fs.rmSync(zipPath, { force: true });
writeZipWithPython(outDir, zipPath);

const zipCheck = execFileSync(
  'python',
  [
    '-c',
    "import zipfile,sys; n=zipfile.ZipFile(sys.argv[1]).namelist(); assert all('\\\\\\\\' not in x and '\\\\' not in x for x in n), n; assert 'content/adblock-frame.js' in n; print(len(n))",
    zipPath,
  ],
  { encoding: 'utf8' },
).trim();

const manifest = JSON.parse(
  fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'),
);
const size = fs.statSync(zipPath).size;

// GitHub-hosted release artifacts (committed to the repo)
rimraf(releasesUnpacked);
copyTree(outDir, releasesUnpacked, false);
fs.mkdirSync(releasesDir, { recursive: true });
fs.copyFileSync(zipPath, releasesZip);
writeVersionJson(releasesDir, manifest, size, zipCheck);

// Served by the website (Vite public/ → Pages)
rimraf(webPublicExt);
fs.mkdirSync(webPublicExt, { recursive: true });
fs.copyFileSync(zipPath, path.join(webPublicExt, 'movier-extension.zip'));
writeVersionJson(webPublicExt, manifest, size, zipCheck);

const readme = `# Movier extension packages

Готовые файлы для ручной установки расширения.

| Файл | Назначение |
|------|------------|
| \`movier-extension.zip\` | Скачать, распаковать, «Загрузить распакованное» в Chrome |
| \`unpacked/\` | Уже распакованная сборка (можно указать эту папку напрямую после clone) |
| \`version.json\` | Метаданные версии для сайта |

Инструкция: https://kurduk.store/#/install

Версия: **${manifest.version}**
`;
fs.writeFileSync(path.join(releasesDir, 'README.md'), readme);

console.log(
  'Packed Movier ' +
    manifest.version +
    ' → ' +
    path.relative(root, zipPath) +
    ' (' +
    size +
    ' bytes, ' +
    zipCheck +
    ' files)',
);
console.log('  releases: ' + path.relative(root, releasesDir));
console.log('  web public: ' + path.relative(root, webPublicExt));
