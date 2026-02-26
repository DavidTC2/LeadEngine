#!/usr/bin/env python3
"""
Debug VCF export issue
"""

import requests
import base64
import json

# Backend URL from environment
BACKEND_URL = "https://lead-capture-pro-11.preview.emergentagent.com/api"

def debug_vcf_export():
    # First get some leads
    response = requests.get(f"{BACKEND_URL}/leads")
    leads_data = response.json()
    
    if leads_data["total"] > 0:
        # Take first 2 leads
        lead_ids = [lead["_id"] for lead in leads_data["leads"][:2]]
        
        # Export VCF
        export_response = requests.post(f"{BACKEND_URL}/leads/export-vcf", 
                                      json={"lead_ids": lead_ids})
        
        if export_response.status_code == 200:
            data = export_response.json()
            
            # Decode VCF content
            vcf_content = base64.b64decode(data["vcf_content"]).decode()
            
            print("VCF Content:")
            print("=" * 50)
            print(repr(vcf_content))
            print("=" * 50)
            print(vcf_content)
            print("=" * 50)
            
            # Check what's missing
            checks = {
                "BEGIN:VCARD": "BEGIN:VCARD" in vcf_content,
                "END:VCARD": "END:VCARD" in vcf_content,
                "FN:": "FN:" in vcf_content,
                "TEL:": "TEL:" in vcf_content
            }
            
            print("Format checks:")
            for check, result in checks.items():
                print(f"  {check}: {'✅' if result else '❌'}")
                
        else:
            print(f"Export failed: {export_response.status_code}")
    else:
        print("No leads found")

if __name__ == "__main__":
    debug_vcf_export()