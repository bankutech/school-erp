const fs = require('fs');
const file = process.argv[2];
let src = fs.readFileSync(file, 'utf8');

// Strip JSX comments and line/block comments (crude but effective for balance checking)
src = src.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, (m) => m.replace(/[^\n]/g, ' '));
src = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
src = src.replace(/\/\/[^\n]*/g, '');

function lineAt(idx) {
  let line = 1;
  for (let i = 0; i < idx; i++) if (src[i] === '\n') line++;
  return line;
}

const TAGS = new Set(['div','form','select','span','label','button','section','table','tbody','thead','tr','td','th','ul','ol','li','h1','h2','h3','h4','h5','p','a','header','footer','nav','main','aside','svg','g','textarea','option','dialog','details','summary']);

const stack = [];
const issues = [];

// Match open/close tags; open tag content may span lines but must not contain '>' outside braces/strings — approximate
const re = /<(\/?)([a-zA-Z][\w.]*)((?:=>|[^<>]|"[^"]*"|'[^']*')*?)(\/?)>/g;
let m;
while ((m = re.exec(src)) !== null) {
  const closing = m[1] === '/';
  const tag = m[2];
  const selfClose = m[4] === '/';
  if (!TAGS.has(tag)) continue;
  const line = lineAt(m.index);
  if (closing) {
    // find nearest matching open
    let idx = -1;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].tag === tag) { idx = i; break; }
    }
    if (idx === -1) {
      issues.push(`LINE ${line}: </${tag}> with no matching open`);
      continue;
    }
    if (idx !== stack.length - 1) {
      const skipped = stack.slice(idx + 1).map(s => `<${s.tag}>@${s.line}`);
      issues.push(`LINE ${line}: </${tag}> closes over unclosed ${skipped.join(', ')}`);
    }
    stack.splice(idx, 1);
  } else if (!selfClose) {
    stack.push({ tag, line });
  }
}

console.log('--- ISSUES ---');
issues.forEach((i) => console.log(i));
console.log('--- UNCLOSED AT EOF (outermost first) ---');
stack.forEach((s) => console.log(`<${s.tag}> opened line ${s.line}`));
if (!issues.length && !stack.length) console.log('balanced OK');
