#!/bin/bash

echo "Testing n8n connectivity..."
echo ""

# Test preview n8n
echo "1. Testing preview n8n (https://preview-n8n.clubomatic.ai):"
curl -s -o /dev/null -w "   Status: %{http_code}\n   Time: %{time_total}s\n" https://preview-n8n.clubomatic.ai

echo ""

# Test preview n8n directly on port
echo "2. Testing preview n8n directly (172.20.0.22:5681):"
curl -s -o /dev/null -w "   Status: %{http_code}\n   Time: %{time_total}s\n" http://172.20.0.22:5681

echo ""

# Test production n8n
echo "3. Testing production n8n (https://n8n.clubomatic.ai):"
curl -s -o /dev/null -w "   Status: %{http_code}\n   Time: %{time_total}s\n" https://n8n.clubomatic.ai

echo ""

# Test postgres connectivity
echo "4. Testing postgres connectivity (172.20.0.22:5435):"
nc -zv 172.20.0.22 5435 2>&1 | grep -q succeeded && echo "   Status: Connection successful" || echo "   Status: Connection failed"

echo ""
echo "Done."