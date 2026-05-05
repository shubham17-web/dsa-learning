import asyncio
import httpx
import time
import sys

# CPP·DSA Platform — Python Async Traffic Generator
# Run: python stress_python.py [URL]

async def send_request(client, url, req_id):
    try:
        start = time.perf_counter()
        response = await client.get(url, timeout=30)
        end = time.perf_counter()
        return response.status_code, end - start
    except Exception as e:
        return f"Error: {e}", 0

async def main():
    service_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    endpoint = "/api/v1/stress?n=35"
    url = f"{service_url}{endpoint}"
    
    concurrency = 50
    total_requests = 200
    
    print(f"Starting Python async load test on {url}")
    print(f"Concurrency: {concurrency} | Total: {total_requests}")

    async with httpx.AsyncClient() as client:
        for i in range(0, total_requests, concurrency):
            batch_num = (i // concurrency) + 1
            print(f"--- Processing Batch {batch_num} ---")
            
            tasks = [send_request(client, url, j) for j in range(i, min(i + concurrency, total_requests))]
            results = await asyncio.gather(*tasks)
            
            success = len([r for r in results if r[0] == 200])
            failures = len(results) - success
            avg_time = sum([r[1] for r in results if r[1] > 0]) / max(success, 1)
            
            print(f"Batch {batch_num} result: {success} Success, {failures} Failed")
            print(f"Avg Response Time (Success): {avg_time:.2f}s")
            
            # Brief sleep to avoid hitting Cloud Run limits too fast if desired
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
