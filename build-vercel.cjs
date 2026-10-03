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

export default async function(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const url = new URL(req.url, \`\${protocol}://\${req.headers.host}\`);
  
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
  
  try {
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
    console.error(err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}`;
fs.writeFileSync(path.join(outDir, 'functions/__server.func/index.mjs'), wrapperCode);

fs.writeFileSync(path.join(outDir, 'functions/__server.func/.vc-config.json'), JSON.stringify({
  runtime: 'nodejs24.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs'
}));
console.log('Vercel Output API v3 structure generated!');
