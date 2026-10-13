import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Layers,
  Image as ImageIcon,
  ShieldAlert,
  ArrowLeft,
  Info,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors, getGradeColor, getSeverityColor } from '../../src/theme/colors';
import { KitchenZone, Assessment, ImageValidationResult } from '../../src/types';
import { ApiClient } from '../../src/services/api';

interface ZoneOption {
  key: KitchenZone;
  title: string;
  description: string;
  sampleUrl: string;
  checklist: string[];
}

const ZONES: ZoneOption[] = [
  {
    key: 'prep_surface',
    title: 'Food Preparation Surfaces',
    description: 'Stainless steel tables, cutting boards, food contact areas.',
    sampleUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800',
    checklist: ['Clean cutting boards', 'No cross-contamination', 'Sanitizer rags in bucket'],
  },
  {
    key: 'storage',
    title: 'Food Storage & Refrigeration',
    description: 'Walk-in chillers, reach-in fridges, dry storage shelving.',
    sampleUrl: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=800',
    checklist: ['Covered containers', 'Raw meats below cooked food', 'Clean shelving'],
  },
  {
    key: 'dishwashing',
    title: 'Dishwashing & Sanitization Area',
    description: '3-compartment sinks, commercial dishwashers, drying racks.',
    sampleUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
    checklist: ['No standing greywater', 'Clean drainage traps', 'Organized drying racks'],
  },
  {
    key: 'waste_disposal',
    title: 'Waste Disposal & Bins',
    description: 'Trash receptacles, recycling, compost bins.',
    sampleUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
    checklist: ['Lidded bins in place', 'No overflowing trash', 'Clean surrounding floor'],
  },
  {
    key: 'equipment',
    title: 'Cooking Equipment & Hoods',
    description: 'Ranges, fryers, ovens, exhaust hoods and grease filters.',
    sampleUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800',
    checklist: ['Degreased baffle filters', 'Clean burner trays', 'No heavy carbon buildup'],
  },
];

export default function InspectScreen() {
  const [selectedZone, setSelectedZone] = useState<KitchenZone>('prep_surface');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [assessmentResult, setAssessmentResult] = useState<Assessment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const activeZoneObj = ZONES.find((z) => z.key === selectedZone) || ZONES[0];

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to select kitchen photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setPreviewImageUri(result.assets[0].uri);
        runInspection({ imageBase64: result.assets[0].base64 });
      }
    } catch (e: any) {
      setErrorMessage(`Failed to pick image: ${e.message}`);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to capture kitchen photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setPreviewImageUri(result.assets[0].uri);
        runInspection({ imageBase64: result.assets[0].base64 });
      }
    } catch (e: any) {
      setErrorMessage(`Camera capture failed: ${e.message}`);
    }
  };

  const handleUseSamplePhoto = () => {
    setPreviewImageUri(activeZoneObj.sampleUrl);
    runInspection({ imageUrl: activeZoneObj.sampleUrl });
  };

  const runInspection = async (options: { imageBase64?: string; imageUrl?: string }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setAssessmentResult(null);

    try {
      setLoadingStep('1. Validating photograph quality and focus...');
      await new Promise((r) => setTimeout(r, 400));

      setLoadingStep('2. AI Vision scanning visible kitchen hygiene concerns...');
      const result = await ApiClient.analyzeKitchenPhoto({
        zone: selectedZone,
        imageBase64: options.imageBase64,
        imageUrl: options.imageUrl,
        restaurantId: 'b0000000-0000-0000-0000-000000000002',
      });

      setLoadingStep('3. Applying transparent scoring rules and deductions...');
      await new Promise((r) => setTimeout(r, 300));

      setAssessmentResult(result);
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred during inspection analysis.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const resetInspection = () => {
    setAssessmentResult(null);
    setErrorMessage(null);
    setPreviewImageUri(null);
  };

  // ---------------------------------------------------------------------------
  // RENDER: Loading State
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTitle}>Analyzing Kitchen Hygiene</Text>
        <Text style={styles.loadingSubtitle}>{loadingStep}</Text>
        <Text style={styles.loadingHint}>Zone: {activeZoneObj.title}</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Assessment Result Report
  // ---------------------------------------------------------------------------
  if (assessmentResult) {
    const gradeColor = getGradeColor(assessmentResult.grade);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Back / Retake Button */}
        <TouchableOpacity style={styles.backButton} onPress={resetInspection}>
          <ArrowLeft size={16} color={Colors.textLight} />
          <Text style={styles.backButtonText}>Inspect Another Kitchen Zone</Text>
        </TouchableOpacity>

        {/* Demo Data Notice */}
        {assessmentResult.is_demo && (
          <View style={styles.demoBanner}>
            <Info size={16} color="#F59E0B" />
            <Text style={styles.demoBannerText}>
              DEMO DATA — Deterministic inspection fixture (Model: {assessmentResult.model_version})
            </Text>
          </View>
        )}

        {/* Critical Warnings Alert Banner */}
        {assessmentResult.has_critical_warning && (
          <View style={styles.criticalBanner}>
            <ShieldAlert size={22} color="#EF4444" />
            <View style={styles.criticalTextContainer}>
              <Text style={styles.criticalTitle}>CRITICAL HYGIENE WARNING TRIGGERED</Text>
              {assessmentResult.critical_warnings?.map((warn, i) => (
                <Text key={i} style={styles.criticalSubtitle}>
                  • {warn}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Score & Grade Overview Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreHeaderLabel}>Zone Cleanliness Score</Text>
              <Text style={styles.scoreSubLabel}>{activeZoneObj.title}</Text>
            </View>
            <View style={[styles.gradeCircle, { borderColor: gradeColor }]}>
              <Text style={[styles.gradeCircleText, { color: gradeColor }]}>
                {assessmentResult.grade || '—'}
              </Text>
            </View>
          </View>

          <View style={styles.scoreNumberRow}>
            <Text style={styles.scoreLargeNumber}>
              {assessmentResult.overall_score !== null ? assessmentResult.overall_score.toFixed(1) : 'Inconclusive'}
            </Text>
            <Text style={styles.scoreMaxLabel}>/ 100 points</Text>
          </View>

          <View style={styles.scoreFooter}>
            <Text style={styles.scoreFooterText}>
              Assessment ID: {assessmentResult.id} • Rule: scoring-v1.0
            </Text>
          </View>
        </View>

        {/* Photo Evidence Preview */}
        {previewImageUri && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: previewImageUri }} style={styles.previewImage} />
            <View style={styles.photoOverlayBadge}>
              <Text style={styles.photoOverlayText}>Analyzed Photograph</Text>
            </View>
          </View>
        )}

        {/* Itemized Deductions Section */}
        <View style={styles.sectionHeader}>
          <Clock size={18} color={Colors.primaryLight} />
          <Text style={styles.sectionTitle}>
            Itemized Deductions ({assessmentResult.deductions?.length || 0})
          </Text>
        </View>

        {assessmentResult.deductions && assessmentResult.deductions.length > 0 ? (
          assessmentResult.deductions.map((deduction, idx) => (
            <View key={idx} style={styles.deductionCard}>
              <View style={styles.deductionHeader}>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(deduction.severity) },
                  ]}
                >
                  <Text style={styles.severityText}>
                    {deduction.severity.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.deductionPointsText}>
                  -{deduction.points_deducted.toFixed(1)} pts
                </Text>
              </View>

              <Text style={styles.deductionTitle}>{deduction.title}</Text>
              <Text style={styles.deductionCategory}>Category: {deduction.category}</Text>
              <Text style={styles.ruleAppliedText}>{deduction.rule_applied}</Text>
            </View>
          ))
        ) : (
          <View style={styles.noDeductionsBox}>
            <CheckCircle2 size={24} color={Colors.primary} />
            <Text style={styles.noDeductionsText}>
              No visible hygiene violations identified in this zone!
            </Text>
          </View>
        )}

        {/* Recommended Corrective Actions */}
        {assessmentResult.recommendations && assessmentResult.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <View style={styles.recommendationsHeader}>
              <ShieldCheck size={20} color={Colors.primary} />
              <Text style={styles.recommendationsTitle}>Actionable Cleaning Checklist</Text>
            </View>
            {assessmentResult.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recItem}>
                <CheckCircle2 size={16} color={Colors.primary} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Regulatory Boundaries & Limitations */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerHeading}>Official Regulatory Disclaimer</Text>
          <Text style={styles.disclaimerBody}>{assessmentResult.disclaimer}</Text>
          <Text style={styles.limitationsBody}>
            * Limitations: {assessmentResult.limitations}
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Zone Selection & Photo Capture Screen
  // ---------------------------------------------------------------------------
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
            Capture clear zone photographs to detect visible cleanliness issues with itemized rule deductions.
          </Text>
        </View>
      </View>

      {/* Error Message Alert */}
      {errorMessage && (
        <View style={styles.errorAlert}>
          <AlertTriangle size={20} color="#EF4444" />
          <View style={styles.errorTextContainer}>
            <Text style={styles.errorTitle}>Inspection Error</Text>
            <Text style={styles.errorBody}>{errorMessage}</Text>
          </View>
        </View>
      )}

      {/* Food Safety Notice */}
      <View style={styles.disclaimerCard}>
        <AlertTriangle size={18} color={Colors.warning} />
        <Text style={styles.disclaimerText}>
          CleanPlate AI evaluates <Text style={styles.bold}>visible cleanliness only</Text>. It does not certify bacterial absence, internal food temperatures, or replace official FSSAI audits.
        </Text>
      </View>

      {/* Zone Selector Header */}
      <View style={styles.sectionHeader}>
        <Layers size={18} color={Colors.primaryLight} />
        <Text style={styles.sectionTitle}>1. Select Kitchen Zone</Text>
      </View>

      {/* Zone Options */}
      {ZONES.map((zone) => {
        const isSelected = selectedZone === zone.key;
        return (
          <TouchableOpacity
            key={zone.key}
            onPress={() => setSelectedZone(zone.key)}
            style={[styles.zoneCard, isSelected && styles.zoneCardSelected]}
          >
            <View style={styles.zoneHeader}>
              <View style={styles.zoneTitleRow}>
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                />
                <Text style={[styles.zoneTitle, isSelected && styles.zoneTitleSelected]}>
                  {zone.title}
                </Text>
              </View>
            </View>

            <Text style={styles.zoneDescription}>{zone.description}</Text>

            <View style={styles.checklistContainer}>
              {zone.checklist.map((item, idx) => (
                <View key={idx} style={styles.checklistItem}>
                  <CheckCircle2
                    size={12}
                    color={isSelected ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={styles.checklistText}>{item}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Action CTA Buttons */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsLabel}>2. Submit Photograph for Assessment</Text>

        <TouchableOpacity style={styles.ctaPrimary} onPress={handleCapturePhoto}>
          <Camera size={20} color="#0F172A" />
          <Text style={styles.ctaPrimaryText}>Capture with Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaSecondary} onPress={handlePickFromGallery}>
          <ImageIcon size={20} color={Colors.textLight} />
          <Text style={styles.ctaSecondaryText}>Select from Device Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaSample} onPress={handleUseSamplePhoto}>
          <Sparkles size={18} color={Colors.primaryLight} />
          <Text style={styles.ctaSampleText}>
            Test with Verified Zone Sample Photo
          </Text>
        </TouchableOpacity>
      </View>
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
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: Colors.primaryLight,
    marginTop: 6,
    textAlign: 'center',
  },
  loadingHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
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
  actionsContainer: {
    gap: 10,
    marginTop: 10,
  },
  actionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  ctaPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  ctaPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  ctaSecondary: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  ctaSample: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 8,
  },
  ctaSampleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  errorBody: {
    fontSize: 12,
    color: '#FECACA',
    marginTop: 2,
    lineHeight: 16,
  },
  // Result styles
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backButtonText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  demoBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  demoBannerText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },
  criticalBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  criticalTextContainer: {
    flex: 1,
  },
  criticalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  criticalSubtitle: {
    fontSize: 12,
    color: '#FECACA',
    marginTop: 4,
    lineHeight: 16,
  },
  scoreCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreHeaderLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scoreSubLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gradeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  gradeCircleText: {
    fontSize: 26,
    fontWeight: '800',
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
    gap: 6,
  },
  scoreLargeNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scoreMaxLabel: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  scoreFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  scoreFooterText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  photoContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  photoOverlayText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  deductionCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 6,
  },
  deductionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  deductionPointsText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  deductionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  deductionCategory: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  ruleAppliedText: {
    fontSize: 11,
    color: Colors.primaryLight,
    fontStyle: 'italic',
  },
  noDeductionsBox: {
    backgroundColor: '#0B1120',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  noDeductionsText: {
    color: Colors.textLight,
    fontSize: 13,
  },
  recommendationsCard: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  recText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
  },
  disclaimerBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 6,
  },
  disclaimerHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
  },
  disclaimerBody: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  limitationsBody: {
    fontSize: 10,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
