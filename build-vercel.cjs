const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), '.vercel/output');
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(outDir, 'static'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'functions/__server.func'), { recursive: true });

fs.cpSync('dist/client', path.join(outDir, 'static'), { recursive: true });
fs.cpSync('dist/server', path.join(outDir, 'functions/__server.func'), { recursive: true });

fs.writeFileSync(path.join(outDir, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/__server' }
  ]
}));

const wrapperCode = `import serverObj from './server.js';
export default function(req) {
  return (serverObj.default || serverObj).fetch(req, {}, {});
}`;
fs.writeFileSync(path.join(outDir, 'functions/__server.func/index.mjs'), wrapperCode);

fs.writeFileSync(path.join(outDir, 'functions/__server.func/.vc-config.json'), JSON.stringify({
  runtime: 'nodejs24.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs'
}));
console.log('Vercel Output API v3 structure generated!');
