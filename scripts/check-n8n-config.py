#!/usr/bin/env python3

import os
import requests
import urllib3
import json
from dotenv import load_dotenv

urllib3.disable_warnings()
load_dotenv()

# Get credentials
PORTAINER_URL = os.getenv("PORTAINER_URL", "https://portainer.local.shaloo.io:9443")
PORTAINER_API_KEY = os.getenv("PORTAINER_API_KEY")

def get_n8n_configs():
    """Get all n8n service configurations"""
    headers = {"X-API-Key": PORTAINER_API_KEY}
    endpoint_id = 1
    
    # Get all services
    resp = requests.get(
        f"{PORTAINER_URL}/api/endpoints/{endpoint_id}/docker/services",
        headers=headers,
        verify=False
    )
    resp.raise_for_status()
    
    # Find all n8n services
    n8n_services = []
    for service in resp.json():
        if "n8n" in service["Spec"]["Name"].lower():
            n8n_services.append(service)
    
    print(f"Found {len(n8n_services)} n8n services:\n")
    
    for service in n8n_services:
        name = service["Spec"]["Name"]
        print(f"📦 Service: {name}")
        print("=" * 60)
        
        # Get environment variables
        env_vars = service["Spec"]["TaskTemplate"]["ContainerSpec"].get("Env", [])
        print("\n🔧 Environment Variables:")
        for env in sorted(env_vars):
            if "PASSWORD" in env:
                # Mask password values
                key, value = env.split("=", 1)
                print(f"  {key}=***MASKED***")
            else:
                print(f"  {env}")
        
        # Get secrets
        secrets = service["Spec"]["TaskTemplate"]["ContainerSpec"].get("Secrets", [])
        if secrets:
            print("\n🔐 Secrets:")
            for secret in secrets:
                print(f"  - {secret.get('SecretName', 'unknown')} -> {secret.get('File', {}).get('Name', 'unknown')}")
        
        # Get command/entrypoint
        command = service["Spec"]["TaskTemplate"]["ContainerSpec"].get("Command", [])
        if command:
            print("\n📜 Command:")
            print(f"  {' '.join(command)}")
            
        args = service["Spec"]["TaskTemplate"]["ContainerSpec"].get("Args", [])
        if args:
            print("\n📋 Args:")
            print(f"  {' '.join(args)}")
        
        # Get image
        image = service["Spec"]["TaskTemplate"]["ContainerSpec"].get("Image", "")
        print(f"\n🐳 Image: {image}")
        
        # Get volumes
        mounts = service["Spec"]["TaskTemplate"]["ContainerSpec"].get("Mounts", [])
        if mounts:
            print("\n📁 Volumes:")
            for mount in mounts:
                print(f"  - {mount.get('Source', 'unknown')} -> {mount.get('Target', 'unknown')}")
        
        print("\n" + "-" * 60 + "\n")

if __name__ == "__main__":
    get_n8n_configs()