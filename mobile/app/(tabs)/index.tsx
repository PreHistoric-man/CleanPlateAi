import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Search, MapPin, Award, ShieldAlert, Sparkles, Filter } from 'lucide-react-native';
import { Colors, getGradeColor } from '../../src/theme/colors';
import { Restaurant } from '../../src/types';
import { ApiClient } from '../../src/services/api';

export default function DiscoverScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    const data = await ApiClient.getRestaurants();
    setRestaurants(data);
    setLoading(false);
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade =
      selectedGrade === null
        ? true
        : selectedGrade === 'NOT_ASSESSED'
        ? !r.latest_grade
        : r.latest_grade === selectedGrade;

    return matchesSearch && matchesGrade;
  });

  const renderRestaurantCard = ({ item }: { item: Restaurant }) => {
    const gradeColor = getGradeColor(item.latest_grade);
    const formattedDate = item.latest_assessed_at
      ? new Date(item.latest_assessed_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                item.image_url ||
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
            }}
            style={styles.restaurantImage}
          />
          {item.is_sample && (
            <View style={styles.sampleBadge}>
              <Text style={styles.sampleBadgeText}>Sample Data</Text>
            </View>
          )}
          <View
            style={[
              styles.gradeBadge,
              { backgroundColor: gradeColor },
            ]}
          >
            <Text style={styles.gradeBadgeText}>
              {item.latest_grade ? `Grade ${item.latest_grade}` : 'Not Assessed'}
            </Text>
            {item.latest_score !== null && item.latest_score !== undefined && (
              <Text style={styles.scoreText}>{item.latest_score.toFixed(1)} / 100</Text>
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <Text style={styles.cuisineText}>{item.cuisine_type}</Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color={Colors.textMuted} />
            <Text style={styles.locationText}>
              {item.area}, {item.city}
            </Text>
          </View>

          <View style={styles.assessmentMetaRow}>
            <Sparkles size={14} color={Colors.primary} />
            <Text style={styles.assessmentMetaText}>
              {formattedDate ? `Assessed on ${formattedDate}` : 'No AI assessment on record'}
            </Text>
          </View>

          <View style={styles.disclaimerRow}>
            <Text style={styles.disclaimerMiniText}>
              * Visible cleanliness only. Not official regulatory inspection.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput
            placeholder="Search restaurants, areas, or cuisines..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { label: 'All', value: null },
            { label: 'Grade A', value: 'A' },
            { label: 'Grade B', value: 'B' },
            { label: 'Grade C', value: 'C' },
            { label: 'Not Assessed', value: 'NOT_ASSESSED' },
          ].map((chip) => {
            const isSelected = selectedGrade === chip.value;
            return (
              <TouchableOpacity
                key={chip.label}
                onPress={() => setSelectedGrade(chip.value)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading restaurant directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderRestaurantCard}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <ShieldAlert size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No restaurants found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#0B1120',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E293B',
  },
  sampleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  sampleBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gradeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  gradeBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  cardContent: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cuisineText: {
    fontSize: 13,
    color: Colors.primaryLight,
    marginTop: 2,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  assessmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
  },
  assessmentMetaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  disclaimerRow: {
    marginTop: 8,
  },
  disclaimerMiniText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
