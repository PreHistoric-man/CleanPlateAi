import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import {
  User,
  Shield,
  Building,
  CheckCircle,
  FileText,
  HelpCircle,
  LogOut,
  ExternalLink,
} from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { UserRole } from '../../src/types';

export default function ProfileScreen() {
  const [activeRole, setActiveRole] = useState<UserRole>('restaurant_owner');

  const roles: { role: UserRole; title: string; subtitle: string; icon: any }[] = [
    {
      role: 'customer',
      title: 'Customer Diner',
      subtitle: 'Browse restaurants, verify hygiene scores, write community reviews',
      icon: User,
    },
    {
      role: 'restaurant_owner',
      title: 'Restaurant Owner / Kitchen Manager',
      subtitle: 'Submit kitchen photos, review deductions, resolve cleaning tasks',
      icon: Building,
    },
    {
      role: 'moderator',
      title: 'Safety & Moderation Officer',
      subtitle: 'Review reported content, manage profile claims and dispute audits',
      icon: Shield,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <User size={32} color={Colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>Rajesh Sharma</Text>
          <Text style={styles.userEmail}>owner.rajesh@cleanplate.demo</Text>
          <View style={styles.currentRoleBadge}>
            <Text style={styles.currentRoleText}>
              Active Mode: {activeRole.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Role Switcher for Testing/Demoing All Application Roles */}
      <View style={styles.sectionHeader}>
        <Shield size={18} color={Colors.primaryLight} />
        <Text style={styles.sectionTitle}>Simulate Account Role</Text>
      </View>

      <View style={styles.roleList}>
        {roles.map((item) => {
          const isSelected = activeRole === item.role;
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.role}
              style={[styles.roleItem, isSelected && styles.roleItemSelected]}
              onPress={() => setActiveRole(item.role)}
            >
              <View
                style={[
                  styles.roleIconBox,
                  isSelected && styles.roleIconBoxSelected,
                ]}
              >
                <IconComp
                  size={20}
                  color={isSelected ? Colors.primary : Colors.textMuted}
                />
              </View>
              <View style={styles.roleTextContainer}>
                <View style={styles.roleTitleRow}>
                  <Text
                    style={[
                      styles.roleTitle,
                      isSelected && styles.roleTitleSelected,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {isSelected && <CheckCircle size={16} color={Colors.primary} />}
                </View>
                <Text style={styles.roleSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* System Information & Disclaimers */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Regulatory Disclaimer</Text>
        <Text style={styles.infoCardContent}>
          CleanPlate AI is an independent food-safety transparency tool designed to encourage best-in-class visible sanitation. It does not replace statutory health department inspections (such as FSSAI in India or FDA/health boards globally) or microbiological laboratory tests.
        </Text>
      </View>

      <View style={styles.menuList}>
        <TouchableOpacity style={styles.menuItem}>
          <FileText size={18} color={Colors.textSecondary} />
          <Text style={styles.menuItemText}>Cleanliness Scoring Methodology</Text>
          <ExternalLink size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <HelpCircle size={18} color={Colors.textSecondary} />
          <Text style={styles.menuItemText}>Community Guidelines & Appeals</Text>
          <ExternalLink size={16} color={Colors.textMuted} />
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
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  currentRoleBadge: {
    marginTop: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  currentRoleText: {
    fontSize: 11,
    color: Colors.primaryLight,
    fontWeight: '600',
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
  roleList: {
    gap: 10,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  roleItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#1E293B',
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  roleTitleSelected: {
    color: Colors.primaryLight,
  },
  roleSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 6,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: 6,
  },
  infoCardContent: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  menuList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  menuItemText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
  },
});
