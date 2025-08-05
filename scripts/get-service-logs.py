#!/usr/bin/env python3

import os
import sys
import requests
import urllib3
from dotenv import load_dotenv

urllib3.disable_warnings()
load_dotenv()

# Get credentials
PORTAINER_URL = os.getenv("PORTAINER_URL", "https://portainer.local.shaloo.io:9443")
PORTAINER_API_KEY = os.getenv("PORTAINER_API_KEY")

def get_service_logs(service_name):
    """Get logs for a specific service"""
    headers = {"X-API-Key": PORTAINER_API_KEY}
    endpoint_id = 1
    
    # Get the service details
    resp = requests.get(
        f"{PORTAINER_URL}/api/endpoints/{endpoint_id}/docker/services",
        headers=headers,
        verify=False
    )
    resp.raise_for_status()
    
    # Find our service
    service_id = None
    for service in resp.json():
        if service["Spec"]["Name"] == service_name:
            service_id = service["ID"]
            break
    
    if not service_id:
        print(f"Service {service_name} not found")
        return
    
    # Get service logs
    resp = requests.get(
        f"{PORTAINER_URL}/api/endpoints/{endpoint_id}/docker/services/{service_id}/logs",
        headers=headers,
        params={"stdout": "true", "stderr": "true", "tail": 100},
        verify=False,
        stream=True
    )
    
    if resp.status_code == 200:
        print(f"\n📜 Logs for {service_name}:")
        print("=" * 60)
        for line in resp.iter_lines():
            if line:
                # Docker logs format includes header bytes, skip them
                try:
                    # Skip the first 8 bytes (docker log header)
                    decoded = line[8:].decode('utf-8', errors='replace')
                    print(decoded)
                except:
                    print(line.decode('utf-8', errors='replace'))
    else:
        print(f"Failed to get logs: {resp.status_code}")

if __name__ == "__main__":
    service_name = sys.argv[1] if len(sys.argv) > 1 else "soccer-preview_n8n"
    get_service_logs(service_name)