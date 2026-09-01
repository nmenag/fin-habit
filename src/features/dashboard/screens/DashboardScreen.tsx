import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { router } from 'expo-router';
import {
  getLast30DaysRange,
  getRangeForType,
  isInRange,
} from '../../../utils/dateFilters';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Card,
  Divider,
  FAB,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getValidCategoryIcon } from '../../../constants';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme, spacing } from '../../../theme/theme';
import { fontScale, moderateScale } from '../../../utils/responsive';

const addAlpha = (
  color: string | undefined,
  opacity: number,
  fallbackHex: string,
) => {
  let resolvedColor = color || fallbackHex;

  if (typeof resolvedColor !== 'string') {
    resolvedColor = fallbackHex;
  }

  if (resolvedColor.startsWith('rgb')) {
    const match = resolvedColor.match(/\d+/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${opacity})`;
    }
  }

  if (!resolvedColor.startsWith('#')) {
    resolvedColor = fallbackHex;
  }

  const hex = resolvedColor.replace('#', '');
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${hex}${alpha}`;
};

export const DashboardScreen = React.memo(() => {
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const accounts = useStore((s) => s.accounts);
  const isLoaded = useStore((s) => s.isLoaded);
  const formatCurrency = useStore((s) => s.formatCurrency);
  const dashboardReport = useStore((s) => s.dashboardReport);
  const refreshAnalytics = useStore((s) => s.refreshAnalytics);
  const language = useStore((s) => s.language);
  const cycleStartDay = useStore((s) => s.cycleStartDay);

  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  React.useEffect(() => {
    if (!dashboardReport) {
      refreshAnalytics();
    }
  }, [dashboardReport, refreshAnalytics]);

  const financialData = useMemo(() => {
    if (!dashboardReport) return null;

    const { currentMonth, currentCalendarMonth } = dashboardReport;

    const hasCurrentMonthData =
      currentCalendarMonth &&
      (currentCalendarMonth.expenses > 0 || currentCalendarMonth.income > 0);

    const activeMetrics = hasCurrentMonthData
      ? currentCalendarMonth
      : currentMonth;

    const monthlyIncome = activeMetrics.income;
    const monthlyExpenses = activeMetrics.expenses;
    const monthlyAdjustments = activeMetrics.adjustments;
    const remainingBalance = activeMetrics.savings;

    const calendarExpenses = monthlyExpenses;
    const calendarIncome = monthlyIncome;

    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const recentTransactions = transactions.slice(0, 5);

    const activeRange = hasCurrentMonthData
      ? getRangeForType('month', undefined, undefined, cycleStartDay)
      : getLast30DaysRange();

    const activeExpenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const isAdjustment =
        t.note &&
        (t.note === 'Balance Adjustment' || t.note === 'Ajuste de Saldo');
      if (isAdjustment) return false;
      return isInRange(t.date, activeRange);
    });

    const budgetedCategoryIds = new Set(
      budgets
        .map((b) => b.categoryId)
        .filter((catId): catId is string => !!catId),
    );

    let budgetedExpensesSum = 0;
    let unbudgetedExpensesSum = 0;

    activeExpenses.forEach((t) => {
      if (t.categoryId && budgetedCategoryIds.has(t.categoryId)) {
        budgetedExpensesSum += t.amount;
      } else {
        unbudgetedExpensesSum += t.amount;
      }
    });

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const limit = totalBudget > 0 ? totalBudget : calendarIncome;
    const ratio = totalBudget > 0 ? budgetedExpensesSum / totalBudget : 0;
    const progress = Math.min(ratio, 1);

    const topCatId = activeMetrics.topCategory?.id;
    const topCategory = topCatId
      ? categories.find((c) => c.id === topCatId)
      : undefined;
    const topCatAmount = activeMetrics.topCategory?.amount || 0;
    const topCatPercent =
      monthlyExpenses > 0 ? (topCatAmount / monthlyExpenses) * 100 : 0;

    return {
      monthlyIncome,
      monthlyExpenses,
      calendarExpenses,
      monthlyAdjustments,
      remainingBalance,
      topCategory,
      topCatAmount,
      topCatPercent,
      recentTransactions,
      totalBudget,
      limit,
      progress,
      totalBalance,
      ratio,
      hasCurrentMonthData,
      insightMessage: dashboardReport.insights[0]?.message,
      budgetedExpensesSum,
      unbudgetedExpensesSum,
    };
  }, [
    dashboardReport,
    accounts,
    transactions,
    budgets,
    categories,
    cycleStartDay,
  ]);

  const data = useMemo(() => {
    if (!financialData) return null;

    const { ratio, insightMessage, totalBudget } = financialData;

    let progressColor = theme.colors.primary;
    if (ratio > 0.9) progressColor = theme.colors.error;
    else if (ratio >= 0.7) progressColor = theme.colors.warning;

    let progressMessage = '';
    if (totalBudget > 0) {
      progressMessage = t('doingWell');
      if (ratio > 1.0) progressMessage = t('exceededLimit');
      else if (ratio > 0.9) progressMessage = t('aboutToExceed');
      else if (ratio >= 0.7) progressMessage = t('closeToLimit');
    }

    return {
      ...financialData,
      progressColor,
      progressMessage,
      insight: insightMessage || t('insightKeepGoing'),
    };
  }, [financialData, theme, t]);

  if (!isLoaded || !data) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const monthHeader = (
    <View style={styles.monthHeader}>
      <Text style={styles.monthText}>
        {data.hasCurrentMonthData
          ? (() => {
              const locale = language === 'es' ? esLocale : enUS;
              if (cycleStartDay > 1) {
                const range = getRangeForType(
                  'month',
                  undefined,
                  undefined,
                  cycleStartDay,
                );
                const startStr = format(range.startDate, 'd MMM', { locale });
                const endStr = format(range.endDate, 'd MMM yyyy', { locale });
                return `${startStr} - ${endStr}`;
              } else {
                const name = format(new Date(), 'MMMM yyyy', { locale });
                return name.charAt(0).toUpperCase() + name.slice(1);
              }
            })()
          : t('filterLast30Days' as any)}
      </Text>
    </View>
  );

  const flowRow = (
    <View style={styles.flowRow}>
      <Card
        style={[
          styles.flowCard,
          {
            marginRight: spacing.xs,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
            backgroundColor: theme.colors.surface,
          },
        ]}
        mode="contained"
      >
        <Card.Content style={styles.flowCardContent}>
          <View style={styles.flowHeader}>
            <Avatar.Icon
              size={28}
              icon="arrow-up-bold"
              style={{
                backgroundColor: addAlpha(theme.colors.income, 0.08, '#16A34A'),
              }}
              color={theme.colors.income}
            />
            <Text
              style={[
                styles.flowLabel,
                {
                  color: theme.colors.onSurfaceVariant,
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: 10,
                  letterSpacing: 1.2,
                },
              ]}
              numberOfLines={1}
            >
              {t('monthlyIncome').toUpperCase()}
            </Text>
          </View>
          <Text
            style={[
              styles.flowAmount,
              {
                color: theme.colors.income,
                fontFamily: 'Inter-SemiBold',
                fontWeight: '600',
                fontSize: fontScale(18),
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(data.monthlyIncome)}
          </Text>
        </Card.Content>
      </Card>

      <Card
        style={[
          styles.flowCard,
          {
            marginLeft: spacing.xs,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
            backgroundColor: theme.colors.surface,
          },
        ]}
        mode="contained"
      >
        <Card.Content style={styles.flowCardContent}>
          <View style={styles.flowHeader}>
            <Avatar.Icon
              size={28}
              icon="arrow-down-bold"
              style={{
                backgroundColor: addAlpha(theme.colors.error, 0.08, '#EF4444'),
              }}
              color={theme.colors.error}
            />
            <Text
              style={[
                styles.flowLabel,
                {
                  color: theme.colors.onSurfaceVariant,
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: 10,
                  letterSpacing: 1.2,
                },
              ]}
              numberOfLines={1}
            >
              {t('monthlyExpenses').toUpperCase()}
            </Text>
          </View>
          <Text
            style={[
              styles.flowAmount,
              {
                color: theme.colors.error,
                fontFamily: 'Inter-SemiBold',
                fontWeight: '600',
                fontSize: fontScale(18),
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(data.monthlyExpenses)}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );

  const accountsCard = (
    <Card style={styles.card} mode="contained">
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              fontWeight: '500',
              fontSize: fontScale(15),
              color: theme.colors.onSurface,
              flex: 1,
            }}
          >
            {t('accounts')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/accounts')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={t('viewAll')}
            accessibilityRole="button"
          >
            <Text
              style={{
                color: theme.colors.primary,
                marginLeft: 8,
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
                fontSize: fontScale(14),
              }}
            >
              {t('viewAll')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              color: theme.colors.onSurfaceVariant,
              fontFamily: 'Inter-Medium',
              fontWeight: '500',
              fontSize: 10,
              letterSpacing: 1.2,
            }}
          >
            {t('totalBalance').toUpperCase()}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter-SemiBold',
              fontWeight: '600',
              fontSize: fontScale(22),
              color: theme.colors.onSurface,
              marginTop: 2,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(data.totalBalance)}
          </Text>
        </View>
        <Divider style={{ marginVertical: 8 }} />
        {accounts.slice(0, 3).map((acc, index) => (
          <View key={acc.id}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/account-detail',
                  params: { accountId: acc.id },
                })
              }
              style={[styles.row, { paddingVertical: 10 }]}
              accessibilityLabel={`${translateName(acc.name)}, ${formatCurrency(acc.currentBalance, acc.currency)}`}
              accessibilityRole="button"
            >
              <Avatar.Icon
                size={32}
                icon={
                  acc.type === 'bank'
                    ? 'bank'
                    : acc.type === 'credit'
                      ? 'credit-card'
                      : 'cash'
                }
                style={{
                  backgroundColor: addAlpha(
                    acc.color || theme.colors.primary,
                    0.08,
                    '#22C55E',
                  ),
                  borderColor: addAlpha(
                    acc.color || theme.colors.primary,
                    0.17,
                    '#22C55E',
                  ),
                  borderWidth: 1,
                }}
                color={acc.color || theme.colors.primary}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                    fontSize: fontScale(14),
                    color: theme.colors.onSurface,
                  }}
                  numberOfLines={1}
                >
                  {translateName(acc.name)}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: fontScale(14),
                  color: theme.colors.onSurface,
                  flexShrink: 1,
                  textAlign: 'right',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(acc.currentBalance, acc.currency)}
              </Text>
            </TouchableOpacity>
            {index < Math.min(accounts.length, 3) - 1 && <Divider />}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const progressCard = (
    <Card style={styles.card} mode="contained">
      <Card.Content>
        {data.totalBudget > 0 ? (
          <>
            <View style={styles.cardHeader}>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: fontScale(15),
                  color: theme.colors.onSurface,
                  flex: 1,
                }}
              >
                {t('spendingProgress')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-SemiBold',
                  fontWeight: '600',
                  fontSize: fontScale(15),
                  color: theme.colors.onSurface,
                  flexShrink: 1,
                  textAlign: 'right',
                  marginLeft: 8,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {`${formatCurrency(data.budgetedExpensesSum)} / ${formatCurrency(data.totalBudget)}`}
              </Text>
            </View>
            <ProgressBar
              progress={data.progress}
              color={data.progressColor}
              style={styles.progressBar}
              accessibilityLabel={t('spendingProgress')}
              accessibilityValue={{
                now: Math.round(data.progress * 100),
                min: 0,
                max: 100,
                text: `${Math.round(data.progress * 100)}%`,
              }}
            />
            <View
              style={[
                styles.row,
                { justifyContent: 'space-between', marginTop: 6 },
              ]}
            >
              {data.progressMessage ? (
                <Text
                  variant="labelSmall"
                  style={{ color: data.progressColor, fontWeight: 'bold' }}
                >
                  {data.progressMessage}
                </Text>
              ) : null}
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.outline,
                  flex: 1,
                  textAlign: 'right',
                  marginLeft: 8,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {`${Math.round(data.progress * 100)}%`}
              </Text>
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Ionicons
              name="pie-chart-outline"
              size={36}
              color={theme.colors.onSurfaceVariant}
              style={{ marginBottom: 8, opacity: 0.7 }}
            />
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
                fontSize: fontScale(15),
                color: theme.colors.onSurface,
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              {t('spendingProgress')}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: fontScale(13),
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginBottom: 16,
                paddingHorizontal: 16,
                lineHeight: 18,
              }}
            >
              {t('noBudgets')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/budgets')}
              style={{
                backgroundColor: addAlpha(
                  theme.colors.primary,
                  0.08,
                  '#22C55E',
                ),
                borderColor: addAlpha(theme.colors.primary, 0.17, '#22C55E'),
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 8,
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  color: theme.colors.primary,
                  fontFamily: 'Inter-SemiBold',
                  fontWeight: '600',
                  fontSize: fontScale(13),
                }}
              >
                {t('manageBudgets')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {data.totalBudget > 0 && data.unbudgetedExpensesSum > 0 && (
          <>
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.row}>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: fontScale(14),
                  color: theme.colors.onSurfaceVariant,
                  flex: 1,
                }}
              >
                {t('unbudgetedSpending')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-SemiBold',
                  fontWeight: '600',
                  fontSize: fontScale(14),
                  color: theme.colors.onSurfaceVariant,
                  flexShrink: 1,
                  textAlign: 'right',
                  marginLeft: 8,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(data.unbudgetedExpensesSum)}
              </Text>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );

  const topCategoryCard = data.topCategory ? (
    <Card style={styles.card} mode="contained">
      <Card.Content>
        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontWeight: '500',
            fontSize: fontScale(15),
            color: theme.colors.onSurface,
            marginBottom: spacing.md,
          }}
        >
          {t('topSpendingCategory')}
        </Text>
        {data.topCategory ? (
          <View style={styles.row}>
            <Avatar.Icon
              size={40}
              icon={getValidCategoryIcon(data.topCategory.icon)}
              style={{
                backgroundColor: addAlpha(
                  data.topCategory.color || theme.colors.primary,
                  0.08,
                  '#22C55E',
                ),
                borderColor: addAlpha(
                  data.topCategory.color || theme.colors.primary,
                  0.17,
                  '#22C55E',
                ),
                borderWidth: 1,
              }}
              color={data.topCategory.color || theme.colors.primary}
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: fontScale(14),
                  color: theme.colors.onSurface,
                }}
              >
                {translateName(data.topCategory.name)}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Regular',
                  fontWeight: '400',
                  fontSize: fontScale(12),
                  color: theme.colors.onSurfaceVariant,
                  marginTop: 2,
                }}
              >
                {data.topCatPercent.toFixed(1)}% {t('ofTotalExpenses')}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
                fontSize: fontScale(14),
                color: theme.colors.onSurface,
                flexShrink: 1,
                textAlign: 'right',
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(data.topCatAmount)}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontStyle: 'italic',
              color: theme.colors.onSurfaceVariant,
              fontSize: fontScale(13),
            }}
          >
            {t('noDataForPeriod')}
          </Text>
        )}
      </Card.Content>
    </Card>
  ) : null;

  const insightCard = (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: addAlpha(theme.colors.primary, 0.08, '#22C55E'),
          borderColor: addAlpha(theme.colors.primary, 0.17, '#22C55E'),
          borderWidth: 1,
        },
      ]}
      mode="contained"
    >
      <Card.Content style={styles.insightContent}>
        <Ionicons name="bulb-outline" size={22} color={theme.colors.primary} />
        <Text
          style={[
            styles.insightText,
            {
              color: theme.colors.onSurface,
              fontFamily: 'Inter-Regular',
              fontWeight: '400',
              fontSize: fontScale(13),
              lineHeight: fontScale(18),
            },
          ]}
        >
          {data.insight}
        </Text>
      </Card.Content>
    </Card>
  );

  const recentTransactionsCard = (
    <Card style={styles.card} mode="contained">
      <Card.Content>
        <View style={[styles.cardHeader, { marginBottom: 12 }]}>
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              fontWeight: '500',
              fontSize: fontScale(15),
              color: theme.colors.onSurface,
              flex: 1,
            }}
          >
            {t('recentTransactions')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/transactions')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={t('seeAll')}
            accessibilityRole="button"
          >
            <Text
              style={{
                color: theme.colors.primary,
                marginLeft: 8,
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
                fontSize: fontScale(14),
              }}
            >
              {t('seeAll')}
            </Text>
          </TouchableOpacity>
        </View>
        {data.recentTransactions.length > 0 ? (
          data.recentTransactions.map((tr, index) => {
            const cat = categories.find((c) => c.id === tr.categoryId);
            const isAdjustment =
              tr.note && translateName(tr.note) === t('balanceAdjustment');
            const accentColor =
              tr.type === 'transfer'
                ? theme.dark
                  ? '#60A5FA'
                  : '#3B82F6'
                : isAdjustment
                  ? theme.colors.onSurfaceVariant
                  : cat?.color ||
                    (tr.type === 'income'
                      ? theme.colors.income
                      : theme.colors.error);
            return (
              <View key={tr.id}>
                <TouchableOpacity
                  onPress={() => router.push('/transactions')}
                  style={[styles.row, { paddingVertical: 12 }]}
                  accessibilityLabel={`${tr.note || translateName(cat?.name || 'Other')}, ${tr.type === 'income' ? '+' : '-'}${formatCurrency(tr.amount)}, ${format(parseISO(tr.date), 'MMM dd', { locale: language === 'es' ? esLocale : enUS })}`}
                  accessibilityRole="button"
                >
                  <Avatar.Icon
                    size={36}
                    icon={
                      tr.type === 'transfer'
                        ? 'swap-horizontal'
                        : isAdjustment
                          ? 'scale-balance'
                          : getValidCategoryIcon(cat?.icon) ||
                            (tr.type === 'income' ? 'plus' : 'minus')
                    }
                    style={{
                      backgroundColor: addAlpha(
                        accentColor,
                        0.08,
                        tr.type === 'transfer'
                          ? '#3B82F6'
                          : isAdjustment
                            ? '#64748B'
                            : '#22C55E',
                      ),
                      borderColor: addAlpha(
                        accentColor,
                        0.17,
                        tr.type === 'transfer'
                          ? '#3B82F6'
                          : isAdjustment
                            ? '#64748B'
                            : '#22C55E',
                      ),
                      borderWidth: 1,
                    }}
                    color={accentColor}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: 'Inter-Medium',
                        fontWeight: '500',
                        fontSize: fontScale(14),
                        color: theme.colors.onSurface,
                      }}
                      numberOfLines={1}
                    >
                      {tr.note &&
                      translateName(tr.note) === t('balanceAdjustment')
                        ? t('balanceAdjustment')
                        : tr.note ||
                          (tr.type === 'transfer'
                            ? t('transfer')
                            : translateName(cat?.name || 'Other'))}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Inter-Regular',
                        fontWeight: '400',
                        fontSize: fontScale(12),
                        color: theme.colors.onSurfaceVariant,
                        marginTop: 2,
                      }}
                    >
                      {format(parseISO(tr.date), 'MMM dd, yyyy', {
                        locale: language === 'es' ? esLocale : enUS,
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.amountText,
                      {
                        color:
                          tr.type === 'transfer'
                            ? theme.colors.onSurface
                            : tr.type === 'income'
                              ? theme.colors.income
                              : theme.colors.error,
                        fontFamily: 'Inter-Medium',
                        fontWeight: '500',
                        fontSize: fontScale(14),
                        flexShrink: 1,
                        textAlign: 'right',
                        marginLeft: 8,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {tr.type === 'transfer'
                      ? ''
                      : tr.type === 'income'
                        ? '+'
                        : '-'}
                    {formatCurrency(tr.amount)}
                  </Text>
                </TouchableOpacity>
                {index < data.recentTransactions.length - 1 && <Divider />}
              </View>
            );
          })
        ) : (
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontStyle: 'italic',
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
              paddingVertical: 20,
              fontSize: fontScale(13),
            }}
          >
            {t('noTransactions')}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderDashboardContent = () => {
    if (width >= 900) {
      return (
        <View style={styles.gridContainer}>
          <View style={styles.gridColumn}>
            {flowRow}
            {accountsCard}
          </View>
          <View style={styles.gridColumn}>
            {progressCard}
            {topCategoryCard}
            {insightCard}
          </View>
          <View style={styles.gridColumn}>{recentTransactionsCard}</View>
        </View>
      );
    } else if (width >= 600) {
      return (
        <View style={styles.gridContainer}>
          <View style={styles.gridColumn}>
            {flowRow}
            {accountsCard}
            {recentTransactionsCard}
          </View>
          <View style={styles.gridColumn}>
            {progressCard}
            {topCategoryCard}
            {insightCard}
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.singleColumnContainer}>
          {flowRow}
          {accountsCard}
          {progressCard}
          {topCategoryCard}
          {insightCard}
          {recentTransactionsCard}
        </View>
      );
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {monthHeader}
        {renderDashboardContent()}
        <View style={{ height: 20 }} />
      </ScrollView>

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: Math.max((insets.bottom || 0) + 24, 96),
            backgroundColor: theme.colors.primary,
          },
        ]}
        color={theme.colors.onPrimary}
        onPress={() => router.push('/add-transaction')}
        accessibilityLabel={t('addTransaction')}
        accessibilityRole="button"
      />
    </View>
  );
});

DashboardScreen.displayName = 'DashboardScreen';

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: moderateScale(spacing.md),
      paddingBottom: moderateScale(100),
      width: '100%',
      maxWidth: 1200,
      alignSelf: 'center',
    },
    gridContainer: {
      flexDirection: 'row',
      width: '100%',
      gap: spacing.md,
    },
    gridColumn: {
      flex: 1,
      flexDirection: 'column',
    },
    singleColumnContainer: {
      width: '100%',
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthHeader: {
      marginBottom: spacing.lg,
      marginTop: spacing.sm,
    },
    monthText: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(22),
      color: theme.colors.onSurface,
      textTransform: 'capitalize',
    },
    card: {
      marginBottom: spacing.md,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      elevation: 0,
      overflow: 'hidden',
    },
    cardTitle: {
      marginBottom: spacing.md,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(15),
      color: theme.colors.onSurface,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    amountText: {
      fontSize: fontScale(18),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    remainingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    flowRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    flowCard: {
      flex: 1,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      elevation: 0,
      overflow: 'hidden',
    },
    flowCardContent: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    flowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    flowLabel: {
      marginLeft: spacing.xs + 2,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      flex: 1,
    },
    flowAmount: {
      fontSize: fontScale(18),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    adjustmentsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      opacity: 0.8,
    },
    adjustmentsText: {
      marginLeft: 4,
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      fontSize: fontScale(12),
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    insightContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    sectionCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      elevation: 0,
      overflow: 'hidden',
    },
    headerCard: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      elevation: 0,
      overflow: 'hidden',
    },
    insightText: {
      marginLeft: spacing.md,
      flex: 1,
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
      borderRadius: 16,
    },
  });
