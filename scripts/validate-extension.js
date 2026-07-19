#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const extDir = path.join(root, 'extension');
const manifestPath = path.join(extDir, 'manifest.json');

const FORBIDDEN_PERMISSIONS = new Set([
  'tabs',
  'webRequest',
  'webRequestBlocking',
  'cookies',
  'history',
  'identity',
  'debugger',
  'proxy',
  'browsingData',
  'management',
  'nativeMessaging',
  'pageCapture',
  'privacy',
  'sessions',
]);

const FORBIDDEN_HOST_EXACT = new Set([
  'http://*/*',
  'https://*/*',
  '*://*/*',
  '<all_urls>',
]);

const FORBIDDEN_CODE_PATTERNS = [
  { re: /\beval\s*\(/, msg: 'eval(' },
  { re: /\bnew\s+Function\s*\(/, msg: 'new Function(' },
  { re: /chrome\.webRequest/, msg: 'chrome.webRequest' },
  { re: /innerHTML\s*=\s*[^'"`\n]*\+/, msg: 'innerHTML concat (possible XSS)' },
];

const REQUIRED_FILES = [
  'manifest.json',
  'service-worker.js',
  'content/kinopoisk.js',
  'content/hd-redirect.js',
  'content/adblock-frame.js',
  'css/main.css',
  'rules/adblock.json',
  '16.png',
  '48.png',
  '128.png',
  'popup.html',
  'options.html',
];

const errors = [];
const warnings = [];

function walkJs(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === '_metadata' || name === 'node_modules') continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkJs(full, out);
    else if (name.endsWith('.js')) out.push(full);
  }
  return out;
}

if (!fs.existsSync(manifestPath)) {
  console.error('manifest.json not found');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (manifest.manifest_version !== 3) {
  errors.push('manifest_version must be 3');
}

if (!manifest.version || !/^\d+(\.\d+){1,3}$/.test(manifest.version)) {
  errors.push('invalid version');
}

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(extDir, file))) {
    errors.push('missing file: ' + file);
  }
}

for (const p of manifest.permissions || []) {
  if (FORBIDDEN_PERMISSIONS.has(p)) {
    errors.push('forbidden permission: ' + p);
  }
}

for (const p of manifest.host_permissions || []) {
  if (FORBIDDEN_HOST_EXACT.has(p)) {
    errors.push('broad host_permission not allowed in release: ' + p);
  }
}

const jsFiles = walkJs(extDir);
for (const file of jsFiles) {
  const rel = path.relative(extDir, file);
  if (rel === 'jquery.js' || rel.endsWith(`${path.sep}jquery.js`)) {
    errors.push('jquery.js must not be shipped');
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  if (/\bconsole\.(log|debug|info)\s*\(/.test(text)) {
    warnings.push('console.debug/log in ' + rel);
  }
  for (const { re, msg } of FORBIDDEN_CODE_PATTERNS) {
    if (re.test(text)) errors.push(rel + ': ' + msg);
  }
  if (text.includes('serializeToString(window.document)')) {
    errors.push(rel + ': must not send full page HTML');
  }
  if (text.includes("getCookie('uid')") || text.includes('getCookie("uid")')) {
    errors.push(rel + ': must not read Kinopoisk uid cookie');
  }
}

const bannedNames = [
  'jquery.js',
  'background.js',
  'background_process.js',
  'config.js',
  'backToOrigKP.js',
  'adblock-frame.js',
  'logo.png',
];
for (const name of bannedNames) {
  if (fs.existsSync(path.join(extDir, name))) {
    errors.push('remove obsolete file from extension/: ' + name);
  }
}

if (fs.existsSync(path.join(extDir, '_metadata'))) {
  warnings.push('_metadata present — pack script must exclude it');
}

const rootSecrets = ['extension.pem', 'extension.crx'];
for (const name of rootSecrets) {
  if (fs.existsSync(path.join(root, name))) {
    warnings.push(name + ' exists in repo root — do not upload; keep gitignored');
  }
}

if (warnings.length) {
  console.log('Warnings:');
  for (const w of warnings) console.log('  - ' + w);
}

if (errors.length) {
  console.error('Extension validation failed:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log('Extension validation OK (' + jsFiles.length + ' JS files).');
