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

def get_task_logs(service_name):
    """Get logs for all tasks of a service"""
    headers = {"X-API-Key": PORTAINER_API_KEY}
    endpoint_id = 1
    
    # Get all tasks for the service
    resp = requests.get(
        f"{PORTAINER_URL}/api/endpoints/{endpoint_id}/docker/tasks",
        headers=headers,
        params={"filters": f'{{"service":["{service_name}"]}}'},
        verify=False
    )
    resp.raise_for_status()
    
    tasks = resp.json()
    if not tasks:
        print(f"No tasks found for {service_name}")
        return
    
    # Get logs for each task
    for i, task in enumerate(tasks[:5]):  # Limit to first 5 tasks
        task_id = task["ID"]
        state = task.get("Status", {}).get("State", "unknown")
        container_id = task.get("Status", {}).get("ContainerStatus", {}).get("ContainerID", "")
        
        print(f"\n📋 Task {i+1} (State: {state}):")
        print(f"   ID: {task_id[:12]}")
        print(f"   Container: {container_id[:12] if container_id else 'N/A'}")
        
        # Show error if task failed
        err = task.get("Status", {}).get("Err", "")
        if err:
            print(f"   Error: {err}")
        
        # Try to get container logs if container ID is available
        if container_id and state in ["running", "failed", "shutdown"]:
            try:
                resp = requests.get(
                    f"{PORTAINER_URL}/api/endpoints/{endpoint_id}/docker/containers/{container_id}/logs",
                    headers=headers,
                    params={"stdout": "true", "stderr": "true", "tail": 50},
                    verify=False,
                    stream=True
                )
                
                if resp.status_code == 200:
                    print("\n   Logs:")
                    print("   " + "-" * 50)
                    for line in resp.iter_lines():
                        if line:
                            try:
                                # Skip the first 8 bytes (docker log header)
                                decoded = line[8:].decode('utf-8', errors='replace')
                                print(f"   {decoded}")
                            except:
                                print(f"   {line.decode('utf-8', errors='replace')}")
                else:
                    print(f"   (Could not retrieve logs: {resp.status_code})")
            except Exception as e:
                print(f"   (Error getting logs: {e})")

if __name__ == "__main__":
    service_name = sys.argv[1] if len(sys.argv) > 1 else "soccer-preview_n8n"
    get_task_logs(service_name)