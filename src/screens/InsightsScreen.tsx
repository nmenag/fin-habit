import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useStore, useTranslation } from '../store/useStore';

const screenWidth = Dimensions.get('window').width;

export const InsightsScreen = () => {
  const { analyticsReport, formatCurrency, currencySymbol } = useStore();
  const { t } = useTranslation();

  if (!analyticsReport) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtext}>Loading analytics...</Text>
      </View>
    );
  }

  const {
    currentMonth,
    previousMonth,
    insights,
    spendingDays,
    expenseGrowth,
    categoryExpenses,
  } = analyticsReport;

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
  };

  const barData = {
    labels: [t('previousMonth'), t('currentMonth')],
    datasets: [
      {
        data: [previousMonth.expenses, currentMonth.expenses],
        colors: [(opacity = 1) => '#90caf9', (opacity = 1) => '#2196f3'],
      },
    ],
  };

  const pieData = categoryExpenses.map((ce) => ({
    name: `${ce.categoryName}: ${formatCurrency(ce.amount)}`,
    population: ce.amount,
    color: ce.color || '#ccc',
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>{t('financialAnalysis')}</Text>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <View style={[styles.miniCard, { backgroundColor: '#e8f5e9' }]}>
          <Text style={styles.miniLabel}>{t('income')}</Text>
          <Text style={[styles.miniValue, { color: '#2e7d32' }]}>
            {formatCurrency(currentMonth.income)}
          </Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: '#ffebee' }]}>
          <Text style={styles.miniLabel}>{t('expenses')}</Text>
          <Text style={[styles.miniValue, { color: '#c62828' }]}>
            {formatCurrency(currentMonth.expenses)}
          </Text>
        </View>
      </View>

      {/* Bar Chart: Expenses Comparison */}
      <View style={styles.card}>
        <Text style={styles.chartTitle}>{t('expenseGrowthTitle')}</Text>
        <BarChart
          data={barData}
          width={screenWidth - 64}
          height={220}
          yAxisLabel={currencySymbol}
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          withCustomBarColorFromData
          flatColor
          style={styles.chart}
        />
        <View style={styles.growthContainer}>
          <Text
            style={[
              styles.growthValue,
              { color: expenseGrowth > 0 ? '#f44336' : '#4caf50' },
            ]}
          >
            {expenseGrowth > 0 ? '+' : ''}
            {expenseGrowth.toFixed(1)}%
          </Text>
          <Text style={styles.subtext}>{t('comparedToLastMonth')}</Text>
        </View>
      </View>

      {/* Pie Chart: Expenses by Category */}
      {categoryExpenses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.chartTitle}>{t('chartTitle')}</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 64}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
      )}

      {/* Insights Section */}
      <Text style={[styles.headerTitle, { marginTop: 16, fontSize: 20 }]}>
        {t('insights')}
      </Text>
      {insights.map((insight) => (
        <View
          key={insight.id}
          style={[
            styles.insightBox,
            insight.level === 'positive' && styles.positiveBox,
            insight.level === 'warning' && styles.warningBox,
            insight.level === 'critical' && styles.criticalBox,
          ]}
        >
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightText}>{insight.message}</Text>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  miniCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  miniLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  miniValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  growthContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  growthValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 12,
    color: '#888',
  },
  insightBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#2196f3',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  positiveBox: {
    borderLeftColor: '#4caf50',
  },
  warningBox: {
    borderLeftColor: '#ff9800',
  },
  criticalBox: {
    borderLeftColor: '#f44336',
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  insightText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
});
