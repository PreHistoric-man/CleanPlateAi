import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import {
  Building2,
  TrendingUp,
  ListTodo,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';

export default function DashboardScreen() {
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Degrease hood baffle filters with hot solvent',
      zone: 'Cooking Equipment',
      status: 'pending',
      severity: 'medium',
      pointsRecoverable: '+9.0 pts',
    },
    {
      id: '2',
      title: 'Scrub and neutralize burner drip trays',
      zone: 'Cooking Equipment',
      status: 'pending',
      severity: 'low',
      pointsRecoverable: '+5.0 pts',
    },
    {
      id: '3',
      title: 'Relocate wiping towels to quaternary sanitizer bucket',
      zone: 'Preparation Surfaces',
      status: 'resolved',
      severity: 'low',
      pointsRecoverable: '+5.5 pts',
    },
  ]);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'resolved' ? 'pending' : 'resolved' }
          : t
      )
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Restaurant Header */}
      <View style={styles.restaurantCard}>
        <View style={styles.restaurantRow}>
          <Building2 size={24} color={Colors.primary} />
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>Spice Route Kitchen</Text>
            <Text style={styles.restaurantAddress}>18 Connaught Place, New Delhi</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Current Grade</Text>
            <Text style={[styles.statValue, { color: Colors.gradeB }]}>B</Text>
            <Text style={styles.statSub}>86.0 / 100</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Cleanliness Trend</Text>
            <View style={styles.trendRow}>
              <TrendingUp size={16} color={Colors.primary} />
              <Text style={[styles.statValue, { color: Colors.primary }]}>+4.5</Text>
            </View>
            <Text style={styles.statSub}>vs last month</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Actions Open</Text>
            <Text style={[styles.statValue, { color: Colors.warning }]}>
              {tasks.filter((t) => t.status === 'pending').length}
            </Text>
            <Text style={styles.statSub}>2 completed</Text>
          </View>
        </View>
      </View>

      {/* Corrective Action Checklist */}
      <View style={styles.sectionHeader}>
        <ListTodo size={18} color={Colors.primaryLight} />
        <Text style={styles.sectionTitle}>Hygiene Improvement Action Items</Text>
      </View>

      <View style={styles.taskList}>
        {tasks.map((task) => {
          const isResolved = task.status === 'resolved';
          return (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItem, isResolved && styles.taskItemResolved]}
              onPress={() => toggleTask(task.id)}
            >
              <View style={styles.taskLeft}>
                {isResolved ? (
                  <CheckCircle2 size={22} color={Colors.primary} />
                ) : (
                  <Clock size={22} color={Colors.warning} />
                )}
                <View style={styles.taskTextContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      isResolved && styles.taskTitleResolved,
                    ]}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    <Text style={styles.taskZone}>{task.zone}</Text>
                    <Text style={styles.taskPoints}>{task.pointsRecoverable}</Text>
                  </View>
                </View>
              </View>
              <Switch
                value={isResolved}
                onValueChange={() => toggleTask(task.id)}
                trackColor={{ false: Colors.cardBorder, true: Colors.primaryDark }}
                thumbColor={isResolved ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Re-Inspection Trigger Card */}
      <View style={styles.reinspectCard}>
        <ShieldCheck size={28} color={Colors.primary} />
        <View style={styles.reinspectInfo}>
          <Text style={styles.reinspectTitle}>Ready to boost your score?</Text>
          <Text style={styles.reinspectSubtitle}>
            Submit follow-up photos after completing items to verify resolution and improve your public CleanPlate rating.
          </Text>
        </View>
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
  restaurantCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  restaurantAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
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
  taskList: {
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  taskItemResolved: {
    opacity: 0.7,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 10,
  },
  taskTextContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  taskTitleResolved: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  taskZone: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  taskPoints: {
    fontSize: 11,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  reinspectCard: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 10,
  },
  reinspectInfo: {
    flex: 1,
  },
  reinspectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reinspectSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
});
