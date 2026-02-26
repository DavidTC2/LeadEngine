import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [namingPrefix, setNamingPrefix] = useState('Lead');
  const [namingSuffix, setNamingSuffix] = useState('');
  const [autoNumbering, setAutoNumbering] = useState(true);
  const [cloudBackup, setCloudBackup] = useState(false);

  const handleSaveSettings = () => {
    Alert.alert('Success', 'Settings saved successfully');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
          <Text style={styles.userName}>Demo User</Text>
          <Text style={styles.userEmail}>demo@leadmanager.com</Text>
        </View>

        {/* Subscription Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={styles.subscriptionTier}>Free Trial</Text>
                <Text style={styles.subscriptionExpiry}>7 days remaining</Text>
              </View>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            </View>

            <View style={styles.limitsContainer}>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Imports this month</Text>
                <Text style={styles.limitValue}>0 / 2</Text>
              </View>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Contacts saved</Text>
                <Text style={styles.limitValue}>0 / 50</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Basic</Text>
              <Text style={styles.planPrice}>$9/month</Text>
            </View>
            <Text style={styles.planFeature}>• 10 imports per month</Text>
            <Text style={styles.planFeature}>• 1,000 contacts per month</Text>
            <Text style={styles.planFeature}>• Custom naming</Text>
            <Text style={styles.planFeature}>• Duplicate detection</Text>
          </View>

          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Pro</Text>
              <Text style={styles.planPrice}>$19/month</Text>
            </View>
            <Text style={styles.planFeature}>• 30 imports per month</Text>
            <Text style={styles.planFeature}>• 5,000 contacts per month</Text>
            <Text style={styles.planFeature}>• Advanced filtering</Text>
            <Text style={styles.planFeature}>• Tagging system</Text>
            <Text style={styles.planFeature}>• Cloud backup</Text>
          </View>

          <View style={[styles.planCard, styles.businessCard]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, styles.businessPlanName]}>Business</Text>
              <Text style={[styles.planPrice, styles.businessPlanPrice]}>$39/month</Text>
            </View>
            <Text style={styles.businessFeature}>• Unlimited imports</Text>
            <Text style={styles.businessFeature}>• Unlimited contacts</Text>
            <Text style={styles.businessFeature}>• Team access</Text>
            <Text style={styles.businessFeature}>• Advanced analytics</Text>
            <Text style={styles.businessFeature}>• Priority support</Text>
          </View>
        </View>

        {/* Naming Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Contact Naming</Text>
          
          <View style={styles.settingCard}>
            <Text style={styles.inputLabel}>Prefix</Text>
            <TextInput
              style={styles.input}
              value={namingPrefix}
              onChangeText={setNamingPrefix}
              placeholder="e.g. Lead, Customer"
            />

            <Text style={styles.inputLabel}>Suffix (Optional)</Text>
            <TextInput
              style={styles.input}
              value={namingSuffix}
              onChangeText={setNamingSuffix}
              placeholder="e.g. June, Lagos"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Auto-numbering</Text>
              <Switch
                value={autoNumbering}
                onValueChange={setAutoNumbering}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={autoNumbering ? '#2563eb' : '#f3f4f6'}
              />
            </View>

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <Text style={styles.previewText}>
                {namingPrefix}{autoNumbering ? '-001' : ''}{namingSuffix ? `-${namingSuffix}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Cloud Backup</Text>
                <Text style={styles.switchSubtext}>Pro plan required</Text>
              </View>
              <Switch
                value={cloudBackup}
                onValueChange={setCloudBackup}
                disabled
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={cloudBackup ? '#2563eb' : '#f3f4f6'}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>WhatsApp Lead Manager</Text>
            <Text style={styles.appVersion}>Version 1.0.0 (MVP)</Text>
            <Text style={styles.appDescription}>
              Efficiently manage WhatsApp leads with bulk import and save capabilities.
            </Text>
            
            <TouchableOpacity style={styles.linkButton}>
              <Ionicons name="document-text-outline" size={20} color="#2563eb" />
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkButton}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#2563eb" />
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#dbeafe',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subscriptionCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subscriptionTier: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subscriptionExpiry: {
    fontSize: 14,
    color: '#6b7280',
  },
  freeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  limitsContainer: {
    marginBottom: 16,
  },
  limitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  limitLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  limitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  upgradeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
  planCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  businessCard: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  businessPlanName: {
    color: '#ffffff',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  businessPlanPrice: {
    color: '#ffffff',
  },
  planFeature: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  businessFeature: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 4,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  switchSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  previewBox: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
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
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },
});
