/**
 * Echo Chamber Web Server
 * Serves the web interface and provides API endpoints
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SequenceDetector } from './sequence-detector.js';
import { MemoryStore } from './memory-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const memoryStore = new MemoryStore();

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

/**
 * Handle API requests
 */
function handleAPI(req, res, pathname, body) {
    res.setHeader('Content-Type', 'application/json');

    // POST /api/analyze - Analyze a sequence
    if (pathname === '/api/analyze' && req.method === 'POST') {
        try {
            const data = JSON.parse(body);
            const sequence = data.sequence;

            if (!Array.isArray(sequence)) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Sequence must be an array' }));
                return;
            }

            const result = SequenceDetector.analyze(sequence);
            const memory = memoryStore.store(result);

            res.writeHead(200);
            res.end(JSON.stringify({
                ...result,
                memoryId: memory.id
            }));
        } catch (error) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }

    // POST /api/predict-multiple - Predict multiple future terms
    if (pathname === '/api/predict-multiple' && req.method === 'POST') {
        try {
            const data = JSON.parse(body);
            const sequence = data.sequence;
            const count = data.count || 5;

            const result = SequenceDetector.predictMultiple(sequence, count);
            const memory = memoryStore.store(result);

            res.writeHead(200);
            res.end(JSON.stringify({
                ...result,
                memoryId: memory.id
            }));
        } catch (error) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }

    // GET /api/memories - Get all memories
    if (pathname === '/api/memories' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(memoryStore.getAll()));
        return;
    }

    // GET /api/memories/recent - Get recent memories
    if (pathname === '/api/memories/recent' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(memoryStore.getRecent()));
        return;
    }

    // GET /api/stats - Get statistics
    if (pathname === '/api/stats' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(memoryStore.getStats()));
        return;
    }

    // GET /api/analysis - Get pattern analysis
    if (pathname === '/api/analysis' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(memoryStore.analyzePatterns()));
        return;
    }

    // POST /api/memories/clear - Clear all memories
    if (pathname === '/api/memories/clear' && req.method === 'POST') {
        memoryStore.clear();
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Memories cleared' }));
        return;
    }

    // GET /api/memories/export - Export memories
    if (pathname === '/api/memories/export' && req.method === 'GET') {
        res.writeHead(200);
        res.end(memoryStore.export());
        return;
    }

    // 404 - API endpoint not found
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
}

/**
 * Serve static files
 */
function serveStaticFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        const ext = path.extname(filePath);
        const mimeType = mimeTypes[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
}

/**
 * Main request handler
 */
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // Collect POST data
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        // API routes
        if (pathname.startsWith('/api/')) {
            handleAPI(req, res, pathname, body);
            return;
        }

        // Static files
        let filePath = path.join(__dirname, '..', 'public', pathname === '/' ? 'index.html' : pathname);

        serveStaticFile(res, filePath);
    });
});

server.listen(PORT, () => {
    console.log('═'.repeat(70));
    console.log('🏰  Echo Chamber Server Started! 🏰');
    console.log('═'.repeat(70));
    console.log(`\n🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api/`);
    console.log(`📚 Documentation: http://localhost:${PORT}/docs.html`);
    console.log('\n✨ The magical chamber awaits your sequences...\n');
    console.log('═'.repeat(70) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🏰 Echo Chamber shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
