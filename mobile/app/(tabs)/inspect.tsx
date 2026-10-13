import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Camera, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, Layers } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { KitchenZone } from '../../src/types';

interface ZoneOption {
  key: KitchenZone;
  title: string;
  description: string;
  checklist: string[];
}

const ZONES: ZoneOption[] = [
  {
    key: 'prep_surface',
    title: 'Food Preparation Surfaces',
    description: 'Stainless steel tables, cutting boards, food contact areas.',
    checklist: ['Clean cutting boards', 'No cross-contamination', 'Sanitizer rags in bucket'],
  },
  {
    key: 'storage',
    title: 'Food Storage & Refrigeration',
    description: 'Walk-in chillers, reach-in fridges, dry storage shelving.',
    checklist: ['Covered containers', 'Raw meats below cooked food', 'Clean shelving'],
  },
  {
    key: 'dishwashing',
    title: 'Dishwashing & Sanitization Area',
    description: '3-compartment sinks, commercial dishwashers, drying racks.',
    checklist: ['No standing greywater', 'Clean drainage traps', 'Organized drying racks'],
  },
  {
    key: 'waste_disposal',
    title: 'Waste Disposal & Bins',
    description: 'Trash receptacles, recycling, compost bins.',
    checklist: ['Lidded bins in place', 'No overflowing trash', 'Clean surrounding floor'],
  },
  {
    key: 'equipment',
    title: 'Cooking Equipment & Hoods',
    description: 'Ranges, fryers, ovens, exhaust hoods and grease filters.',
    checklist: ['Degreased baffle filters', 'Clean burner trays', 'No heavy carbon buildup'],
  },
];

export default function InspectScreen() {
  const [selectedZone, setSelectedZone] = useState<KitchenZone>('prep_surface');

  const handleStartCapture = () => {
    Alert.alert(
      'AI Kitchen Inspector',
      `Zone selected: ${selectedZone.replace('_', ' ').toUpperCase()}\n\nIn Phase 2 & 5, this triggers camera capture with lighting & blur pre-checks, followed by live AI vision deduction analysis.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Sparkles size={24} color={Colors.primary} />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Transparent AI Kitchen Assessment</Text>
          <Text style={styles.bannerSubtitle}>
            Capture clear kitchen photos by zone to identify visible hygiene risks and get step-by-step cleaning recommendations.
          </Text>
        </View>
      </View>

      {/* Food Safety Notice */}
      <View style={styles.disclaimerCard}>
        <AlertTriangle size={18} color={Colors.warning} />
        <Text style={styles.disclaimerText}>
          CleanPlate AI evaluates <Text style={styles.bold}>visible cleanliness only</Text>. It does not certify bacterial absence, internal food temperatures, or replace official FSSAI/health department audits.
        </Text>
      </View>

      {/* Zone Selector Header */}
      <View style={styles.sectionHeader}>
        <Layers size={18} color={Colors.primaryLight} />
        <Text style={styles.sectionTitle}>Select Kitchen Zone to Inspect</Text>
      </View>

      {/* Zone Options */}
      {ZONES.map((zone) => {
        const isSelected = selectedZone === zone.key;
        return (
          <TouchableOpacity
            key={zone.key}
            onPress={() => setSelectedZone(zone.key)}
            style={[
              styles.zoneCard,
              isSelected && styles.zoneCardSelected,
            ]}
          >
            <View style={styles.zoneHeader}>
              <View style={styles.zoneTitleRow}>
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                />
                <Text
                  style={[
                    styles.zoneTitle,
                    isSelected && styles.zoneTitleSelected,
                  ]}
                >
                  {zone.title}
                </Text>
              </View>
            </View>

            <Text style={styles.zoneDescription}>{zone.description}</Text>

            <View style={styles.checklistContainer}>
              {zone.checklist.map((item, idx) => (
                <View key={idx} style={styles.checklistItem}>
                  <CheckCircle2 size={12} color={isSelected ? Colors.primary : Colors.textMuted} />
                  <Text style={styles.checklistText}>{item}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Photo Capture CTA */}
      <TouchableOpacity style={styles.ctaButton} onPress={handleStartCapture}>
        <Camera size={22} color="#0F172A" />
        <Text style={styles.ctaButtonText}>Capture Zone Photograph</Text>
        <ChevronRight size={20} color="#0F172A" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  banner: {
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  disclaimerCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#FDE68A',
    lineHeight: 17,
  },
  bold: {
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textLight,
  },
  zoneCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  zoneCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#1E293B',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  zoneTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  zoneTitleSelected: {
    color: Colors.primaryLight,
  },
  zoneDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  checklistContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  checklistText: {
    fontSize: 11,
    color: Colors.textLight,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
});
