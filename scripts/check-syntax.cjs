const fs = require('fs');
const jsx = fs.readFileSync('src/layouts/LandingLayout.jsx', 'utf8');
const lines = jsx.split('\n');

// Check for common JSX issues
console.log('Total lines:', lines.length);

// Find AccountMenu component
let acStart = -1;
let acEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function AccountMenu')) {
    acStart = i;
    console.log('AccountMenu starts at line', i + 1);
  }
}

// Print AccountMenu section
if (acStart >= 0) {
  // Find the end by looking for the next function or component
  for (let i = acStart + 1; i < lines.length; i++) {
    if (lines[i].includes('function ') && !lines[i].includes('AccountMenu')) {
      acEnd = i;
      console.log('Next function at line', i + 1);
      break;
    }
  }
  if (acEnd < 0) acEnd = lines.length;
  
  console.log('\n=== AccountMenu lines ===');
  for (let i = acStart; i < Math.min(acEnd, acStart + 180); i++) {
    const marker = i === acStart ? '>>>' : (i === acEnd - 1 ? '<<<' : '  ');
    console.log(marker + ' L' + (i + 1) + ': ' + lines[i]);
  }
}

// Check brace balance
let braceDepth = 0;
let parenDepth = 0;
let issues = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  for (let j = 0; j < l.length; j++) {
    const c = l[j];
    if (c === '{') braceDepth++;
    else if (c === '}') braceDepth--;
    else if (c === '(') parenDepth++;
    else if (c === ')') parenDepth--;
  }
  if (braceDepth < 0) {
    issues.push('NEGATIVE BRACES at line ' + (i + 1) + ': ' + l.trim());
    braceDepth = 0;
  }
  if (parenDepth < 0) {
    issues.push('NEGATIVE PARENS at line ' + (i + 1) + ': ' + l.trim());
    parenDepth = 0;
  }
}

console.log('\nFinal brace depth:', braceDepth, 'paren depth:', parenDepth);
if (issues.length > 0) {
  console.log('\nIssues:');
  issues.forEach(i => console.log(' -', i));
} else if (braceDepth === 0 && parenDepth === 0) {
  console.log('No depth issues found');
}
