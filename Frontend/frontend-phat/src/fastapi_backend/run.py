#!/usr/bin/env python3
"""
WashGuard Pro FastAPI Backend Startup Script
Convenient way to run the backend with different configurations
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

def run_development():
    """Run in development mode with auto-reload"""
    print("🚀 Starting WashGuard Pro API in development mode...")
    print("📝 API Documentation: http://localhost:8000/docs")
    print("🔄 Auto-reload enabled")
    print("🌐 CORS enabled for frontend integration")
    print("-" * 50)
    
    os.system("uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level info")

def run_production():
    """Run in production mode"""
    print("🏭 Starting WashGuard Pro API in production mode...")
    print("📝 API Documentation: http://localhost:8000/docs")
    print("-" * 50)
    
    os.system("uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --log-level warning")

def run_docker():
    """Run with Docker Compose"""
    print("🐳 Starting WashGuard Pro with Docker Compose...")
    print("📝 API Documentation: http://localhost:8000/docs")
    print("🔗 Services: API, PostgreSQL, Redis")
    print("-" * 50)
    
    os.system("docker-compose up --build")

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing dependencies...")
    os.system("pip install -r requirements.txt")

def check_health():
    """Check if the API is running and healthy"""
    import requests
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API is healthy - Status: {data['status']}, Version: {data['version']}")
            return True
        else:
            print(f"❌ API returned status code: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ API is not reachable: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="WashGuard Pro FastAPI Backend")
    parser.add_argument("command", choices=["dev", "prod", "docker", "install", "health"], 
                       help="Command to run")
    
    args = parser.parse_args()
    
    # Change to the script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("🛡️  WashGuard Pro - Digital Asset Wash Sales Detection Platform")
    print("=" * 60)
    
    if args.command == "dev":
        run_development()
    elif args.command == "prod":
        run_production()
    elif args.command == "docker":
        run_docker()
    elif args.command == "install":
        install_dependencies()
    elif args.command == "health":
        check_health()

if __name__ == "__main__":
    main()