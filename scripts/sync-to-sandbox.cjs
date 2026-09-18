const fs = require('fs');
const path = require('path');

const outer = 'c:\\Users\\Mitchell\\Downloads\\migration';
const sandbox = 'c:\\Users\\Mitchell\\Downloads\\try\\test\\migration';

// Sync src directory
const srcItems = fs.readdirSync(path.join(outer, 'src'));
console.log('Syncing src/...');
srcItems.forEach(function(item) {
  const op = path.join(outer, 'src', item);
  const sp = path.join(sandbox, 'src', item);
  try {
    if (fs.statSync(op).isDirectory()) {
      if (!fs.existsSync(sp)) {
        fs.cpSync(op, sp, {recursive: true});
        console.log('dir:', item);
      }
    } else {
      fs.copyFileSync(op, sp);
      console.log('file:', item);
    }
  } catch (e) {
    console.log('skip:', item, e.message);
  }
});
console.log('src sync complete');

// Sync root files
const rootItems = fs.readdirSync(outer);
console.log('Syncing root...');
rootItems.forEach(function(item) {
  const op = path.join(outer, item);
  const sp = path.join(sandbox, item);
  try {
    if (fs.statSync(op).isFile()) {
      fs.copyFileSync(op, sp);
    }
  } catch (e) {
    // skip dirs
  }
});
console.log('root sync complete');
