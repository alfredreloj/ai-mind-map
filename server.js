const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const CLAUDE_BIN = process.env.CLAUDE_CODE_EXECPATH;
const BASH_PATH  = process.env.CLAUDE_CODE_GIT_BASH_PATH || 'D:\\Git\\bin\\bash.exe';

if (!CLAUDE_BIN) {
  console.error('CLAUDE_CODE_EXECPATH not set — run this from within Claude Code.');
  process.exit(1);
}

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/generate', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const env = { ...process.env, CLAUDE_CODE_GIT_BASH_PATH: BASH_PATH };
  const proc = spawn(CLAUDE_BIN, ['-p', message, '--output-format', 'text'], {
    env,
    timeout: 90000,
  });

  let out = '', err = '';
  proc.stdout.on('data', d => { out += d.toString(); });
  proc.stderr.on('data', d => { err += d.toString(); });
  proc.on('error', e => res.status(500).json({ error: e.message }));
  proc.on('close', code => {
    if (res.headersSent) return;
    if (code !== 0) return res.status(500).json({ error: err.trim() || 'Claude exited with code ' + code });
    res.json({ text: out.trim() });
  });
});

app.listen(3000, () => console.log('Mind Map → http://localhost:3000'));
