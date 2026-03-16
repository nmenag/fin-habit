import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Goal, useStore, useTranslation } from '../store/useStore';

export const GoalsScreen = ({ navigation }: any) => {
  const { goals, formatCurrency } = useStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: Goal }) => {
    const progress = Math.min(
      (item.currentAmount / item.targetAmount) * 100,
      100,
    );
    const isCompleted = item.status === 'completed';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AddGoal', { goal: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.color || '#ccc' },
            ]}
          >
            <Ionicons
              name={(item.icon as any) || 'trophy'}
              size={24}
              color="#fff"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.amountText}>
              {formatCurrency(item.currentAmount)} /{' '}
              {formatCurrency(item.targetAmount)}
            </Text>
          </View>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            </View>
          )}
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: item.color || '#2196f3',
              },
            ]}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
          {item.deadline && (
            <Text style={styles.deadlineText}>
              {new Date(item.deadline).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="flag-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t('noGoals')}</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={() => navigation.navigate('AddGoal')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  amountText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  completedBadge: {
    marginLeft: 8,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  deadlineText: {
    fontSize: 12,
    color: '#888',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
