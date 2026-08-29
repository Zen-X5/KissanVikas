import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { SpatialObject } from '../../lib/services/polyhouse';

interface InspectorProps {
  selectedObject: SpatialObject | null;
  onClose: () => void;
}

export const ObjectInspector: React.FC<InspectorProps> = ({
  selectedObject,
  onClose,
}) => {
  if (!selectedObject) return null;

  const confidencePct = Math.round(selectedObject.confidence * 100);

  // Dynamic badge coloring based on confidence level
  const getBadgeStyle = (pct: number) => {
    if (pct >= 85) return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
    if (pct >= 60) return { bg: '#FEF9C3', text: '#A16207', border: '#FDE047' };
    return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
  };

  const badgeTheme = getBadgeStyle(confidencePct);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Top Header Row */}
        <View style={styles.header}>
          <View style={styles.titleArea}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {selectedObject.type.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {selectedObject.id}
            </Text>
            <Text style={styles.subtitle}>
              Class: <Text style={styles.subtitleBold}>{selectedObject.class_name}</Text>
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            hitSlop={12}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Metrics Grid */}
        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <Text style={styles.label}>POSITION (X, Y)</Text>
            <Text style={styles.val}>
              {selectedObject.position.x_m.toFixed(2)}m, {selectedObject.position.y_m.toFixed(2)}m
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.label}>DIMENSIONS (W × D)</Text>
            <Text style={styles.val}>
              {selectedObject.dimensions.width_m.toFixed(2)}m × {selectedObject.dimensions.depth_m.toFixed(2)}m
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.label}>CONFIDENCE</Text>
            <View style={[styles.badge, { backgroundColor: badgeTheme.bg, borderColor: badgeTheme.border }]}>
              <Text style={[styles.badgeText, { color: badgeTheme.text }]}>
                {confidencePct}%
              </Text>
            </View>
          </View>

          {selectedObject.source_frames.length > 0 && (
            <View style={[styles.metricCard, styles.fullWidthMetric]}>
              <Text style={styles.label}>SOURCE FRAMES</Text>
              <Text style={styles.valSecondary} numberOfLines={1}>
                {selectedObject.source_frames.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)', // Dark semi-transparent floating card
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  titleArea: {
    flex: 1,
    paddingRight: 12,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  subtitleBold: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeBtnPressed: {
    backgroundColor: '#334155',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 14,
    opacity: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fullWidthMetric: {
    minWidth: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  val: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  valSecondary: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});