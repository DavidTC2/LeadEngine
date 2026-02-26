from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import base64
from bson import ObjectId

from models import (
    ImportUploadRequest, ImportParseResponse, LeadFilterRequest,
    BulkSaveRequest, ExportVCFRequest, LeadStatsResponse,
    Lead, Import, User, Subscription, ParsedLead,
    SubscriptionTier, SUBSCRIPTION_TIERS
)
from whatsapp_parser import WhatsAppParser

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="WhatsApp Lead Manager API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize parser
parser = WhatsAppParser()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper function to convert ObjectId to string
def serialize_doc(doc: Dict) -> Dict:
    """Convert MongoDB document to JSON-serializable format"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ==================== IMPORT ENDPOINTS ====================

@api_router.post("/import/parse", response_model=ImportParseResponse)
async def parse_import(request: ImportUploadRequest):
    """
    Parse uploaded WhatsApp chat file and extract phone numbers.
    For MVP, user_id is hardcoded. Will be replaced with JWT auth in Phase 2.
    """
    try:
        # Decode base64 content
        content = base64.b64decode(request.content).decode('utf-8')
        
        # Parse chat file
        parsed_leads, sender_names = parser.parse_chat_file(content, request.filename)
        
        # Create import record
        import_id = str(uuid.uuid4())
        import_record = Import(
            user_id="demo_user",  # MVP: hardcoded, will be from JWT in Phase 2
            filename=request.filename,
            total_numbers=len(parsed_leads),
            unsaved_count=len(parsed_leads),  # Will be updated after contact checking
            processed_at=datetime.utcnow(),
            status="completed"
        )
        
        # Store import record
        await db.imports.insert_one(import_record.dict())
        
        # Store leads
        leads_to_store = []
        for parsed_lead in parsed_leads:
            # Check if lead already exists
            existing = await db.leads.find_one({
                "user_id": "demo_user",
                "phone_number": parsed_lead.phone_number
            })
            
            if existing:
                # Update last_seen
                await db.leads.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"last_seen": datetime.utcnow()}}
                )
            else:
                # Create new lead
                lead = Lead(
                    user_id="demo_user",
                    phone_number=parsed_lead.phone_number,
                    display_name=parsed_lead.display_name,
                    source_chat=request.filename,
                    first_seen=parsed_lead.first_seen or datetime.utcnow(),
                    last_seen=datetime.utcnow(),
                    import_id=import_id,
                    is_saved=False,
                    tags=[],
                    notes=None
                )
                leads_to_store.append(lead.dict())
        
        if leads_to_store:
            await db.leads.insert_many(leads_to_store)
        
        logger.info(f"Parsed {len(parsed_leads)} leads from {request.filename}")
        
        return ImportParseResponse(
            import_id=import_id,
            leads=parsed_leads,
            total_count=len(parsed_leads),
            duplicates_removed=len(parsed_leads) - len(leads_to_store)
        )
        
    except Exception as e:
        logger.error(f"Error parsing import: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")

# ==================== LEAD ENDPOINTS ====================

@api_router.get("/leads")
async def get_leads(
    is_saved: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get leads with optional filtering"""
    try:
        query: Dict[str, Any] = {"user_id": "demo_user"}
        
        if is_saved is not None:
            query["is_saved"] = is_saved
        
        if search:
            query["$or"] = [
                {"phone_number": {"$regex": search, "$options": "i"}},
                {"display_name": {"$regex": search, "$options": "i"}}
            ]
        
        leads = await db.leads.find(query).sort("last_seen", -1).skip(skip).limit(limit).to_list(limit)
        total = await db.leads.count_documents(query)
        
        return {
            "leads": [serialize_doc(lead) for lead in leads],
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching leads: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/leads/bulk-save")
async def bulk_save_leads(request: BulkSaveRequest):
    """Mark leads as saved (actual contact saving happens on device)"""
    try:
        # Convert string IDs to ObjectId
        lead_ids = [ObjectId(lid) for lid in request.lead_ids]
        
        # Update leads
        result = await db.leads.update_many(
            {"_id": {"$in": lead_ids}},
            {"$set": {"is_saved": True}}
        )
        
        logger.info(f"Marked {result.modified_count} leads as saved")
        
        return {
            "success": True,
            "updated_count": result.modified_count
        }
        
    except Exception as e:
        logger.error(f"Error saving leads: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/leads/export-vcf")
async def export_vcf(request: ExportVCFRequest):
    """Generate VCF content for selected leads"""
    try:
        # Convert string IDs to ObjectId
        lead_ids = [ObjectId(lid) for lid in request.lead_ids]
        
        # Fetch leads
        leads = await db.leads.find({"_id": {"$in": lead_ids}}).to_list(len(lead_ids))
        
        # Generate VCF content
        vcf_content = ""
        for lead in leads:
            display_name = lead.get("display_name") or lead.get("phone_number")
            phone = lead.get("phone_number")
            
            vcf_content += "BEGIN:VCARD\n"
            vcf_content += "VERSION:3.0\n"
            vcf_content += f"FN:{display_name}\n"
            vcf_content += f"TEL;TYPE=CELL:{phone}\n"
            vcf_content += "END:VCARD\n"
        
        # Encode to base64 for easy transfer
        vcf_base64 = base64.b64encode(vcf_content.encode()).decode()
        
        return {
            "success": True,
            "vcf_content": vcf_base64,
            "count": len(leads)
        }
        
    except Exception as e:
        logger.error(f"Error exporting VCF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/leads/stats", response_model=LeadStatsResponse)
async def get_stats():
    """Get lead statistics"""
    try:
        user_id = "demo_user"
        
        total_leads = await db.leads.count_documents({"user_id": user_id})
        unsaved_leads = await db.leads.count_documents({"user_id": user_id, "is_saved": False})
        saved_leads = await db.leads.count_documents({"user_id": user_id, "is_saved": True})
        total_imports = await db.imports.count_documents({"user_id": user_id})
        
        # Leads this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        leads_this_month = await db.leads.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": month_start}
        })
        
        return LeadStatsResponse(
            total_leads=total_leads,
            unsaved_leads=unsaved_leads,
            saved_leads=saved_leads,
            total_imports=total_imports,
            leads_this_month=leads_this_month,
            subscription_usage={
                "imports": total_imports,
                "contacts_saved": saved_leads,
                "tier": "free"
            }
        )
        
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str):
    """Delete a lead"""
    try:
        result = await db.leads.delete_one({"_id": ObjectId(lead_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
        return {"success": True}
    except Exception as e:
        logger.error(f"Error deleting lead: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {
        "message": "WhatsApp Lead Manager API",
        "version": "1.0.0",
        "status": "operational"
    }

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        await db.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
