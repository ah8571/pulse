// Pulse latency experiment server
// Run with: node experiment/server.js
// Then open: http://localhost:3000
//
// No dependencies. Generates fake AI chat conversations of any length
// and serves them as JSON (optionally gzip-compressed) so the browser
// page can measure where time is actually spent.

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 3000;

// ---------------------------------------------------------------------------
// Fake conversation generator
// ---------------------------------------------------------------------------

const WORDS = (
  'latency payload stream decode render network server database query cache ' +
  'token model context retrieval citation source answer question analysis ' +
  'structure binary format parse allocate memory thread worker frame budget ' +
  'incremental progressive virtual scroll hydrate mount effect state update'
).split(' ');

function sentence(rand) {
  const len = 8 + Math.floor(rand() * 12);
  const parts = [];
  for (let i = 0; i < len; i++) {
    parts.push(WORDS[Math.floor(rand() * WORDS.length)]);
  }
  const s = parts.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

// Deterministic pseudo-random generator so payloads are reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeConversation(messageCount) {
  const rand = mulberry32(42);
  const messages = [];
  for (let i = 0; i < messageCount; i++) {
    const isUser = i % 2 === 0;
    // Assistant messages are longer, like real AI replies.
    const sentenceCount = isUser ? 1 + Math.floor(rand() * 2)
                                 : 4 + Math.floor(rand() * 8);
    const content = [];
    for (let s = 0; s < sentenceCount; s++) content.push(sentence(rand));

    const msg = {
      id: 'msg_' + i,
      role: isUser ? 'user' : 'assistant',
      createdAt: 1700000000000 + i * 60000,
      content: content.join(' '),
    };

    // Assistant messages sometimes carry structured citations,
    // like an AI side panel would.
    if (!isUser && rand() > 0.5) {
      msg.citations = [];
      const n = 1 + Math.floor(rand() * 4);
      for (let c = 0; c < n; c++) {
        msg.citations.push({
          title: sentence(rand),
          url: 'https://example.com/doc/' + Math.floor(rand() * 100000),
          snippet: sentence(rand) + ' ' + sentence(rand),
          score: Math.round(rand() * 1000) / 1000,
        });
      }
    }
    messages.push(msg);
  }
  return { conversationId: 'conv_demo', messageCount, messages };
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/conversation') {
    const count = Math.min(parseInt(url.searchParams.get('messages') || '100', 10), 50000);
    const useGzip = url.searchParams.get('gzip') === '1';

    const json = JSON.stringify(makeConversation(count));
    const body = Buffer.from(json, 'utf8');

    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      // Tell the page how big the uncompressed payload is.
      'X-Uncompressed-Bytes': String(body.length),
    };

    if (useGzip) {
      const compressed = zlib.gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      res.end(compressed);
    } else {
      res.writeHead(200, headers);
      res.end(body);
    }
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('Latency experiment running at http://localhost:' + PORT);
});
