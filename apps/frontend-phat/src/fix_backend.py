#!/usr/bin/env python3
"""
WashGuard Pro - Backend Fix Script
Automatically fixes common backend issues and ensures proper setup
"""

import os
import sys
import subprocess
import shutil
import time
from pathlib import Path

def print_step(step_number, description):
    """Print a formatted step"""
    print(f"\n📋 Step {step_number}: {description}")
    print("=" * 50)

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor} is compatible")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor} is not compatible. Requires Python 3.8+")
        return False

def fix_backend_structure():
    """Fix any structural issues with the backend"""
    print("🔧 Fixing backend directory structure...")
    
    backend_dir = Path("fastapi_backend")
    
    # Remove any incorrectly placed Dockerfile directory
    dockerfile_dir = backend_dir / "Dockerfile"
    if dockerfile_dir.is_dir():
        print(f"🗑️  Removing incorrect Dockerfile directory...")
        shutil.rmtree(dockerfile_dir)
        print("✅ Cleaned up Dockerfile directory")
    
    # Ensure main.py exists
    main_py = backend_dir / "main.py"
    if not main_py.exists():
        print("❌ main.py not found in fastapi_backend directory")
        return False
    
    print("✅ Backend structure is correct")
    return True

def install_requirements():
    """Install Python requirements"""
    print("📦 Installing Python requirements...")
    
    backend_dir = Path("fastapi_backend")
    requirements_file = backend_dir / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True, capture_output=True, text=True)
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e.stderr}")
        return False

def check_port_availability(port=8000):
    """Check if the required port is available"""
    import socket
    
    print(f"🔍 Checking port {port} availability...")
    
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            print(f"✅ Port {port} is available")
            return True
        except OSError:
            print(f"⚠️  Port {port} is in use")
            
            # Try to find and kill the process
            try:
                if os.name == 'nt':  # Windows
                    result = subprocess.run(
                        f'netstat -ano | findstr :{port}',
                        shell=True, capture_output=True, text=True
                    )
                    if result.stdout:
                        print(f"Found process using port {port}")
                        kill_cmd = f'for /f "tokens=5" %a in (\'netstat -aon ^| find ":{port}"\') do taskkill /f /pid %a'
                        os.system(kill_cmd)
                else:  # Unix/Linux/macOS
                    os.system(f"lsof -ti:{port} | xargs kill -9 2>/dev/null || true")
                
                # Check again
                time.sleep(1)
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s2:
                    s2.bind(('localhost', port))
                    print(f"✅ Port {port} is now available")
                    return True
                    
            except Exception as e:
                print(f"❌ Could not free port {port}: {e}")
                return False

def start_backend_process():
    """Start the backend in a new process"""
    print("🚀 Starting FastAPI backend...")
    
    backend_dir = Path("fastapi_backend")
    
    try:
        # Change to backend directory
        os.chdir(backend_dir)
        
        # Start uvicorn
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--log-level", "info"
        ])
        
        print(f"🎯 Backend started with PID: {process.pid}")
        print("📝 API Documentation: http://localhost:8000/docs")
        print("🔗 Health Check: http://localhost:8000/health")
        
        return process
        
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return None

def test_backend_health():
    """Test if the backend is responding"""
    import requests
    
    print("🧪 Testing backend health...")
    
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Backend is healthy!")
                print(f"   Status: {data.get('status')}")
                print(f"   Version: {data.get('version')}")
                print(f"   Timestamp: {data.get('timestamp')}")
                return True
        except requests.RequestException:
            if attempt < max_attempts - 1:
                print(f"⏳ Waiting for backend to start... ({attempt + 1}/{max_attempts})")
                time.sleep(1)
    
    print("❌ Backend health check failed")
    return False

def create_startup_scripts():
    """Create convenient startup scripts"""
    print("📝 Creating startup scripts...")
    
    # Windows batch file
    batch_content = """@echo off
echo Starting WashGuard Pro FastAPI Backend...
cd fastapi_backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
"""
    
    with open("start_backend.bat", "w") as f:
        f.write(batch_content)
    
    # Unix shell script
    shell_content = """#!/bin/bash
echo "Starting WashGuard Pro FastAPI Backend..."
cd fastapi_backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
    
    with open("start_backend.sh", "w") as f:
        f.write(shell_content)
    
    # Make shell script executable
    try:
        os.chmod("start_backend.sh", 0o755)
    except:
        pass
    
    print("✅ Created startup scripts: start_backend.bat, start_backend.sh")

def main():
    """Main fix routine"""
    print("🛡️  WashGuard Pro - Backend Fix & Setup")
    print("=" * 60)
    
    # Step 1: Check Python version
    print_step(1, "Checking Python version")
    if not check_python_version():
        return False
    
    # Step 2: Fix backend structure
    print_step(2, "Fixing backend structure")
    if not fix_backend_structure():
        return False
    
    # Step 3: Install requirements
    print_step(3, "Installing requirements")
    if not install_requirements():
        return False
    
    # Step 4: Check port availability
    print_step(4, "Checking port availability")
    if not check_port_availability():
        print("⚠️  Port issues detected, but continuing...")
    
    # Step 5: Create startup scripts
    print_step(5, "Creating startup scripts")
    create_startup_scripts()
    
    # Step 6: Test start backend
    print_step(6, "Testing backend startup")
    
    start_choice = input("\nDo you want to start the backend now? (y/n) [y]: ").lower()
    if start_choice in ('', 'y', 'yes'):
        process = start_backend_process()
        if process:
            # Test health
            if test_backend_health():
                print("\n🎉 SUCCESS! Backend is running and healthy.")
                print("\n🔗 Next steps:")
                print("   1. Your React frontend should now connect automatically")
                print("   2. Check that 'Demo Mode' banner disappears")
                print("   3. Visit http://localhost:8000/docs for API documentation")
                print("\n🛑 To stop the backend, press Ctrl+C")
                
                try:
                    process.wait()
                except KeyboardInterrupt:
                    print("\n👋 Stopping backend...")
                    process.terminate()
            else:
                print("\n❌ Backend started but health check failed")
                process.terminate()
        else:
            print("\n❌ Failed to start backend")
    else:
        print("\n✅ Setup complete! Start the backend manually with:")
        print("   python start_backend.py")
        print("   # OR")
        print("   cd fastapi_backend && python -m uvicorn main:app --reload")

if __name__ == "__main__":
    main()