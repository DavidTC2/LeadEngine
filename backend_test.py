#!/usr/bin/env python3
"""
Comprehensive backend API testing for WhatsApp Lead Manager
Tests all endpoints according to the review request specifications
"""

import requests
import base64
import json
from datetime import datetime
from typing import Dict, List, Any
import sys
import os

# Backend URL from environment
BACKEND_URL = "https://lead-capture-pro-11.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.results = {
            "tests_run": 0,
            "tests_passed": 0,
            "tests_failed": 0,
            "failures": [],
            "lead_ids": [],  # Store lead IDs for later tests
            "import_id": None
        }
    
    def log(self, message: str):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
    
    def test_result(self, test_name: str, passed: bool, details: str = ""):
        self.results["tests_run"] += 1
        if passed:
            self.results["tests_passed"] += 1
            self.log(f"✅ {test_name}")
        else:
            self.results["tests_failed"] += 1
            self.results["failures"].append(f"{test_name}: {details}")
            self.log(f"❌ {test_name}: {details}")
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with error handling"""
        try:
            url = f"{BACKEND_URL}{endpoint}"
            response = self.session.request(method, url, timeout=30, **kwargs)
            self.log(f"{method} {url} -> {response.status_code}")
            return response
        except Exception as e:
            self.log(f"❌ Request failed: {str(e)}")
            raise

    def test_root_endpoint(self):
        """Test GET /api/"""
        try:
            response = self.make_request("GET", "/")
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["message", "version", "status"]
                
                if all(field in data for field in expected_fields):
                    if (data["message"] == "WhatsApp Lead Manager API" and 
                        data["version"] == "1.0.0" and 
                        data["status"] == "operational"):
                        self.test_result("Root endpoint", True)
                    else:
                        self.test_result("Root endpoint", False, f"Unexpected values: {data}")
                else:
                    self.test_result("Root endpoint", False, f"Missing fields in response: {data}")
            else:
                self.test_result("Root endpoint", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Root endpoint", False, str(e))

    def test_health_check(self):
        """Test GET /api/health"""
        try:
            response = self.make_request("GET", "/health")
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["status", "database", "timestamp"]
                
                if all(field in data for field in expected_fields):
                    if data["status"] == "healthy" and data["database"] == "connected":
                        self.test_result("Health check", True)
                    else:
                        self.test_result("Health check", False, f"Unhealthy status: {data}")
                else:
                    self.test_result("Health check", False, f"Missing fields: {data}")
            else:
                self.test_result("Health check", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Health check", False, str(e))

    def test_import_parse(self):
        """Test POST /api/import/parse"""
        try:
            # Read sample chat file
            sample_file_path = "/app/sample_whatsapp_chat.txt"
            if not os.path.exists(sample_file_path):
                self.test_result("Import parse", False, "Sample chat file not found")
                return
            
            with open(sample_file_path, 'r') as f:
                chat_content = f.read()
            
            # Encode to base64
            content_base64 = base64.b64encode(chat_content.encode()).decode()
            
            payload = {
                "filename": "test.txt",
                "content": content_base64
            }
            
            response = self.make_request("POST", "/import/parse", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["import_id", "leads", "total_count", "duplicates_removed"]
                
                if all(field in data for field in expected_fields):
                    # Store import_id for later use
                    self.results["import_id"] = data["import_id"]
                    
                    # Verify we got Nigerian phone numbers (7 expected)
                    if data["total_count"] == 7:
                        # Check that leads contain Nigerian phone numbers
                        phone_numbers = [lead["phone_number"] for lead in data["leads"]]
                        nigerian_numbers = [phone for phone in phone_numbers if phone.startswith("+234")]
                        
                        if len(nigerian_numbers) == 7:
                            self.test_result("Import parse", True)
                            self.log(f"Successfully extracted {len(nigerian_numbers)} Nigerian numbers")
                        else:
                            self.test_result("Import parse", False, f"Expected 7 Nigerian numbers, got {len(nigerian_numbers)}")
                    else:
                        self.test_result("Import parse", False, f"Expected 7 leads, got {data['total_count']}")
                else:
                    self.test_result("Import parse", False, f"Missing fields: {data}")
            else:
                self.test_result("Import parse", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Import parse", False, str(e))

    def test_get_leads_all(self):
        """Test GET /api/leads (all leads)"""
        try:
            response = self.make_request("GET", "/leads")
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["leads", "total", "skip", "limit"]
                
                if all(field in data for field in expected_fields):
                    if data["total"] >= 7:  # Should have at least 7 leads from import
                        # Store lead IDs for later tests
                        self.results["lead_ids"] = [lead["_id"] for lead in data["leads"]]
                        self.test_result("Get leads (all)", True)
                        self.log(f"Found {data['total']} total leads")
                    else:
                        self.test_result("Get leads (all)", False, f"Expected at least 7 leads, got {data['total']}")
                else:
                    self.test_result("Get leads (all)", False, f"Missing fields: {data}")
            else:
                self.test_result("Get leads (all)", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Get leads (all)", False, str(e))

    def test_get_leads_unsaved(self):
        """Test GET /api/leads?is_saved=false"""
        try:
            response = self.make_request("GET", "/leads", params={"is_saved": False})
            
            if response.status_code == 200:
                data = response.json()
                
                if "leads" in data and "total" in data:
                    # All leads should be unsaved initially
                    if data["total"] >= 7:
                        # Verify all are unsaved
                        all_unsaved = all(not lead.get("is_saved", True) for lead in data["leads"])
                        if all_unsaved:
                            self.test_result("Get leads (unsaved)", True)
                        else:
                            self.test_result("Get leads (unsaved)", False, "Some leads marked as saved")
                    else:
                        self.test_result("Get leads (unsaved)", False, f"Expected at least 7 unsaved leads, got {data['total']}")
                else:
                    self.test_result("Get leads (unsaved)", False, f"Missing fields: {data}")
            else:
                self.test_result("Get leads (unsaved)", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Get leads (unsaved)", False, str(e))

    def test_get_leads_search(self):
        """Test GET /api/leads?search=234"""
        try:
            response = self.make_request("GET", "/leads", params={"search": "234"})
            
            if response.status_code == 200:
                data = response.json()
                
                if "leads" in data and "total" in data:
                    # Should find Nigerian numbers containing "234"
                    if data["total"] > 0:
                        # Verify search results contain "234"
                        contains_234 = all("234" in lead.get("phone_number", "") or 
                                         "234" in lead.get("display_name", "") 
                                         for lead in data["leads"])
                        if contains_234:
                            self.test_result("Get leads (search)", True)
                        else:
                            self.test_result("Get leads (search)", False, "Search results don't contain '234'")
                    else:
                        self.test_result("Get leads (search)", False, "No search results found for '234'")
                else:
                    self.test_result("Get leads (search)", False, f"Missing fields: {data}")
            else:
                self.test_result("Get leads (search)", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Get leads (search)", False, str(e))

    def test_get_leads_pagination(self):
        """Test GET /api/leads?skip=0&limit=5"""
        try:
            response = self.make_request("GET", "/leads", params={"skip": 0, "limit": 5})
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["leads", "total", "skip", "limit"]
                
                if all(field in data for field in expected_fields):
                    if (data["skip"] == 0 and data["limit"] == 5 and 
                        len(data["leads"]) <= 5):
                        self.test_result("Get leads (pagination)", True)
                    else:
                        self.test_result("Get leads (pagination)", False, f"Pagination params incorrect: {data}")
                else:
                    self.test_result("Get leads (pagination)", False, f"Missing fields: {data}")
            else:
                self.test_result("Get leads (pagination)", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Get leads (pagination)", False, str(e))

    def test_bulk_save_leads(self):
        """Test POST /api/leads/bulk-save"""
        try:
            if not self.results["lead_ids"]:
                self.test_result("Bulk save leads", False, "No lead IDs available")
                return
            
            # Save first 3 leads
            lead_ids_to_save = self.results["lead_ids"][:3]
            
            payload = {
                "lead_ids": lead_ids_to_save
            }
            
            response = self.make_request("POST", "/leads/bulk-save", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["success", "updated_count"]
                
                if all(field in data for field in expected_fields):
                    if data["success"] and data["updated_count"] == 3:
                        self.test_result("Bulk save leads", True)
                    else:
                        self.test_result("Bulk save leads", False, f"Unexpected response: {data}")
                else:
                    self.test_result("Bulk save leads", False, f"Missing fields: {data}")
            else:
                self.test_result("Bulk save leads", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Bulk save leads", False, str(e))

    def test_get_leads_saved(self):
        """Test GET /api/leads?is_saved=true (after bulk save)"""
        try:
            response = self.make_request("GET", "/leads", params={"is_saved": True})
            
            if response.status_code == 200:
                data = response.json()
                
                if "leads" in data and "total" in data:
                    # Should have 3 saved leads
                    if data["total"] == 3:
                        # Verify all are saved
                        all_saved = all(lead.get("is_saved", False) for lead in data["leads"])
                        if all_saved:
                            self.test_result("Get leads (saved)", True)
                        else:
                            self.test_result("Get leads (saved)", False, "Some leads not marked as saved")
                    else:
                        self.test_result("Get leads (saved)", False, f"Expected 3 saved leads, got {data['total']}")
                else:
                    self.test_result("Get leads (saved)", False, f"Missing fields: {data}")
            else:
                self.test_result("Get leads (saved)", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Get leads (saved)", False, str(e))

    def test_export_vcf(self):
        """Test POST /api/leads/export-vcf"""
        try:
            if not self.results["lead_ids"]:
                self.test_result("Export VCF", False, "No lead IDs available")
                return
            
            # Export first 2 leads
            lead_ids_to_export = self.results["lead_ids"][:2]
            
            payload = {
                "lead_ids": lead_ids_to_export
            }
            
            response = self.make_request("POST", "/leads/export-vcf", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["success", "vcf_content", "count"]
                
                if all(field in data for field in expected_fields):
                    if data["success"] and data["count"] == 2:
                        # Decode and verify VCF content
                        try:
                            vcf_content = base64.b64decode(data["vcf_content"]).decode()
                            
                            # Check VCF format
                            if ("BEGIN:VCARD" in vcf_content and 
                                "END:VCARD" in vcf_content and
                                "FN:" in vcf_content and 
                                "TEL:" in vcf_content):
                                # Count vCards
                                vcard_count = vcf_content.count("BEGIN:VCARD")
                                if vcard_count == 2:
                                    self.test_result("Export VCF", True)
                                    self.log(f"VCF contains {vcard_count} contacts")
                                else:
                                    self.test_result("Export VCF", False, f"Expected 2 vCards, got {vcard_count}")
                            else:
                                self.test_result("Export VCF", False, "Invalid VCF format")
                        except Exception as e:
                            self.test_result("Export VCF", False, f"Failed to decode VCF: {str(e)}")
                    else:
                        self.test_result("Export VCF", False, f"Unexpected response: {data}")
                else:
                    self.test_result("Export VCF", False, f"Missing fields: {data}")
            else:
                self.test_result("Export VCF", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Export VCF", False, str(e))

    def test_get_stats(self):
        """Test GET /api/leads/stats"""
        try:
            response = self.make_request("GET", "/leads/stats")
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["total_leads", "unsaved_leads", "saved_leads", 
                                 "total_imports", "leads_this_month", "subscription_usage"]
                
                if all(field in data for field in expected_fields):
                    # Verify stats make sense
                    total = data["total_leads"]
                    unsaved = data["unsaved_leads"]
                    saved = data["saved_leads"]
                    
                    if total == unsaved + saved and total >= 7:
                        self.test_result("Get stats", True)
                        self.log(f"Stats: {total} total, {unsaved} unsaved, {saved} saved")
                    else:
                        self.test_result("Get stats", False, f"Stats don't add up: {total} != {unsaved} + {saved}")
                else:
                    self.test_result("Get stats", False, f"Missing fields: {data}")
            else:
                self.test_result("Get stats", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Get stats", False, str(e))

    def test_delete_lead(self):
        """Test DELETE /api/leads/{lead_id}"""
        try:
            if not self.results["lead_ids"]:
                self.test_result("Delete lead", False, "No lead IDs available")
                return
            
            # Delete the last lead
            lead_id = self.results["lead_ids"][-1]
            
            response = self.make_request("DELETE", f"/leads/{lead_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    # Verify lead is deleted by trying to fetch all leads
                    verify_response = self.make_request("GET", "/leads")
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        
                        # Check if the lead ID is no longer in the list
                        remaining_ids = [lead["_id"] for lead in verify_data["leads"]]
                        if lead_id not in remaining_ids:
                            self.test_result("Delete lead", True)
                        else:
                            self.test_result("Delete lead", False, "Lead still exists after deletion")
                    else:
                        self.test_result("Delete lead", False, "Could not verify deletion")
                else:
                    self.test_result("Delete lead", False, f"Deletion failed: {data}")
            else:
                self.test_result("Delete lead", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Delete lead", False, str(e))

    def test_final_stats(self):
        """Verify final stats after all operations"""
        try:
            response = self.make_request("GET", "/leads/stats")
            
            if response.status_code == 200:
                data = response.json()
                
                # After import (7), bulk save (3), delete (1), should have 6 total, 3 unsaved, 3 saved
                expected_total = 6
                expected_saved = 3
                expected_unsaved = 3
                
                if (data["total_leads"] == expected_total and
                    data["saved_leads"] == expected_saved and
                    data["unsaved_leads"] == expected_unsaved):
                    self.test_result("Final stats verification", True)
                else:
                    self.test_result("Final stats verification", False, 
                                   f"Expected {expected_total} total, {expected_saved} saved, {expected_unsaved} unsaved. Got: {data}")
            else:
                self.test_result("Final stats verification", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.test_result("Final stats verification", False, str(e))

    def run_all_tests(self):
        """Run all API tests in sequence"""
        self.log("Starting comprehensive backend API testing...")
        self.log(f"Backend URL: {BACKEND_URL}")
        
        # Test sequence as specified in review request
        self.test_root_endpoint()
        self.test_health_check()
        self.test_import_parse()
        self.test_get_leads_all()
        self.test_get_leads_unsaved()
        self.test_get_leads_search()
        self.test_get_leads_pagination()
        self.test_get_stats()
        self.test_bulk_save_leads()
        self.test_get_leads_saved()
        self.test_export_vcf()
        self.test_delete_lead()
        self.test_final_stats()
        
        # Print summary
        print("\n" + "="*50)
        print("BACKEND API TEST RESULTS")
        print("="*50)
        print(f"Tests Run: {self.results['tests_run']}")
        print(f"Tests Passed: {self.results['tests_passed']}")
        print(f"Tests Failed: {self.results['tests_failed']}")
        
        if self.results["failures"]:
            print("\nFAILURES:")
            for failure in self.results["failures"]:
                print(f"  - {failure}")
        
        success_rate = (self.results["tests_passed"] / self.results["tests_run"]) * 100
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        return self.results["tests_failed"] == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)