const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let content = fs.readFileSync(p, 'utf8');
      if (content.includes("style={{flex: 1}, justifyContent: 'center', alignItems: 'center'}>")) {
        const newContent = content.split("style={{flex: 1}, justifyContent: 'center', alignItems: 'center'}>")
                                  .join("style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>");
        fs.writeFileSync(p, newContent);
        console.log('Fixed', p);
      }
    }
  });
}

walk('d:/renuka/DriveMate/customerApp/src');
