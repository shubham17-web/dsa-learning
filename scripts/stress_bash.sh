#!/bin/bash

# CPP·DSA Platform — Bash Traffic Generator
# Usage: ./stress_bash.sh [URL]

SERVICE_URL=${1:-"http://localhost:8080"}
ENDPOINT="/api/v1/stress?n=35"
REQUESTS=1000
DELAY=1 # seconds

echo "Starting traffic generation to $SERVICE_URL$ENDPOINT"
echo "Sending $REQUESTS requests with $DELAYs delay..."

for i in $(seq 1 $REQUESTS); do
    echo -n "Request #$i: "
    curl -s -o /dev/null -w "HTTP %{http_code} | Time: %{time_total}s\n" "$SERVICE_URL$ENDPOINT"
    sleep $DELAY
done

echo "Traffic generation complete."
