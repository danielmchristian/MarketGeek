#!/usr/bin/env python3
"""
WashGuard Pro FastAPI Backend - Quick Start Script
Fixes common issues and starts the backend properly
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    print("🔍 Checking Python requirements...")
    
    required_packages = [
        'fastapi', 'uvicorn', 'pydantic'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"  ✅ {package} - installed")
        except ImportError:
            missing_packages.append(package)
            print(f"  ❌ {package} - missing")
    
    if missing_packages:
        print(f"\n📦 Installing missing packages...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        return True
    
    return True

def check_port(port=8000):
    """Check if port is available"""
    import socket
    
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            print(f"✅ Port {port} is available")
            return True
        except OSError:
            print(f"❌ Port {port} is in use")
            return False

def kill_existing_process():
    """Kill any existing process on port 8000"""
    try:
        if os.name == 'nt':  # Windows
            os.system("netstat -ano | findstr :8000")
            result = input("Found processes on port 8000. Kill them? (y/n): ")
            if result.lower() == 'y':
                os.system('for /f "tokens=5" %a in (\'netstat -aon ^| find ":8000"\') do taskkill /f /pid %a')
        else:  # Unix/Linux/macOS
            os.system("lsof -ti:8000 | xargs kill -9 2>/dev/null || true")
            print("✅ Killed existing processes on port 8000")
    except Exception as e:
        print(f"⚠️  Could not kill existing processes: {e}")

def start_backend():
    """Start the FastAPI backend"""
    print("\n🚀 Starting WashGuard Pro FastAPI Backend...")
    print("📝 API Documentation will be available at: http://localhost:8000/docs")
    print("🔗 Health Check: http://localhost:8000/health")
    print("🌐 CORS enabled for frontend integration")
    print("-" * 60)
    
    # Start the server
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--reload", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--log-level", "info"
        ])
    except KeyboardInterrupt:
        print("\n👋 Shutting down backend...")
    except Exception as e:
        print(f"❌ Error starting backend: {e}")

def test_backend():
    """Test if backend is responding"""
    print("\n🧪 Testing backend connection...")
    
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Backend is healthy!")
                print(f"   Status: {data.get('status')}")
                print(f"   Version: {data.get('version')}")
                return True
        except requests.RequestException:
            if attempt < max_attempts - 1:
                print(f"⏳ Waiting for backend... ({attempt + 1}/{max_attempts})")
                time.sleep(1)
            else:
                print("❌ Backend health check failed")
                return False
    
    return False

def main():
    print("🛡️  WashGuard Pro FastAPI Backend - Startup & Diagnostics")
    print("=" * 60)
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Step 1: Check requirements
    if not check_requirements():
        return
    
    # Step 2: Check port availability
    if not check_port():
        kill_existing_process()
        if not check_port():
            print("❌ Could not free port 8000. Please manually stop other services.")
            return
    
    # Step 3: Start backend
    print(f"\n🎯 Starting backend from: {os.getcwd()}")
    
    # Option to test first
    test_only = input("\nDo you want to just test the connection (y) or start the backend (n)? [n]: ").lower()
    
    if test_only == 'y':
        if test_backend():
            print("\n🎉 Backend is already running and healthy!")
            print("🔗 Your React frontend should connect automatically")
        else:
            print("\n❌ Backend is not running. Run this script again with 'n' to start it.")
    else:
        start_backend()

if __name__ == "__main__":
    main()