#!/usr/bin/env python3
"""
WashGuard Pro API Test Suite
Comprehensive testing of all API endpoints
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any

# API Configuration
API_BASE_URL = "http://localhost:8000"

def print_section(title: str):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print('='*60)

def print_test(test_name: str, status: str, details: str = ""):
    """Print test result"""
    status_icon = "✅" if status == "PASS" else "❌"
    print(f"{status_icon} {test_name}: {status}")
    if details:
        print(f"   └─ {details}")

def make_request(method: str, endpoint: str, data: Dict[Any, Any] = None) -> requests.Response:
    """Make HTTP request with error handling"""
    url = f"{API_BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def test_health_endpoint():
    """Test the health check endpoint"""
    print_section("Health Check")
    
    response = make_request("GET", "/health")
    if response and response.status_code == 200:
        data = response.json()
        print_test("Health Check", "PASS", f"Status: {data.get('status')}, Version: {data.get('version')}")
        return True
    else:
        print_test("Health Check", "FAIL", f"Status Code: {response.status_code if response else 'No Response'}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print_section("Root Endpoint")
    
    response = make_request("GET", "/")
    if response and response.status_code == 200:
        data = response.json()
        print_test("Root Endpoint", "PASS", f"API Name: {data.get('name')}")
        return True
    else:
        print_test("Root Endpoint", "FAIL", f"Status Code: {response.status_code if response else 'No Response'}")
        return False

def test_ingest_trades():
    """Test trade ingestion endpoint"""
    print_section("Trade Ingestion")
    
    # Sample trade data
    sample_trades = {
        "trades": [
            {
                "trade_id": "TXN_001",
                "timestamp": datetime.now().isoformat(),
                "token": "SHIB",
                "from_address": "0x1a2b3c4d5e6f7890",
                "to_address": "0x9876543210abcdef",
                "amount": 1000000.0,
                "price": 0.00001,
                "exchange": "Uniswap",
                "tx_hash": "0xabc123def456"
            },
            {
                "trade_id": "TXN_002",
                "timestamp": datetime.now().isoformat(),
                "token": "PEPE",
                "from_address": "0x2b3c4d5e6f7890ab",
                "to_address": "0x876543210abcdef9",
                "amount": 5000000.0,
                "price": 0.000002,
                "exchange": "SushiSwap",
                "tx_hash": "0xdef456abc123"
            }
        ]
    }
    
    response = make_request("POST", "/ingest/trades", sample_trades)
    if response and response.status_code == 200:
        data = response.json()
        print_test("Trade Ingestion", "PASS", f"Processed: {data.get('processed_count')} trades")
        return True
    else:
        print_test("Trade Ingestion", "FAIL", f"Status Code: {response.status_code if response else 'No Response'}")
        return False

def test_self_trade_detection():
    """Test self-trade detection endpoint"""
    print_section("Self-Trade Detection")
    
    detection_request = {
        "token": "SHIB",
        "timeframe": "24h"
    }
    
    response = make_request("POST", "/detect/self-trades", detection_request)
    if response and response.status_code == 200:
        data = response.json()
        alerts = data.get("alerts", [])
        print_test("Self-Trade Detection", "PASS", f"Found {len(alerts)} alerts")
        
        # Show first alert details
        if alerts:
            first_alert = alerts[0]
            print(f"   └─ Sample Alert: {first_alert.get('type')} - {first_alert.get('severity')} - {first_alert.get('token')}")
        
        return True
    else:
        print_test("Self-Trade Detection", "FAIL", f"Status Code: {response.status_code if response else 'No Response'}")
        return False

def test_cycle_detection():
    """Test cycle detection endpoint"""
    print_section("Cycle Detection")
    
    detection_request = {
        "token": "PEPE",
        "min_cycle_length": 3
    }
    
    response = make_request("POST", "/detect/cycles", detection_request)
    if response and response.status_code == 200:
        data = response.json()
        cycles = data.get("cycles", [])
        print_test("Cycle Detection", "PASS", f"Found {len(cycles)} cycles")
        
        # Show first cycle details
        if cycles:
            first_cycle = cycles[0]
            print(f"   └─ Sample Cycle: {len(first_cycle.get('wallets', []))} wallets - {first_cycle.get('pattern_type')}")
        
        return True
    else:
        print_test("Cycle Detection", "FAIL", f"Status Code: {response.status_code if response else 'No Response'}")
        return False

def test_volume_anomaly_detection():
    """Test volume anomaly detection endpoint"""
    print_section("Volume Anomaly Detection")
    
    detection_request = {
        "token": "DOGE",
        "timeframe": "1h"
    }
    
    response = make_request("POST", "/detect/volume-anomaly", detection_request)
    if response and response.status_code == 200:
        data = response.json()
        anomalies = data.get("anomalies", [])
        print_test("Volume Anomaly Detection", "PASS", f"Found {len(anomalies)} anomalies")
        
        # Show first anomaly details
        if anomalies:
            first_anomaly = anomalies[0]
            print(f"   └─ Sample Anomaly: Z-Score {first_anomaly.get('z_score')} - {first_anomaly.get('severity')}")
        
        return True
    else:
        print_test("Volume Anomaly Detection", "FAIL", f"Status Code: {response.status_code if response else 'No Response'}")
        return False

def test_case_report():
    """Test case report generation"""
    print_section("Case Report Generation")
    
    token = "SHIB"
    response = make_request("GET", f"/reports/case/{token}")
    if response and response.status_code == 200:
        data = response.json()
        summary = data.get("summary", {})
        print_test("Case Report", "PASS", f"Token: {data.get('token')}, Risk Score: {summary.get('risk_score')}")
        print(f"   └─ Total Alerts: {summary.get('total_alerts')}")
        print(f"   └─ High Severity: {summary.get('high_severity_alerts')}")
        print(f"   └─ Compliance Status: {summary.get('compliance_status')}")
        return True
    else:
        print_test("Case Report", "FAIL", f"Status Code: {response.status_code if response else 'No Response'}")
        return False

def test_status_endpoint():
    """Test extended status endpoint"""
    print_section("System Status")
    
    response = make_request("GET", "/status")
    if response and response.status_code == 200:
        data = response.json()
        stats = data.get("statistics", {})
        print_test("System Status", "PASS", f"System: {data.get('system')}")
        print(f"   └─ Total Trades: {stats.get('total_trades_stored')}")
        print(f"   └─ Active Alerts: {stats.get('active_alerts')}")
        print(f"   └─ Detected Cycles: {stats.get('detected_cycles')}")
        return True
    else:
        print_test("System Status", "FAIL", f"Status Code: {response.status_code if response else 'No Response'}")
        return False

def test_api_performance():
    """Test API response times"""
    print_section("Performance Testing")
    
    endpoints = [
        ("GET", "/health"),
        ("POST", "/detect/self-trades", {"token": "TEST"}),
        ("GET", "/status")
    ]
    
    for method, endpoint, data in endpoints:
        start_time = time.time()
        response = make_request(method, endpoint, data if method == "POST" else None)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        if response and response.status_code == 200:
            status = "PASS" if response_time < 1000 else "SLOW"  # Warn if > 1 second
            print_test(f"Performance {endpoint}", status, f"{response_time:.0f}ms")
        else:
            print_test(f"Performance {endpoint}", "FAIL", "Request failed")

def run_comprehensive_test():
    """Run all tests and provide summary"""
    print("🛡️  WashGuard Pro API - Comprehensive Test Suite")
    print("=" * 60)
    print(f"🎯 Testing API at: {API_BASE_URL}")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if API is reachable
    print_section("Pre-flight Check")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_test("API Connectivity", "PASS", "API is reachable")
        else:
            print_test("API Connectivity", "FAIL", f"Status: {response.status_code}")
            print("\n❌ API is not responding correctly. Please ensure the backend is running:")
            print("   python run.py dev  # or")
            print("   docker-compose up")
            return
    except requests.RequestException:
        print_test("API Connectivity", "FAIL", "Cannot reach API")
        print("\n❌ Cannot connect to API. Please ensure the backend is running:")
        print("   python run.py dev  # or")
        print("   docker-compose up")
        return
    
    # Run all tests
    tests = [
        test_health_endpoint,
        test_root_endpoint,
        test_ingest_trades,
        test_self_trade_detection,
        test_cycle_detection,
        test_volume_anomaly_detection,
        test_case_report,
        test_status_endpoint,
        test_api_performance
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test_func.__name__} failed with exception: {e}")
    
    # Summary
    print_section("Test Summary")
    success_rate = (passed / total) * 100
    print(f"📊 Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
    
    if success_rate == 100:
        print("🎉 All tests passed! Your WashGuard Pro API is working perfectly.")
        print("🔗 Frontend should be able to connect successfully.")
    elif success_rate >= 80:
        print("⚠️  Most tests passed. Check failed tests above.")
    else:
        print("❌ Multiple tests failed. Please check the API implementation.")
    
    print(f"\n🏁 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    run_comprehensive_test()