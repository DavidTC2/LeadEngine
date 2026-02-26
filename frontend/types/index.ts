export interface Lead {
  _id: string;
  user_id: string;
  phone_number: string;
  display_name?: string;
  source_chat?: string;
  first_seen: string;
  last_seen: string;
  import_id: string;
  is_saved: boolean;
  tags: string[];
  notes?: string;
  created_at: string;
}

export interface ParsedLead {
  phone_number: string;
  display_name?: string;
  first_seen?: string;
}

export interface ImportParseResponse {
  import_id: string;
  leads: ParsedLead[];
  total_count: number;
  duplicates_removed: number;
}

export interface LeadStats {
  total_leads: number;
  unsaved_leads: number;
  saved_leads: number;
  total_imports: number;
  leads_this_month: number;
  subscription_usage: {
    imports: number;
    contacts_saved: number;
    tier: string;
  };
}

export interface NamingConfig {
  prefix: string;
  suffix: string;
  auto_numbering: boolean;
  number_start: number;
}
