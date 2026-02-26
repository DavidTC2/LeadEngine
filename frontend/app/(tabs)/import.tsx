import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parseImport } from '../../utils/api';
import { useRouter } from 'expo-router';

export default function ImportScreen() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        setSelectedFiles(result.assets);
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Error', 'Failed to pick files');
    }
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('No Files', 'Please select at least one chat file to import');
      return;
    }

    setImporting(true);
    setProgress('Starting import...');

    try {
      let totalLeads = 0;
      let totalDuplicates = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProgress(`Processing ${i + 1}/${selectedFiles.length}: ${file.name}`);

        // Read file content
        const content = await FileSystem.readAsStringAsync(file.uri);
        
        // Convert to base64
        const base64Content = btoa(content);

        // Parse import
        const result = await parseImport(file.name, base64Content);
        
        totalLeads += result.total_count;
        totalDuplicates += result.duplicates_removed;
      }

      setProgress('Import complete!');
      Alert.alert(
        'Success!',
        `Imported ${totalLeads} leads from ${selectedFiles.length} file(s).\n${totalDuplicates} duplicates were merged.`,
        [
          {
            text: 'View Leads',
            onPress: () => router.push('/leads'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );

      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', error.message || 'An error occurred during import');
    } finally {
      setImporting(false);
      setProgress('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Instructions Card */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="information-circle" size={24} color="#2563eb" />
            <Text style={styles.instructionsTitle}>How to Export WhatsApp Chats</Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Open WhatsApp and go to the chat</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Tap the menu (⋮) {'>'} More {'>'} Export chat</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Choose "Without Media"</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Save the .txt file</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <Text style={styles.stepText}>Come back here and upload the file!</Text>
          </View>
        </View>

        {/* File Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Chat Files</Text>
          
          <TouchableOpacity
            style={styles.selectButton}
            onPress={pickFiles}
            disabled={importing}
          >
            <Ionicons name="document-text-outline" size={24} color="#2563eb" />
            <Text style={styles.selectButtonText}>Select Files</Text>
          </TouchableOpacity>

          {selectedFiles.length > 0 && (
            <View style={styles.filesList}>
              <Text style={styles.filesListTitle}>
                {selectedFiles.length} file(s) selected:
              </Text>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <Ionicons name="document-outline" size={20} color="#6b7280" />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Import Button */}
        {selectedFiles.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.importButton, importing && styles.importButtonDisabled]}
              onPress={handleImport}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons name="cloud-upload" size={24} color="#ffffff" />
              )}
              <Text style={styles.importButtonText}>
                {importing ? 'Importing...' : 'Import Leads'}
              </Text>
            </TouchableOpacity>

            {importing && progress && (
              <Text style={styles.progressText}>{progress}</Text>
            )}
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipText}>• You can select multiple files at once</Text>
          <Text style={styles.tipText}>• Export files without media for faster processing</Text>
          <Text style={styles.tipText}>• Duplicates are automatically detected and merged</Text>
          <Text style={styles.tipText}>• Works with both WhatsApp and WhatsApp Business</Text>
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
  instructionsCard: {
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginLeft: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepText: {
    fontSize: 15,
    color: '#1e40af',
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },
  filesList: {
    marginTop: 16,
  },
  filesListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  tipsCard: {
    backgroundColor: '#fffbeb',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 6,
  },
});
