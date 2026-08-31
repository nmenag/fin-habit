import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {
  Card,
  FAB,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import {
  Category,
  TransactionType,
  useStore,
  useTranslation,
} from '../../../store/useStore';
import { getValidCategoryIcon } from '../../../constants';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

export const CategoriesScreen = () => {
  const { categories, updateCategoriesOrder } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const insets = useSafeAreaInsets();

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.type === activeTab);
  }, [categories, activeTab]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Category>) => {
    const itemColor = item.color || theme.colors.primary;

    const cardBg = isActive ? theme.colors.elevation.level3 : `${itemColor}12`;
    const cardBorder = isActive ? theme.colors.primary : `${itemColor}2B`;

    return (
      <ScaleDecorator>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
          onPress={() =>
            router.push({
              pathname: '/add-category',
              params: { category: JSON.stringify(item) },
            })
          }
          onLongPress={drag}
          disabled={isActive}
          mode="contained"
        >
          <View style={styles.cardInner}>
            <View style={styles.dragHandle} pointerEvents="none">
              <Ionicons
                name="reorder-two-outline"
                size={18}
                color={theme.colors.outline}
                style={{ opacity: 0.35 }}
              />
            </View>

            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${itemColor}12`,
                  borderColor: `${itemColor}2B`,
                  borderWidth: 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getValidCategoryIcon(item.icon) as any}
                size={20}
                color={itemColor}
              />
            </View>

            <View style={styles.metaCol}>
              <Text
                style={[styles.categoryName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {translateName(item.name)}
              </Text>
            </View>
          </View>
        </Card>
      </ScaleDecorator>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[styles.headerSection, { paddingTop: Math.max(12, insets.top) }]}
      >
        <SegmentedButtons
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TransactionType)}
          buttons={[
            {
              value: 'expense',
              label: t('expenses'),
              icon: 'minus-circle-outline',
            },
            {
              value: 'income',
              label: t('income'),
              icon: 'plus-circle-outline',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <DraggableFlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          const otherCategories = categories.filter(
            (c) => c.type !== activeTab,
          );
          updateCategoriesOrder([...data, ...otherCategories]);
        }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 200 },
        ]}
        ListHeaderComponent={
          filteredCategories.length > 1 ? (
            <View style={styles.dragHelpRow}>
              <Ionicons
                name="information-circle-outline"
                size={13}
                color={theme.colors.outline}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[styles.dragHelpText, { color: theme.colors.outline }]}
              >
                {t('holdAndDragToReorder')}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Ionicons
                name={activeTab === 'expense' ? 'cart-outline' : 'cash-outline'}
                size={32}
                color={theme.colors.outline}
              />
            </View>
            <Text
              style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
            >
              {t('noCategoriesDefined')}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.colors.outline }]}
            >
              {t('noCategoriesSubtitleText')}
            </Text>
          </Animated.View>
        }
      />

      <BannerAdComponent />

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: (insets.bottom || 0) + 120,
            backgroundColor: theme.colors.primary,
          },
        ]}
        color="#fff"
        onPress={() => router.push('/add-category')}
      />
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerSection: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    segmentedButtons: {
      borderRadius: 14,
    },
    listContent: {
      paddingTop: 8,
    },
    card: {
      marginBottom: 8,
      marginHorizontal: 16,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    dragHandle: {
      width: 24,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    metaCol: {
      flex: 1,
      justifyContent: 'center',
    },
    categoryName: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(14),
      letterSpacing: -0.1,
    },
    dragHelpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      marginBottom: 8,
      opacity: 0.8,
    },
    dragHelpText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 60,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      marginBottom: 6,
    },
    emptySubtitle: {
      textAlign: 'center',
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      paddingHorizontal: 20,
      lineHeight: 18,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 18,
      elevation: 6,
    },
  });
