import re
import phonenumbers
from typing import List, Dict, Optional, Set, Tuple
from datetime import datetime
from models import ParsedLead
import logging

logger = logging.getLogger(__name__)

class WhatsAppParser:
    """
    Parses WhatsApp exported chat files to extract phone numbers and metadata.
    Supports multiple formats and international phone numbers.
    """
    
    def __init__(self):
        # Regex patterns for different WhatsApp formats
        # Format 1: [DD/MM/YY, HH:MM:SS] Name: Message
        # Format 2: DD/MM/YY, HH:MM - Name: Message
        # Format 3: DD/MM/YYYY, HH:MM - Name: Message
        self.message_patterns = [
            r'\[(\d{1,2}/\d{1,2}/\d{2,4},\s\d{1,2}:\d{2}(?::\d{2})?(?:\s[AP]M)?)\]\s([^:]+):\s(.+)',
            r'(\d{1,2}/\d{1,2}/\d{2,4},\s\d{1,2}:\d{2}(?::\d{2})?(?:\s[AP]M)?)\s-\s([^:]+):\s(.+)',
            r'(\d{1,2}-\d{1,2}-\d{2,4},\s\d{1,2}:\d{2}(?::\d{2})?(?:\s[AP]M)?)\s-\s([^:]+):\s(.+)',
        ]
        
        # Phone number patterns (international formats)
        self.phone_patterns = [
            r'\+\d{1,4}[\s-]?\d{3,}[\s-]?\d{3,}[\s-]?\d{2,}',  # +234 xxx xxx xxx
            r'\b\d{10,15}\b',  # 10-15 digit numbers
            r'\b0\d{9,10}\b',  # Nigerian format: 0xxx
        ]
        
        # Compile patterns
        self.compiled_message_patterns = [re.compile(p, re.MULTILINE) for p in self.message_patterns]
        self.compiled_phone_patterns = [re.compile(p) for p in self.phone_patterns]
    
    def parse_chat_file(self, content: str, filename: str = "chat.txt") -> Tuple[List[ParsedLead], Set[str]]:
        """
        Parse WhatsApp chat content and extract phone numbers.
        
        Returns:
            Tuple of (list of ParsedLead objects, set of sender names found)
        """
        leads: Dict[str, ParsedLead] = {}  # Use dict to handle duplicates
        sender_names: Set[str] = set()
        
        try:
            lines = content.split('\n')
            logger.info(f"Parsing {len(lines)} lines from {filename}")
            
            for line in lines:
                if not line.strip():
                    continue
                
                # Try to match message pattern
                parsed = self._parse_message_line(line)
                if parsed:
                    timestamp, sender_name, message = parsed
                    sender_names.add(sender_name)
                    
                    # Check if sender name is a phone number
                    phone = self._extract_and_validate_phone(sender_name)
                    if phone:
                        if phone not in leads:
                            leads[phone] = ParsedLead(
                                phone_number=phone,
                                display_name=sender_name,
                                first_seen=timestamp
                            )
                    
                    # Extract phone numbers from message content
                    phones_in_message = self._extract_phones_from_text(message)
                    for phone in phones_in_message:
                        if phone not in leads:
                            leads[phone] = ParsedLead(
                                phone_number=phone,
                                display_name=None,
                                first_seen=timestamp
                            )
            
            logger.info(f"Extracted {len(leads)} unique phone numbers from {filename}")
            return list(leads.values()), sender_names
            
        except Exception as e:
            logger.error(f"Error parsing chat file {filename}: {str(e)}")
            raise
    
    def _parse_message_line(self, line: str) -> Optional[Tuple[Optional[datetime], str, str]]:
        """
        Parse a single message line to extract timestamp, sender, and message.
        """
        for pattern in self.compiled_message_patterns:
            match = pattern.match(line)
            if match:
                timestamp_str, sender_name, message = match.groups()
                timestamp = self._parse_timestamp(timestamp_str)
                return timestamp, sender_name.strip(), message.strip()
        return None
    
    def _parse_timestamp(self, timestamp_str: str) -> Optional[datetime]:
        """
        Parse timestamp from various formats.
        """
        timestamp_str = timestamp_str.strip('[]').strip()
        
        # Common timestamp formats
        formats = [
            '%d/%m/%Y, %H:%M:%S',
            '%d/%m/%y, %H:%M:%S',
            '%d/%m/%Y, %H:%M',
            '%d/%m/%y, %H:%M',
            '%d-%m-%Y, %H:%M:%S',
            '%d-%m-%y, %H:%M:%S',
            '%m/%d/%Y, %I:%M:%S %p',
            '%m/%d/%y, %I:%M %p',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(timestamp_str, fmt)
            except ValueError:
                continue
        
        logger.warning(f"Could not parse timestamp: {timestamp_str}")
        return None
    
    def _extract_phones_from_text(self, text: str) -> List[str]:
        """
        Extract and validate phone numbers from text.
        """
        phones = []
        for pattern in self.compiled_phone_patterns:
            matches = pattern.findall(text)
            for match in matches:
                phone = self._extract_and_validate_phone(match)
                if phone:
                    phones.append(phone)
        return phones
    
    def _extract_and_validate_phone(self, text: str) -> Optional[str]:
        """
        Extract and validate a phone number, returning normalized format.
        """
        try:
            # Clean the text
            cleaned = re.sub(r'[^\d+]', '', text)
            
            # Skip if too short or too long
            if len(cleaned) < 10 or len(cleaned) > 15:
                return None
            
            # Try parsing as Nigerian number first
            try:
                parsed = phonenumbers.parse(cleaned, "NG")
                if phonenumbers.is_valid_number(parsed):
                    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            except:
                pass
            
            # Try parsing with + prefix
            if not cleaned.startswith('+'):
                cleaned_with_plus = '+' + cleaned
                try:
                    parsed = phonenumbers.parse(cleaned_with_plus, None)
                    if phonenumbers.is_valid_number(parsed):
                        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
                except:
                    pass
            
            # Try parsing without region
            try:
                parsed = phonenumbers.parse(cleaned, None)
                if phonenumbers.is_valid_number(parsed):
                    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            except:
                pass
            
            return None
            
        except Exception as e:
            logger.debug(f"Could not validate phone: {text} - {str(e)}")
            return None
    
    def is_likely_phone_number(self, name: str) -> bool:
        """
        Check if a name is likely a phone number (unsaved contact).
        """
        # Remove common prefixes
        name = name.strip()
        if name.startswith('+'):
            return True
        
        # Check if mostly digits
        digits = sum(c.isdigit() for c in name)
        if digits >= 8 and digits / len(name) > 0.6:
            return True
        
        return False
