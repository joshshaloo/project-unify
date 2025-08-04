#!/usr/bin/env python3
"""
Portainer deployment script for Soccer Project Unify
Handles stack creation, updates, and deployments
"""

import os
import sys
import json
import argparse
import requests
import yaml
import secrets
import string
from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, List, Optional
import urllib3

# Disable SSL warnings if using self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class PortainerClient:
    """Simple Portainer API client"""
    
    def __init__(self, host: str, api_key: str):
        self.host = host.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.session.verify = False  # For self-signed certificates
    
    def test_connection(self) -> bool:
        """Test if the API is accessible"""
        try:
            response = self.session.get(f"{self.host}/api/status")
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False
    
    def get_stacks(self) -> List[Dict]:
        """Get all stacks"""
        response = self.session.get(f"{self.host}/api/stacks")
        response.raise_for_status()
        return response.json()
    
    def stack_exists(self, name: str) -> Optional[Dict]:
        """Check if a stack exists"""
        stacks = self.get_stacks()
        for stack in stacks:
            if stack.get('Name') == name:
                return stack
        return None
    
    def create_stack(self, name: str, stack_content: str, env_vars: List[Dict], endpoint_id: int = 1) -> Dict:
        """Create a new stack"""
        # First, get the Swarm ID if needed
        swarm_id = None
        if endpoint_id == 1:  # Swarm endpoint
            try:
                swarm_response = self.session.get(f"{self.host}/api/endpoints/{endpoint_id}/docker/swarm")
                if swarm_response.status_code == 200:
                    swarm_id = swarm_response.json().get('ID')
            except:
                pass
        
        # For Swarm stacks (compose format) - Use new API endpoint
        url = f"{self.host}/api/stacks/create/swarm/string"
        params = {
            'endpointId': endpoint_id
        }
        
        # Payload as JSON (not form data)
        payload = {
            'name': name,
            'stackFileContent': stack_content,
            'env': env_vars
        }
        
        if swarm_id:
            payload['swarmID'] = swarm_id
        
        # Debug logging
        if os.getenv('DEBUG') == '1':
            print(f"Create stack URL: {url}")
            print(f"Params: {params}")
            print(f"Payload: name={name}, swarmID={swarm_id}, env count={len(env_vars)}")
            print(f"Stack content preview: {stack_content[:100]}...")
        
        # Use JSON payload
        response = self.session.post(url, params=params, json=payload)
        
        if response.status_code == 409:
            raise Exception(f"Stack '{name}' already exists. Use update or deploy command instead.")
        
        if response.status_code != 200 and response.status_code != 201:
            error_msg = f"{response.status_code} {response.reason}"
            try:
                error_detail = response.json()
                error_msg += f": {error_detail}"
            except:
                error_msg += f": {response.text}"
            raise Exception(error_msg)
        
        response.raise_for_status()
        return response.json()
    
    def update_stack(self, stack_id: int, stack_content: str, env_vars: List[Dict], endpoint_id: int = 1) -> Dict:
        """Update an existing stack with new content and environment variables"""
        payload = {
            'StackFileContent': stack_content,
            'Env': env_vars
        }
        
        # Debug logging
        if os.getenv('DEBUG') == '1':
            print(f"Update stack URL: {self.host}/api/stacks/{stack_id}?endpointId={endpoint_id}")
            print(f"Update payload: {len(env_vars)} env vars, {len(stack_content)} bytes content")
        
        response = self.session.put(
            f"{self.host}/api/stacks/{stack_id}?endpointId={endpoint_id}",
            json=payload
        )
        
        if response.status_code != 200:
            error_msg = f"{response.status_code} {response.reason}"
            try:
                error_detail = response.json()
                error_msg += f": {error_detail}"
            except:
                error_msg += f": {response.text}"
            raise Exception(error_msg)
        
        return response.json()
    
    def delete_stack(self, stack_id: int) -> bool:
        """Delete a stack"""
        response = self.session.delete(f"{self.host}/api/stacks/{stack_id}")
        return response.status_code == 204
    
    def create_secret(self, name: str, data: str, endpoint_id: int = 1) -> Dict:
        """Create a Docker secret"""
        import base64
        encoded_data = base64.b64encode(data.encode()).decode()
        
        payload = {
            "Name": name,
            "Data": encoded_data
        }
        
        response = self.session.post(
            f"{self.host}/api/endpoints/{endpoint_id}/docker/secrets/create",
            json=payload
        )
        
        if response.status_code != 200 and response.status_code != 201:
            # Check if secret already exists
            if response.status_code == 409:
                print(f"ℹ️  Secret '{name}' already exists")
                return {"exists": True}
            
            error_msg = f"{response.status_code} {response.reason}"
            try:
                error_detail = response.json()
                error_msg += f": {error_detail}"
            except:
                error_msg += f": {response.text}"
            raise Exception(error_msg)
        
        return response.json()


def generate_password(length: int = 32) -> str:
    """Generate a secure password"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # Remove problematic characters for shell/URLs
    alphabet = alphabet.replace('"', '').replace("'", '').replace('\\', '').replace('$', '')
    return ''.join(secrets.choice(alphabet) for i in range(length))


def generate_secret_token(length: int = 64) -> str:
    """Generate a secure secret token (base64-like)"""
    alphabet = string.ascii_letters + string.digits + '-_'
    return ''.join(secrets.choice(alphabet) for i in range(length))


def load_stack_file(filename: str) -> str:
    """Load and return stack file content"""
    path = Path(filename)
    if not path.exists():
        raise FileNotFoundError(f"Stack file not found: {filename}")
    
    with open(path, 'r') as f:
        return f.read()


def get_default_env_vars(environment: str, image_tag: str) -> List[Dict]:
    """Get default environment variables for a stack"""
    # Since we're using Docker secrets, we only need non-sensitive env vars
    base_vars = [
        {'name': 'IMAGE', 'value': f'ghcr.io/joshshaloo/soccer/project-unify:{image_tag}'},
    ]
    
    if environment == 'prod':
        # Production-specific non-secret vars
        base_vars.extend([
            {'name': 'SMTP_HOST', 'value': 'smtp.example.com'},
            {'name': 'SMTP_PORT', 'value': '587'},
            {'name': 'SMTP_USER', 'value': 'CHANGE-ME'},
            {'name': 'EMAIL_FROM', 'value': 'noreply@app.clubomatic.ai'},
        ])
    
    return base_vars


def main():
    parser = argparse.ArgumentParser(description='Portainer deployment tool')
    parser.add_argument('command', choices=['test', 'bootstrap', 'deploy', 'status', 'delete'],
                        help='Command to execute')
    parser.add_argument('environment', nargs='?', choices=['preview', 'prod'],
                        help='Environment to deploy to')
    parser.add_argument('image_tag', nargs='?',
                        help='Docker image tag to deploy')
    parser.add_argument('--force', action='store_true',
                        help='Force operation without confirmation')
    
    args = parser.parse_args()
    
    # Load environment variables
    load_dotenv()
    
    # Get configuration
    portainer_host = os.getenv('PORTAINER_HOST')
    portainer_api_key = os.getenv('PORTAINER_API_KEY')
    
    if not portainer_host or not portainer_api_key:
        print("❌ Error: Missing PORTAINER_HOST or PORTAINER_API_KEY in environment")
        print("Please check your .env file")
        sys.exit(1)
    
    # Create client
    client = PortainerClient(portainer_host, portainer_api_key)
    
    # Test connection
    if args.command == 'test':
        print("🔍 Testing Portainer API connection...")
        if client.test_connection():
            print("✅ Connection successful!")
            print(f"Host: {portainer_host}")
            
            # List stacks
            try:
                stacks = client.get_stacks()
                print(f"\n📚 Found {len(stacks)} stack(s):")
                for stack in stacks:
                    print(f"  - {stack['Name']} (ID: {stack['Id']})")
            except Exception as e:
                print(f"❌ Failed to list stacks: {e}")
        else:
            print("❌ Connection failed!")
        return
    
    # Commands that require environment
    if args.command in ['bootstrap', 'deploy'] and not args.environment:
        parser.error(f"{args.command} requires environment argument")
    
    if args.command in ['bootstrap', 'deploy'] and not args.image_tag:
        parser.error(f"{args.command} requires image_tag argument")
    
    # Set stack name
    stack_name = f"soccer-{args.environment}"
    
    # Bootstrap command
    if args.command == 'bootstrap':
        print(f"🚀 Creating {stack_name} stack with image tag: {args.image_tag}")
        
        # Check if stack exists
        existing_stack = client.stack_exists(stack_name)
        if existing_stack:
            print(f"❌ Stack '{stack_name}' already exists!")
            print(f"💡 Use 'deploy' command to update it: make deploy-{args.environment} TAG={args.image_tag}")
            sys.exit(1)
        
        # Confirm for production
        if args.environment == 'prod' and not args.force:
            confirm = input("⚠️  CREATE PRODUCTION STACK ⚠️\nType 'create-production' to confirm: ")
            if confirm != 'create-production':
                print("❌ Cancelled")
                sys.exit(1)
        
        # Load stack file
        stack_file = f"docker-stack.{args.environment}.yml"
        try:
            stack_content = load_stack_file(stack_file)
        except FileNotFoundError:
            print(f"❌ Stack file not found: {stack_file}")
            sys.exit(1)
        
        # Create stack
        try:
            env_vars = get_default_env_vars(args.environment, args.image_tag)
            result = client.create_stack(stack_name, stack_content, env_vars)
            print(f"✅ Stack created successfully!")
            print(f"Stack ID: {result['Id']}")
            print(f"\n📝 Prerequisites:")
            print(f"   Ensure these secrets exist in Portainer:")
            if args.environment == 'preview':
                print(f"   - soccer_preview_postgres_password")
                print(f"   - soccer_preview_nextauth_secret")
                print(f"   - soccer_preview_n8n_password")
            else:
                print(f"   - soccer_prod_postgres_password")
                print(f"   - soccer_prod_nextauth_secret")
                print(f"   - soccer_prod_n8n_password")
                print(f"   - soccer_prod_smtp_password")
            print(f"\n🔗 Portainer URL: {portainer_host}/#/stacks/{stack_name}")
        except Exception as e:
            print(f"❌ Failed to create stack: {e}")
            sys.exit(1)
    
    # Deploy command
    elif args.command == 'deploy':
        print(f"📦 Deploying to {stack_name} with image tag: {args.image_tag}")
        
        # Check if stack exists
        existing_stack = client.stack_exists(stack_name)
        if not existing_stack:
            print(f"❌ Stack '{stack_name}' does not exist!")
            print(f"💡 Use 'bootstrap' command to create it first: make bootstrap-{args.environment}")
            sys.exit(1)
        
        # Confirm for production
        if args.environment == 'prod' and not args.force:
            print(f"⚠️  PRODUCTION DEPLOYMENT ⚠️")
            print(f"Image: ghcr.io/joshshaloo/soccer/project-unify:{args.image_tag}")
            confirm = input("Type 'deploy' to confirm: ")
            if confirm != 'deploy':
                print("❌ Cancelled")
                sys.exit(1)
        
        # Update stack with new image tag
        try:
            # Load the stack file
            stack_file = f'docker-stack.{args.environment}.yml'
            stack_content = load_stack_file(stack_file)
            
            # Update IMAGE env var
            env_vars = [{'name': 'IMAGE', 'value': f'ghcr.io/joshshaloo/soccer/project-unify:{args.image_tag}'}]
            
            # For production, keep existing SMTP settings
            if args.environment == 'prod':
                # These would normally come from existing stack config
                env_vars.extend([
                    {'name': 'SMTP_HOST', 'value': 'smtp.example.com'},
                    {'name': 'SMTP_PORT', 'value': '587'},
                    {'name': 'SMTP_USER', 'value': 'CHANGE-ME'},
                    {'name': 'EMAIL_FROM', 'value': 'noreply@app.clubomatic.ai'},
                ])
            
            client.update_stack(existing_stack['Id'], stack_content, env_vars)
            print(f"✅ Deployment successful!")
            print(f"Stack '{stack_name}' updated with image tag: {args.image_tag}")
        except Exception as e:
            print(f"❌ Failed to deploy: {e}")
            sys.exit(1)
    
    # Status command
    elif args.command == 'status':
        print("📊 Stack Status:")
        try:
            stacks = client.get_stacks()
            soccer_stacks = [s for s in stacks if s['Name'].startswith('soccer-')]
            
            if not soccer_stacks:
                print("No soccer stacks found")
            else:
                for stack in soccer_stacks:
                    print(f"\n🏷️  {stack['Name']} (ID: {stack['Id']})")
                    print(f"   Status: {stack.get('Status', 'Unknown')}")
                    
                    # Show IMAGE env var if present
                    env_vars = stack.get('Env', [])
                    for var in env_vars:
                        if var.get('name') == 'IMAGE':
                            tag = var.get('value', '').split(':')[-1]
                            print(f"   Image Tag: {tag}")
                            break
        except Exception as e:
            print(f"❌ Failed to get status: {e}")
            sys.exit(1)
    
    # Delete command
    elif args.command == 'delete':
        if not args.environment:
            parser.error("delete requires environment argument")
        
        print(f"🗑️  Deleting {stack_name} stack...")
        
        # Check if stack exists
        existing_stack = client.stack_exists(stack_name)
        if not existing_stack:
            print(f"Stack '{stack_name}' does not exist")
            return
        
        # Confirm
        if not args.force:
            confirm = input(f"⚠️  Delete stack '{stack_name}'? This cannot be undone! Type 'delete' to confirm: ")
            if confirm != 'delete':
                print("❌ Cancelled")
                sys.exit(1)
        
        # Delete stack
        try:
            client.delete_stack(existing_stack['Id'])
            print(f"✅ Stack '{stack_name}' deleted successfully!")
        except Exception as e:
            print(f"❌ Failed to delete stack: {e}")
            sys.exit(1)


if __name__ == '__main__':
    main()