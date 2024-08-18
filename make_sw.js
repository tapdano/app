import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const distPath = join(__dirname, 'dist');
const swTemplatePath = join(__dirname, 'public', 'sw.js');
const swOutputPath = join(__dirname, 'dist', 'sw.js');

function listFiles(dir, baseDir, fileList = []) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      listFiles(filePath, baseDir, fileList);
    } else {
      if (!filePath.toLowerCase().includes('sw.js')) {
        fileList.push('/' + relative(baseDir, filePath));
      }
    }
  });
  return fileList;
}

function updateServiceWorker(fileList) {
  const template = readFileSync(swTemplatePath, 'utf8');
  const updatedSW = template.replace('const CACHE_FILES = [];', `const CACHE_FILES = ${JSON.stringify(fileList).replaceAll('"', "'").replaceAll('\\\\', "/")};`);
  writeFileSync(swOutputPath, updatedSW);
  console.log('Service Worker has been updated with file list.');
}

const fileList = listFiles(distPath, distPath);
updateServiceWorker(fileList);