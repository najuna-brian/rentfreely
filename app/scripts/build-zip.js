/**
 * Simple build zip for rentfreely app
 * Just copy forms and app, then zip
 */

import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appSrcDir = path.resolve(__dirname, '../');
const formsSrcDir = path.resolve(__dirname, '../../forms');
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;
const zipName = `bundle-v${version}.zip`;
const appBundlesDir = path.resolve(__dirname, '../../app-bundles');
const zipPath = path.join(appBundlesDir, zipName);

function buildZip() {
  // Create app-bundles directory if it doesn't exist
  if (!fs.existsSync(appBundlesDir)) {
    fs.mkdirSync(appBundlesDir, { recursive: true });
  }
  
  const zip = new AdmZip();
  
  // Add app folder
  if (fs.existsSync(appSrcDir)) {
    zip.addLocalFolder(appSrcDir, 'app');
    console.log(`✓ Added app folder`);
  }
  
  // Add forms folder
  if (fs.existsSync(formsSrcDir)) {
    zip.addLocalFolder(formsSrcDir, 'forms');
    console.log(`✓ Added forms folder`);
  }
  
  // Write zip file
  zip.writeZip(zipPath);
  console.log(`✓ Created zip: ${zipPath}`);
}

buildZip();
