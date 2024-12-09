#!/bin/bash

# API URL
API_URL="http://18.117.89.241:3000/package/lodash-4_17_21"

# Number of concurrent processes
NUM_PROCESSES=100

# Temporary file to store latencies
LATENCIES_FILE="latencies.txt"
> $LATENCIES_FILE  # Clear the file

# Function to call the API and measure latency
call_api() {
    local start_time=$(date +%s%N)  # Current time in nanoseconds
    local response=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL")
    local end_time=$(date +%s%N)    # Current time in nanoseconds

    if [ "$response" -eq 200 ]; then
        local latency=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
        echo "$latency" >> $LATENCIES_FILE
        echo "Process $1: Success, Latency: ${latency} ms"
    else
        echo "Process $1: Failed, HTTP Code: $response"
    fi
}

# Spawn processes
for i in $(seq 1 $NUM_PROCESSES); do
    call_api $i &
done

# Wait for all processes to finish
wait

# Calculate performance metrics
if [ -s $LATENCIES_FILE ]; then
    mean=$(awk '{sum+=$1} END {print sum/NR}' $LATENCIES_FILE)
    median=$(sort -n $LATENCIES_FILE | awk 'NR % 2 {print $0; next} {getline x; print ($0 + x)/2}' | tail -1)
    p99=$(sort -n $LATENCIES_FILE | awk 'NR==int(NR*0.99) {print $0}' | tail -1)

    echo -e "\nPerformance Metrics:"
    echo "Mean Latency: ${mean} ms"
    echo "Median Latency: ${median} ms"
    echo "99th Percentile Latency: ${p99} ms"
else
    echo "No successful API calls were made."
fi

