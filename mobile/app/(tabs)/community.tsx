import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  MessageSquare,
  Star,
  CornerDownRight,
  Flag,
  ThumbsUp,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';

export default function CommunityScreen() {
  const [posts, setPosts] = useState([
    {
      id: '1',
      author: 'Ananya Deshmukh',
      restaurantName: 'Green Leaf Bistro',
      rating: 5,
      content:
        'Loved dining here! You can see directly into the prep area from the counter. Everything looks spotless and chefs wear clean gear.',
      date: '2 days ago',
      likes: 12,
      ownerReply: {
        author: 'Sarah Jenkins (Owner)',
        content:
          'Thank you Ananya! Maintaining visible kitchen transparency is our top priority every morning.',
        date: '1 day ago',
      },
    },
    {
      id: '2',
      author: 'Ananya Deshmukh',
      restaurantName: 'Spice Route Kitchen',
      rating: 4,
      content:
        'Great food, glad to see proactive hygiene tracking on CleanPlate! Hoping they keep up with hood filter cleanups.',
      date: '5 days ago',
      likes: 8,
      ownerReply: {
        author: 'Rajesh Sharma (Owner)',
        content:
          'Thank you for the review! Our cleaning team is currently addressing the exhaust filters in our weekly deep-clean cycle today.',
        date: '4 days ago',
      },
    },
  ]);

  const handleReport = (postId: string) => {
    Alert.alert(
      'Report Post',
      'Select a moderation reason:\n\n1. Inappropriate / Abusive\n2. Fraudulent Review\n3. Misleading hygiene claims\n4. Other',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Report',
          onPress: () =>
            Alert.alert(
              'Report Submitted',
              'Thank you. Our moderation team has queued this item for safety review.'
            ),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Community Transparency Notice */}
      <View style={styles.noticeBox}>
        <ShieldCheck size={20} color={Colors.primary} />
        <Text style={styles.noticeText}>
          <Text style={styles.bold}>Community Feedback vs AI Assessment:</Text> Customer reviews reflect personal diner experiences, kept strictly distinct from CleanPlate AI visual scores.
        </Text>
      </View>

      {/* Post List */}
      {posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <View>
              <Text style={styles.authorName}>{post.author}</Text>
              <Text style={styles.restaurantTag}>reviewed {post.restaurantName}</Text>
            </View>
            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  color={i < post.rating ? '#F59E0B' : Colors.cardBorder}
                  fill={i < post.rating ? '#F59E0B' : 'transparent'}
                />
              ))}
            </View>
          </View>

          <Text style={styles.postContent}>{post.content}</Text>

          <View style={styles.postActions}>
            <Text style={styles.dateText}>{post.date}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.likeBtn}>
                <ThumbsUp size={14} color={Colors.textMuted} />
                <Text style={styles.likeCount}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.flagBtn}
                onPress={() => handleReport(post.id)}
              >
                <Flag size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Owner Reply Thread */}
          {post.ownerReply && (
            <View style={styles.replyCard}>
              <View style={styles.replyHeader}>
                <CornerDownRight size={14} color={Colors.primary} />
                <Text style={styles.replyAuthor}>{post.ownerReply.author}</Text>
                <CheckCircle size={12} color={Colors.primary} />
              </View>
              <Text style={styles.replyContent}>{post.ownerReply.content}</Text>
              <Text style={styles.replyDate}>{post.ownerReply.date}</Text>
            </View>
          )}
        </View>
      ))}
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
  noticeBox: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textLight,
  },
  postCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  restaurantTag: {
    fontSize: 12,
    color: Colors.primaryLight,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 3,
  },
  postContent: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  flagBtn: {
    padding: 4,
  },
  replyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: 6,
    marginTop: 4,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  replyContent: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
  },
  replyDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
