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

const wrapperCode = `
export default async function(req, res) {
  try {
    const serverModule = await import('./server.js');
    const serverObj = serverModule.default || serverModule;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url, \`\${protocol}://\${host}\`);
    
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) value.forEach(v => headers.append(key, v));
      else headers.set(key, value);
    }
    
    const init = { method: req.method, headers };
    
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      init.body = Buffer.concat(buffers);
    }
    
    const request = new Request(url, init);
    const fetchHandler = serverObj.default || serverObj;
    const response = await fetchHandler.fetch(request, {}, {});
    
    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error('VERCEL ADAPTER ERROR:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Vercel Adapter Error: ' + (err.stack || err.message || String(err)));
  }
}`;
fs.writeFileSync(path.join(outDir, 'functions/__server.func/index.mjs'), wrapperCode);

fs.writeFileSync(path.join(outDir, 'functions/__server.func/package.json'), JSON.stringify({
  type: 'module'
}));

fs.writeFileSync(path.join(outDir, 'functions/__server.func/.vc-config.json'), JSON.stringify({
  runtime: 'nodejs24.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs'
}));

const { nodeFileTrace } = require('@vercel/nft');
const functionDir = path.join(outDir, 'functions/__server.func');
const filesToTrace = [];
function findJsFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) findJsFiles(fullPath);
    else if (fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) filesToTrace.push(fullPath);
  }
}
findJsFiles(functionDir);

nodeFileTrace(filesToTrace, {
  base: process.cwd(),
}).then(({ fileList }) => {
  let copiedCount = 0;
  for (const file of fileList) {
    if (file.startsWith('node_modules')) {
      const src = path.join(process.cwd(), file);
      const dest = path.join(outDir, 'functions/__server.func', file);
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        copiedCount++;
      }
    }
  }
  console.log(`Vercel Output API v3 structure generated! Copied ${copiedCount} node_modules files.`);
}).catch(err => {
  console.error('NFT failed:', err);
  process.exit(1);
});
