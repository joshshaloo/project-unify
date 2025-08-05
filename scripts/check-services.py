#!/usr/bin/env python3

import os
import requests
import urllib3
from dotenv import load_dotenv

urllib3.disable_warnings()
load_dotenv()

# Get credentials
PORTAINER_URL = os.getenv("PORTAINER_URL", "https://portainer.local.shaloo.io:9443")
PORTAINER_USER = os.getenv("PORTAINER_USER", "admin")
PORTAINER_PASS = os.getenv("PORTAINER_PASS", "")

def get_headers():
    """Get authentication headers"""
    api_key = os.getenv("PORTAINER_API_KEY")
    if api_key:
        return {"X-API-Key": api_key}
    else:
        # Fallback to JWT auth
        auth_payload = {"username": PORTAINER_USER, "password": PORTAINER_PASS}
        resp = requests.post(f"{PORTAINER_URL}/api/auth", json=auth_payload, verify=False)
        resp.raise_for_status()
        return {"Authorization": f"Bearer {resp.json()['jwt']}"}

def list_services(stack_name):
    """List all services in a stack"""
    headers = get_headers()
    
    # Get all stacks
    resp = requests.get(f"{PORTAINER_URL}/api/stacks", headers=headers, verify=False)
    resp.raise_for_status()
    
    # Find our stack
    stack = None
    for s in resp.json():
        if s["Name"] == stack_name:
            stack = s
            break
    
    if not stack:
        print(f"Stack {stack_name} not found")
        return
    
    # Get services for this stack
    endpoint_id = 1
    resp = requests.get(
        f"{PORTAINER_URL}/api/endpoints/{endpoint_id}/docker/services",
        headers=headers,
        verify=False
    )
    resp.raise_for_status()
    
    # Filter services for our stack
    services = []
    for service in resp.json():
        if service.get("Spec", {}).get("Labels", {}).get("com.docker.stack.namespace") == stack_name:
            services.append(service)
    
    print(f"\n🔍 Services in {stack_name}:")
    print("=" * 60)
    
    for service in services:
        name = service["Spec"]["Name"]
        mode = service["Spec"]["Mode"]
        replicas = "?"
        running = "?"
        
        if "Replicated" in mode:
            replicas = mode["Replicated"].get("Replicas", "?")
        
        # Count running tasks
        tasks_resp = requests.get(
            f"{PORTAINER_URL}/api/endpoints/{endpoint_id}/docker/tasks",
            headers=headers,
            params={"filters": f'{{"service":["{name}"]}}'},
            verify=False
        )
        if tasks_resp.status_code == 200:
            tasks = tasks_resp.json()
            running_tasks = [t for t in tasks if t.get("Status", {}).get("State") == "running"]
            running = len(running_tasks)
        
        print(f"\n📦 {name}")
        print(f"   Replicas: {running}/{replicas}")
        
        # Get task details
        if tasks_resp.status_code == 200:
            for task in tasks[:3]:  # Show first 3 tasks
                state = task.get("Status", {}).get("State", "unknown")
                message = task.get("Status", {}).get("Message", "")
                err = task.get("Status", {}).get("Err", "")
                print(f"   Task: {state} - {message}")
                if err:
                    print(f"   Error: {err}")

if __name__ == "__main__":
    import sys
    stack_name = sys.argv[1] if len(sys.argv) > 1 else "soccer-preview"
    list_services(stack_name)