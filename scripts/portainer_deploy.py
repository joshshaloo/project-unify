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
import time
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
    
    def get_stack_services(self, stack_name: str, endpoint_id: int = 1) -> List[Dict]:
        """Get services for a stack"""
        # Get all services
        response = self.session.get(f"{self.host}/api/endpoints/{endpoint_id}/docker/services")
        if response.status_code != 200:
            return []
        
        services = response.json()
        # Filter by stack name (services are named like "stackname_servicename")
        stack_services = [s for s in services if s.get('Spec', {}).get('Labels', {}).get('com.docker.stack.namespace') == stack_name]
        return stack_services
    
    def get_service_tasks(self, service_id: str, endpoint_id: int = 1) -> List[Dict]:
        """Get tasks (containers) for a service"""
        response = self.session.get(f"{self.host}/api/endpoints/{endpoint_id}/docker/tasks")
        if response.status_code != 200:
            return []
        
        tasks = response.json()
        # Filter by service ID
        service_tasks = [t for t in tasks if t.get('ServiceID') == service_id]
        return service_tasks
    
    def wait_for_services_ready(self, stack_name: str, timeout: int = 300, endpoint_id: int = 1) -> bool:
        """Wait for all services in a stack to be ready"""
        start_time = time.time()
        
        print(f"⏳ Waiting for services to be ready...")
        
        initial_wait = 10  # Give services time to appear
        print(f"⏳ Waiting {initial_wait} seconds for services to initialize...")
        time.sleep(initial_wait)
        
        while time.time() - start_time < timeout:
            services = self.get_stack_services(stack_name, endpoint_id)
            
            if not services:
                print(f"⚠️  No services found for stack {stack_name} (retrying...)")
                time.sleep(5)
                continue
            
            all_ready = True
            service_status = []
            
            for service in services:
                service_name = service.get('Spec', {}).get('Name', 'unknown')
                service_id = service.get('ID')
                
                # Skip one-shot/init services - they don't need to stay running
                if 'init' in service_name.lower():
                    if os.getenv('DEBUG') == '1':
                        print(f"[DEBUG] Skipping one-shot service: {service_name}")
                    continue
                
                replicas = service.get('Spec', {}).get('Mode', {}).get('Replicated', {}).get('Replicas', 1)
                
                # Get tasks for this service
                tasks = self.get_service_tasks(service_id, endpoint_id)
                running_tasks = [t for t in tasks if t.get('Status', {}).get('State') == 'running']
                
                # Debug logging for service status
                if os.getenv('DEBUG') == '1':
                    print(f"\n[DEBUG] Service {service_name}: {len(tasks)} total tasks")
                    for task in tasks:
                        state = task.get('Status', {}).get('State', 'unknown')
                        message = task.get('Status', {}).get('Message', '')
                        print(f"[DEBUG]   Task {task.get('ID', 'unknown')[:8]}: {state} - {message}")
                
                # Check if we have enough running tasks
                is_ready = len(running_tasks) >= replicas
                
                if not is_ready:
                    all_ready = False
                
                status_icon = "✅" if is_ready else "⏳"
                service_status.append(f"  {status_icon} {service_name}: {len(running_tasks)}/{replicas} running")
            
            # Clear previous lines and print current status
            if service_status:  # Only clear if we have status to show
                # Use \r to return to start of line instead of moving cursor up
                status_lines = [f"⏳ Service status ({int(time.time() - start_time)}s):"] + service_status
                
                # Clear the terminal area
                print("\033[2K" + "\033[F" * len(status_lines), end="")
                
                # Print the status
                for line in status_lines:
                    print(line)
            
            if all_ready:
                print(f"\n✅ All services are ready!")
                return True
            
            time.sleep(5)
        
        print(f"\n⚠️  Timeout waiting for services to be ready")
        return False
    
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
        {'name': 'N8N_DB_PASSWORD', 'value': 'CHANGE-ME'},  # Placeholder - must be changed
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
    parser.add_argument('--no-wait', action='store_true',
                        help='Do not wait for services to be ready after deployment')
    
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
            print(f"\n⚠️  IMPORTANT - Manual steps required:")
            print(f"\n1. Create these secrets in Portainer:")
            if args.environment == 'preview':
                print(f"   - soccer_preview_postgres_password")
                print(f"   - soccer_preview_nextauth_secret")
                print(f"   - soccer_preview_app_db_password")
            else:
                print(f"   - soccer_prod_postgres_password")
                print(f"   - soccer_prod_nextauth_secret")
                print(f"   - soccer_prod_app_db_password")
                print(f"   - soccer_prod_smtp_password")
            print(f"\n2. Update the stack environment variables:")
            print(f"   - Change N8N_DB_PASSWORD from 'CHANGE-ME' to a secure password")
            if args.environment == 'prod':
                print(f"   - Update SMTP settings (SMTP_HOST, SMTP_USER, etc.)")
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
            
            # Get existing environment variables from the stack
            existing_env_vars = existing_stack.get('Env', [])
            env_dict = {var['name']: var['value'] for var in existing_env_vars}
            
            # Update IMAGE env var
            env_dict['IMAGE'] = f'ghcr.io/joshshaloo/soccer/project-unify:{args.image_tag}'
            
            # Ensure N8N_DB_PASSWORD is set (check both possible names)
            if 'N8N_DB_PASSWORD' not in env_dict and 'DB_POSTGRESDB_PASSWORD' not in env_dict:
                print(f"❌ ERROR: N8N_DB_PASSWORD is not set in the stack!")
                print(f"")
                print(f"To fix this:")
                print(f"1. Go to Portainer > Stacks > {stack_name}")
                print(f"2. Click 'Edit this stack'")
                print(f"3. Add environment variable: N8N_DB_PASSWORD")
                print(f"4. Set a secure password value")
                print(f"5. Update the stack")
                print(f"")
                print(f"Then run this deploy command again.")
                sys.exit(1)
            
            # If user has DB_POSTGRESDB_PASSWORD, migrate to N8N_DB_PASSWORD
            if 'DB_POSTGRESDB_PASSWORD' in env_dict and 'N8N_DB_PASSWORD' not in env_dict:
                env_dict['N8N_DB_PASSWORD'] = env_dict['DB_POSTGRESDB_PASSWORD']
                del env_dict['DB_POSTGRESDB_PASSWORD']
                print(f"📝 Migrated DB_POSTGRESDB_PASSWORD to N8N_DB_PASSWORD")
            
            # For production, ensure SMTP settings are present
            if args.environment == 'prod':
                if 'SMTP_HOST' not in env_dict:
                    env_dict['SMTP_HOST'] = 'smtp.example.com'
                if 'SMTP_PORT' not in env_dict:
                    env_dict['SMTP_PORT'] = '587'
                if 'SMTP_USER' not in env_dict:
                    env_dict['SMTP_USER'] = 'CHANGE-ME'
                if 'EMAIL_FROM' not in env_dict:
                    env_dict['EMAIL_FROM'] = 'noreply@app.clubomatic.ai'
            
            # Convert back to list format
            env_vars = [{'name': k, 'value': v} for k, v in env_dict.items()]
            
            client.update_stack(existing_stack['Id'], stack_content, env_vars)
            print(f"✅ Stack update initiated!")
            print(f"Stack '{stack_name}' updating with image tag: {args.image_tag}")
            
            # Wait for services to be ready unless --no-wait is specified
            if not args.no_wait:
                if client.wait_for_services_ready(stack_name, timeout=300):
                    print(f"\n🎉 Deployment complete!")
                    print(f"All services in '{stack_name}' are running with image tag: {args.image_tag}")
                else:
                    print(f"\n⚠️  Services may not be fully ready. Check Portainer for details.")
                    sys.exit(1)
            else:
                print(f"\n✅ Deployment initiated! Use 'make status' to check service status.")
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