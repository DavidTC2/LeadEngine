from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SubscriptionTier(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    BUSINESS = "business"

class SubscriptionLimits(BaseModel):
    imports_per_month: int
    contacts_per_month: int
    cloud_backup: bool = False
    advanced_filtering: bool = False
    tagging: bool = False
    analytics: bool = False
    team_access: bool = False

class Subscription(BaseModel):
    user_id: str
    tier: SubscriptionTier = SubscriptionTier.FREE
    status: str = "active"  # active, expired, cancelled
    limits: SubscriptionLimits
    current_usage: Dict[str, int] = Field(default_factory=lambda: {"imports": 0, "contacts_saved": 0})
    start_date: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(BaseModel):
    email: str
    password_hash: Optional[str] = None
    name: str
    google_id: Optional[str] = None
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    naming_config: Dict[str, Any] = Field(default_factory=lambda: {
        "prefix": "Lead",
        "suffix": "",
        "auto_numbering": True,
        "number_start": 1
    })
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Lead(BaseModel):
    user_id: str
    phone_number: str
    display_name: Optional[str] = None
    source_chat: Optional[str] = None
    first_seen: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    import_id: str
    is_saved: bool = False
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Import(BaseModel):
    user_id: str
    filename: str
    total_numbers: int = 0
    unsaved_count: int = 0
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "completed"  # processing, completed, failed
    error_message: Optional[str] = None

# Request/Response Models
class ImportUploadRequest(BaseModel):
    filename: str
    content: str  # base64 encoded file content

class ParsedLead(BaseModel):
    phone_number: str
    display_name: Optional[str] = None
    first_seen: Optional[datetime] = None

class ImportParseResponse(BaseModel):
    import_id: str
    leads: List[ParsedLead]
    total_count: int
    duplicates_removed: int

class LeadFilterRequest(BaseModel):
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    is_saved: Optional[bool] = None
    tags: Optional[List[str]] = None
    search_query: Optional[str] = None

class BulkSaveRequest(BaseModel):
    lead_ids: List[str]
    naming_config: Optional[Dict[str, Any]] = None

class ExportVCFRequest(BaseModel):
    lead_ids: List[str]

class LeadStatsResponse(BaseModel):
    total_leads: int
    unsaved_leads: int
    saved_leads: int
    total_imports: int
    leads_this_month: int
    subscription_usage: Dict[str, Any]

# Tier configuration
SUBSCRIPTION_TIERS = {
    SubscriptionTier.FREE: SubscriptionLimits(
        imports_per_month=2,
        contacts_per_month=50,
        cloud_backup=False,
        advanced_filtering=False,
        tagging=False,
        analytics=False,
        team_access=False
    ),
    SubscriptionTier.BASIC: SubscriptionLimits(
        imports_per_month=10,
        contacts_per_month=1000,
        cloud_backup=False,
        advanced_filtering=False,
        tagging=False,
        analytics=False,
        team_access=False
    ),
    SubscriptionTier.PRO: SubscriptionLimits(
        imports_per_month=30,
        contacts_per_month=5000,
        cloud_backup=True,
        advanced_filtering=True,
        tagging=True,
        analytics=False,
        team_access=False
    ),
    SubscriptionTier.BUSINESS: SubscriptionLimits(
        imports_per_month=-1,  # unlimited
        contacts_per_month=-1,  # unlimited
        cloud_backup=True,
        advanced_filtering=True,
        tagging=True,
        analytics=True,
        team_access=True
    )
}
