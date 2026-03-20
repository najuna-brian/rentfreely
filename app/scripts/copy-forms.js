/**
 * Simple copy forms from root /forms directory to app/forms
 * No validation - just copy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const formsSrcDir = path.resolve(__dirname, '../../forms');
const formsDestDir = path.resolve(__dirname, '../forms');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    fs.readdirSync(src).forEach((item) => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      copyRecursive(srcPath, destPath);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function copyForms() {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(formsDestDir)) {
    fs.mkdirSync(formsDestDir, { recursive: true });
  }

  // Clear existing forms
  if (fs.existsSync(formsDestDir)) {
    fs.readdirSync(formsDestDir).forEach((item) => {
      const itemPath = path.join(formsDestDir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
    });
  }

  // Copy forms
  if (!fs.existsSync(formsSrcDir)) {
    console.warn(`⚠️  Forms source directory not found: ${formsSrcDir}`);
    return;
  }

  fs.readdirSync(formsSrcDir).forEach((item) => {
    const srcPath = path.join(formsSrcDir, item);
    const destPath = path.join(formsDestDir, item);

    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
      console.log(`✓ Copied form: ${item}`);
    }
  });

  console.log(`\n✓ Forms copied to ${formsDestDir}`);
}

copyForms();
