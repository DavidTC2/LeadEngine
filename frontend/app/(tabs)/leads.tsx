import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as Contacts from 'expo-contacts';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getLeads, bulkSaveLeads, exportVCF } from '../../utils/api';
import { Lead } from '../../types';

export default function LeadsScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unsaved' | 'saved'>('unsaved');
  const [saving, setSaving] = useState(false);
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [namingPrefix, setNamingPrefix] = useState('Lead');
  const [namingSuffix, setNamingSuffix] = useState('');
  const [autoNumbering, setAutoNumbering] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      const params: any = { limit: 1000 };
      
      if (filter === 'unsaved') {
        params.is_saved = false;
      } else if (filter === 'saved') {
        params.is_saved = true;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const data = await getLeads(params);
      setLeads(data.leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      Alert.alert('Error', 'Failed to fetch leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(lead => lead._id)));
    }
  };

  const toggleSelect = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  };

  const generateContactName = (lead: Lead, index: number): string => {
    let name = namingPrefix;
    
    if (autoNumbering) {
      name += `-${String(index + 1).padStart(3, '0')}`;
    }
    
    if (lead.display_name && lead.display_name !== lead.phone_number) {
      name += `-${lead.display_name}`;
    }
    
    if (namingSuffix) {
      name += `-${namingSuffix}`;
    }
    
    return name;
  };

  const handleBulkSave = async () => {
    if (selectedLeads.size === 0) {
      Alert.alert('No Selection', 'Please select leads to save');
      return;
    }

    // Request permissions
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Contacts permission is required to save leads');
      return;
    }

    setSaving(true);

    try {
      const selectedLeadsArray = leads.filter(lead => selectedLeads.has(lead._id));
      let successCount = 0;

      for (let i = 0; i < selectedLeadsArray.length; i++) {
        const lead = selectedLeadsArray[i];
        const contactName = generateContactName(lead, i);

        try {
          // Create contact on device
          await Contacts.addContactAsync({
            [Contacts.Fields.FirstName]: contactName,
            [Contacts.Fields.PhoneNumbers]: [{
              label: 'mobile',
              number: lead.phone_number,
            }],
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to save contact ${contactName}:`, error);
        }
      }

      // Update backend
      await bulkSaveLeads(Array.from(selectedLeads));

      Alert.alert(
        'Success!',
        `Saved ${successCount} of ${selectedLeads.size} contacts to your device`
      );

      setSelectedLeads(new Set());
      setShowNamingModal(false);
      fetchLeads();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save contacts');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (selectedLeads.size === 0) {
      Alert.alert('No Selection', 'Please select leads to export');
      return;
    }

    try {
      const result = await exportVCF(Array.from(selectedLeads));
      
      // Decode base64 and save to file
      const vcfContent = atob(result.vcf_content);
      const fileUri = `${FileSystem.cacheDirectory}contacts.vcf`;
      await FileSystem.writeAsStringAsync(fileUri, vcfContent);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/vcard',
          dialogTitle: 'Export Contacts',
        });
      } else {
        Alert.alert('Success', `Exported ${result.count} contacts`);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Error', error.message || 'Failed to export contacts');
    }
  };

  const renderLead = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      style={styles.leadItem}
      onPress={() => toggleSelect(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.checkbox}>
        {selectedLeads.has(item._id) && (
          <Ionicons name="checkmark" size={18} color="#ffffff" />
        )}
      </View>
      
      <View style={styles.leadInfo}>
        <Text style={styles.leadName}>
          {item.display_name || item.phone_number}
        </Text>
        <Text style={styles.leadPhone}>{item.phone_number}</Text>
        {item.source_chat && (
          <Text style={styles.leadSource} numberOfLines={1}>
            From: {item.source_chat}
          </Text>
        )}
      </View>

      {item.is_saved ? (
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
        </View>
      ) : (
        <Ionicons name="alert-circle" size={20} color="#f59e0b" />
      )}
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({leads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'unsaved' && styles.filterButtonActive]}
          onPress={() => setFilter('unsaved')}
        >
          <Text style={[styles.filterText, filter === 'unsaved' && styles.filterTextActive]}>
            Unsaved
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'saved' && styles.filterButtonActive]}
          onPress={() => setFilter('saved')}
        >
          <Text style={[styles.filterText, filter === 'saved' && styles.filterTextActive]}>
            Saved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Select All */}
      {leads.length > 0 && (
        <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
          <Ionicons
            name={selectedLeads.size === leads.length ? 'checkbox' : 'square-outline'}
            size={20}
            color="#2563eb"
          />
          <Text style={styles.selectAllText}>
            {selectedLeads.size === leads.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlashList
        data={leads}
        renderItem={renderLead}
        estimatedItemSize={80}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No leads found</Text>
            <Text style={styles.emptySubtext}>
              Import WhatsApp chats to get started
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Bottom Action Bar */}
      {selectedLeads.size > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedCount}>
            {selectedLeads.size} selected
          </Text>
          
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleExport}
            >
              <Ionicons name="download-outline" size={20} color="#2563eb" />
              <Text style={styles.actionButtonText}>Export</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={() => setShowNamingModal(true)}
            >
              <Ionicons name="save-outline" size={20} color="#ffffff" />
              <Text style={[styles.actionButtonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Naming Configuration Modal */}
      <Modal
        visible={showNamingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNamingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure Contact Names</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prefix</Text>
              <TextInput
                style={styles.input}
                value={namingPrefix}
                onChangeText={setNamingPrefix}
                placeholder="e.g. Lead, Customer"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Suffix (Optional)</Text>
              <TextInput
                style={styles.input}
                value={namingSuffix}
                onChangeText={setNamingSuffix}
                placeholder="e.g. June, Lagos"
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAutoNumbering(!autoNumbering)}
            >
              <Ionicons
                name={autoNumbering ? 'checkbox' : 'square-outline'}
                size={24}
                color="#2563eb"
              />
              <Text style={styles.checkboxLabel}>Auto-numbering (001, 002, ...)</Text>
            </TouchableOpacity>

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <Text style={styles.previewText}>
                {generateContactName(leads[0] || { phone_number: '+234xxx', display_name: 'John' } as Lead, 0)}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNamingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleBulkSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Save Contacts</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listHeader: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#111827',
  },
  filters: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },
  leadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    marginRight: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  leadPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  leadSource: {
    fontSize: 12,
    color: '#9ca3af',
  },
  savedBadge: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        paddingBottom: 32,
      },
    }),
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bottomActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  previewBox: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
