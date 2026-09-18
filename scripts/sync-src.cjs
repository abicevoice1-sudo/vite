const fs = require('fs');
const path = require('path');

const o = 'c:/Users/Mitchell/Downloads/migration/src';
const s = 'c:/Users/Mitchell/Downloads/try/test/migration/src';

['layouts', 'components', 'lib', 'styles', 'hooks', 'assets', 'pages', 'features'].forEach(dir => {
  const op = path.join(o, dir);
  const sp = path.join(s, dir);
  try {
    if (fs.statSync(op).isDirectory()) {
      if (fs.existsSync(sp)) {
        const items = fs.readdirSync(op);
        items.forEach(function(item) {
          const oi = path.join(op, item);
          const si = path.join(sp, item);
          try {
            if (fs.statSync(oi).isFile()) {
              fs.copyFileSync(oi, si);
              console.log('src/' + dir + '/' + item);
            }
          } catch (e) {}
        });
      } else {
        fs.cpSync(op, sp, {recursive: true});
        console.log('dir copy:', dir);
      }
    }
  } catch (e) {
    console.log('skip:', dir);
  }
});
console.log('done');
