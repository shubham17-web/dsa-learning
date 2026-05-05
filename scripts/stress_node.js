/**
 * CPP·DSA Platform — Node.js Concurrent Traffic Generator
 * Run: node stress_node.js [URL]
 */

const axios = require('axios');

const SERVICE_URL = process.argv[2] || 'http://localhost:8080';
const ENDPOINT = '/api/v1/stress?n=35';
const CONCURRENCY = 30; // Number of parallel requests per batch
const BATCHES = 10;

async function sendBatch(batchNum) {
    console.log(`--- Sending Batch #${batchNum} (${CONCURRENCY} requests) ---`);
    const start = Date.now();
    
    const requests = Array.from({ length: CONCURRENCY }).map(() => 
        axios.get(`${SERVICE_URL}${ENDPOINT}`)
            .then(res => res.status)
            .catch(err => err.response ? err.response.status : 'ERR')
    );

    const statuses = await Promise.all(requests);
    const end = Date.now();
    
    const success = statuses.filter(s => s === 200).length;
    console.log(`Batch #${batchNum} complete. Success: ${success}/${CONCURRENCY} | Avg Time: ${(end - start) / 1000}s`);
}

async function main() {
    console.log(`Starting Node.js load test on ${SERVICE_URL}`);
    for (let i = 1; i <= BATCHES; i++) {
        await sendBatch(i);
        // Small pause between batches
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log('Load test complete.');
}

main().catch(console.error);
