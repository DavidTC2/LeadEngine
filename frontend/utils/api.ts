import axios from 'axios';
import { Lead, ImportParseResponse, LeadStats } from '../types';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
const BASE_URL = `${API_URL}/api`;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Import APIs
export const parseImport = async (filename: string, content: string): Promise<ImportParseResponse> => {
  const response = await api.post('/import/parse', {
    filename,
    content,
  });
  return response.data;
};

// Lead APIs
export const getLeads = async (params: {
  is_saved?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<{ leads: Lead[]; total: number }> => {
  const response = await api.get('/leads', { params });
  return response.data;
};

export const bulkSaveLeads = async (leadIds: string[]): Promise<{ success: boolean; updated_count: number }> => {
  const response = await api.post('/leads/bulk-save', {
    lead_ids: leadIds,
  });
  return response.data;
};

export const exportVCF = async (leadIds: string[]): Promise<{ success: boolean; vcf_content: string; count: number }> => {
  const response = await api.post('/leads/export-vcf', {
    lead_ids: leadIds,
  });
  return response.data;
};

export const getStats = async (): Promise<LeadStats> => {
  const response = await api.get('/leads/stats');
  return response.data;
};

export const deleteLead = async (leadId: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`/leads/${leadId}`);
  return response.data;
};

// Health check
export const healthCheck = async (): Promise<any> => {
  const response = await api.get('/health');
  return response.data;
};
