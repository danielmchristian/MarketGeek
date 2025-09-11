#!/usr/bin/env python3
"""
WashGuard Pro - Connection Debugging Script
Helps diagnose API connection issues between frontend and backend
"""

import requests
import json
from datetime import datetime

def test_api_endpoint(url, method="GET", data=None):
    """Test a single API endpoint"""
    print(f"\n🧪 Testing: {method} {url}")
    print("-" * 50)
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=5)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                json_data = response.json()
                print(f"Response Data: {json.dumps(json_data, indent=2)}")
                return True
            except json.JSONDecodeError:
                print(f"Response Text: {response.text}")
                return True
        else:
            print(f"Error Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Could not connect to the API")
        print("   Make sure the FastAPI backend is running on http://localhost:8000")
        return False
    except requests.exceptions.Timeout:
        print("❌ Timeout Error: API took too long to respond")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

def run_comprehensive_test():
    """Run comprehensive API connection test"""
    print("🛡️  WashGuard Pro - API Connection Diagnostics")
    print("=" * 60)
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    base_url = "http://localhost:8000"
    
    # Test cases
    test_cases = [
        # Basic connectivity
        (f"{base_url}/", "GET", None),
        (f"{base_url}/health", "GET", None),
        (f"{base_url}/status", "GET", None),
        
        # Detection endpoints
        (f"{base_url}/detect/self-trades", "POST", {"token": "SHIB", "timeframe": "24h"}),
        (f"{base_url}/detect/cycles", "POST", {"token": "PEPE", "min_cycle_length": 3}),
        (f"{base_url}/detect/volume-anomaly", "POST", {"token": "DOGE", "timeframe": "1h"}),
        
        # Report endpoint
        (f"{base_url}/reports/case/SHIB", "GET", None),
    ]
    
    passed = 0
    total = len(test_cases)
    
    for url, method, data in test_cases:
        if test_api_endpoint(url, method, data):
            passed += 1
            print("✅ PASSED")
        else:
            print("❌ FAILED")
    
    # Summary
    print(f"\n📊 Test Summary")
    print("=" * 60)
    success_rate = (passed / total) * 100
    print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
    
    if success_rate == 100:
        print("\n🎉 All tests passed! API is working correctly.")
        print("🔗 Your React frontend should be able to connect successfully.")
        print("✅ Backend is ready for production use.")
    elif passed == 0:
        print("\n❌ No tests passed. Backend is likely not running.")
        print("\n🚀 To start the backend:")
        print("   cd fastapi_backend")
        print("   python start_backend.py")
        print("   # OR")
        print("   python run.py dev")
    else:
        print(f"\n⚠️  Some tests failed. Check the failed endpoints above.")
    
    print(f"\n🏁 Diagnostic completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    run_comprehensive_test()