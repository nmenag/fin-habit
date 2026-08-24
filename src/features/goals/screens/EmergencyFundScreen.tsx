import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Checkbox,
  IconButton,
  Modal,
  Portal,
  ProgressBar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDb } from '../../../db/schema';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme, featureColors, spacing } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

interface MonthData {
  month: string;
  totalExpense: number;
}

export const EmergencyFundScreen = () => {
  const { goals, addGoal, editGoal, contributeToGoal, formatCurrency } =
    useStore();
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isSmallDevice = windowWidth < 375;

  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const existingFundGoal = useMemo(
    () => goals.find((g) => g.type === 'emergency_fund'),
    [goals],
  );

  const [availableMonths, setAvailableMonths] = useState<MonthData[]>([]);
  const [isEditing, setIsEditing] = useState(!existingFundGoal);

  const [selectedMonths, setSelectedMonths] = useState<string[]>(
    existingFundGoal?.selectedMonths || [],
  );
  const [monthsToCover, setMonthsToCover] = useState<number>(
    existingFundGoal?.monthsToCover || 6,
  );

  const [contribModalVisible, setContribModalVisible] = useState(false);
  const [contribInput, setContribInput] = useState('');

  const loadExpenseHistory = useCallback(() => {
    try {
      const db = getDb();
      const rows = db.getAllSync<MonthData>(`
        SELECT 
          substr(date, 1, 7) as month,
          SUM(amount) as totalExpense
        FROM transactions
        WHERE type = 'expense'
          AND (note IS NULL OR note NOT IN ('Balance Adjustment', 'Ajuste de Saldo'))
        GROUP BY month
        ORDER BY month DESC
      `);
      setAvailableMonths(rows);

      if (rows.length > 0 && selectedMonths.length === 0 && !existingFundGoal) {
        setSelectedMonths(rows.map((r) => r.month));
      }
    } catch (e) {
      console.error('Error fetching monthly expense history:', e);
    }
  }, [existingFundGoal, selectedMonths.length]);

  useEffect(() => {
    loadExpenseHistory();
  }, [loadExpenseHistory]);

  useEffect(() => {
    if (existingFundGoal) {
      if (existingFundGoal.selectedMonths) {
        setSelectedMonths(existingFundGoal.selectedMonths);
      }
      if (existingFundGoal.monthsToCover) {
        setMonthsToCover(existingFundGoal.monthsToCover);
      }
    }
  }, [existingFundGoal]);

  const monthMap = useMemo(() => {
    const map = new Map<string, number>();
    availableMonths.forEach((m) => map.set(m.month, m.totalExpense));
    return map;
  }, [availableMonths]);

  const monthlyExpenseBase = useMemo(() => {
    if (selectedMonths.length === 0) return 0;
    let sum = 0;
    selectedMonths.forEach((m) => {
      sum += monthMap.get(m) || 0;
    });
    return sum / selectedMonths.length;
  }, [selectedMonths, monthMap]);

  const calculatedTarget = useMemo(() => {
    return Math.round(monthlyExpenseBase * monthsToCover);
  }, [monthlyExpenseBase, monthsToCover]);

  const toggleMonth = useCallback((month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
  }, []);

  const handleSave = useCallback(() => {
    if (selectedMonths.length === 0) {
      Alert.alert(t('error') || 'Error', t('selectMonthsToCover'));
      return;
    }

    const accentColor = featureColors.emergencyFund || theme.colors.primary;
    const goalTitle = t('emergencyFund');

    if (existingFundGoal) {
      editGoal({
        ...existingFundGoal,
        name: goalTitle,
        targetAmount: calculatedTarget,
        selectedMonths,
        monthsToCover,
        color: accentColor,
        icon: 'shield-checkmark',
      });
    } else {
      addGoal({
        name: goalTitle,
        targetAmount: calculatedTarget,
        currentAmount: 0,
        color: accentColor,
        icon: 'shield-checkmark',
        status: 'active',
        displayOrder: 0,
        type: 'emergency_fund',
        selectedMonths,
        monthsToCover,
      });
    }

    setIsEditing(false);
  }, [
    selectedMonths,
    existingFundGoal,
    calculatedTarget,
    monthsToCover,
    theme.colors.primary,
    t,
    editGoal,
    addGoal,
  ]);

  const handleContributeSubmit = useCallback(() => {
    if (!existingFundGoal) return;
    const amount = parseFloat(contribInput.replace(/[^0-9.]/g, ''));
    if (!amount || amount <= 0) {
      Alert.alert(
        t('error') || 'Error',
        t('invalidAmount') || 'Monto inválido',
      );
      return;
    }
    contributeToGoal(existingFundGoal.id, amount);
    setContribInput('');
    setContribModalVisible(false);
  }, [existingFundGoal, contribInput, contributeToGoal, t]);

  const formatMonthLabel = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const str = format(date, 'MMMM yyyy', {
        locale: language === 'es' ? esLocale : enUS,
      });
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return monthStr;
    }
  };

  const currentAmount = existingFundGoal?.currentAmount || 0;
  const progressFraction =
    calculatedTarget > 0 ? Math.min(currentAmount / calculatedTarget, 1) : 0;
  const progressPercent = Math.round(progressFraction * 100);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('emergencyFund'),
          headerBackTitle: t('goals'),
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        {isEditing ? (
          <Animated.View entering={FadeIn}>
            <Card style={styles.setupCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconHeaderContainer}>
                  <View style={styles.headerIconCircle}>
                    <Ionicons
                      name="shield-checkmark"
                      size={28}
                      color={featureColors.emergencyFund}
                    />
                  </View>
                  <Text style={styles.setupTitle}>
                    {existingFundGoal
                      ? t('updateEmergencyFund')
                      : t('setupEmergencyFund')}
                  </Text>
                </View>

                <Text style={styles.sectionSubtitle}>
                  {t('selectBasisMonthsHeader')}
                </Text>

                {availableMonths.length === 0 ? (
                  <View style={styles.emptyMonthsBox}>
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text style={styles.emptyMonthsText}>
                      {t('noExpenseDataForMonths')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.monthsList}>
                    {availableMonths.map((m) => {
                      const isChecked = selectedMonths.includes(m.month);
                      return (
                        <TouchableOpacity
                          key={m.month}
                          style={[
                            styles.monthRow,
                            isChecked && styles.monthRowSelected,
                          ]}
                          onPress={() => toggleMonth(m.month)}
                          activeOpacity={0.7}
                        >
                          <Checkbox.Android
                            status={isChecked ? 'checked' : 'unchecked'}
                            onPress={() => toggleMonth(m.month)}
                            color={featureColors.emergencyFund}
                          />
                          <Text style={styles.monthLabel}>
                            {formatMonthLabel(m.month)}
                          </Text>
                          <Text style={styles.monthExpense}>
                            {formatCurrency(m.totalExpense)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={styles.divider} />

                <Text style={styles.sectionSubtitle}>
                  {t('monthsToCoverSliderHeader')}
                </Text>
                <View style={styles.stepperContainer}>
                  <IconButton
                    icon="minus-circle-outline"
                    size={28}
                    disabled={monthsToCover <= 3}
                    onPress={() =>
                      setMonthsToCover((prev) => Math.max(3, prev - 1))
                    }
                  />
                  <View style={styles.monthsDisplayBadge}>
                    <Text style={styles.monthsNumberText}>{monthsToCover}</Text>
                    <Text style={styles.monthsUnitText}>{t('monthsUnit')}</Text>
                  </View>
                  <IconButton
                    icon="plus-circle-outline"
                    size={28}
                    disabled={monthsToCover >= 12}
                    onPress={() =>
                      setMonthsToCover((prev) => Math.min(12, prev + 1))
                    }
                  />
                </View>

                <View style={styles.calculationPreviewCard}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>
                      {t('monthlyExpenseAverage')}:
                    </Text>
                    <Text style={styles.calcValue}>
                      {formatCurrency(monthlyExpenseBase)}
                    </Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>
                      {t('monthsToCoverLabel')}:
                    </Text>
                    <Text style={styles.calcValue}>{monthsToCover}</Text>
                  </View>
                  <View style={[styles.calcRow, styles.calcRowTotal]}>
                    <Text style={styles.calcTotalLabel}>
                      {t('recommendedFund')}:
                    </Text>
                    <Text style={styles.calcTotalValue}>
                      {formatCurrency(calculatedTarget)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.actionButtonsRow,
                    isSmallDevice && styles.actionButtonsRowStacked,
                  ]}
                >
                  {existingFundGoal && (
                    <Button
                      mode="outlined"
                      onPress={() => setIsEditing(false)}
                      style={styles.cancelBtn}
                      labelStyle={styles.actionBtnLabel}
                    >
                      {t('cancel') || 'Cancelar'}
                    </Button>
                  )}
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    buttonColor={featureColors.emergencyFund}
                    textColor="#FFFFFF"
                    style={styles.saveBtn}
                    labelStyle={styles.actionBtnLabel}
                  >
                    {t('saveEmergencyFund')}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp}>
            {/* Prominent Recommendation Tip Block */}
            <Card style={styles.tipCard}>
              <Card.Content style={styles.tipCardContent}>
                <View style={styles.tipHeaderRow}>
                  <View style={styles.tipIconBox}>
                    <Ionicons
                      name="shield"
                      size={24}
                      color={featureColors.emergencyFund}
                    />
                  </View>
                  <Text style={styles.tipTitle}>{t('emergencyFund')}</Text>
                </View>
                <Text style={styles.tipText}>
                  {t('emergencyFundTip', {
                    count: selectedMonths.length,
                    avg: formatCurrency(monthlyExpenseBase),
                    months: monthsToCover,
                    target: formatCurrency(calculatedTarget),
                  })}
                </Text>
              </Card.Content>
            </Card>

            {/* Target and Progress Block */}
            <Card style={styles.progressCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.progressHeaderRow}>
                  <View style={styles.targetAmountContainer}>
                    <Text style={styles.progressLabel}>
                      {t('targetAmount') || 'Meta calculada'}
                    </Text>
                    <Text
                      style={styles.targetAmountText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {formatCurrency(calculatedTarget)}
                    </Text>
                  </View>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{progressPercent}%</Text>
                  </View>
                </View>

                <ProgressBar
                  progress={progressFraction}
                  color={featureColors.emergencyFund}
                  style={styles.progressBar}
                />

                <View style={styles.progressFooterRow}>
                  <Text style={styles.savedText} numberOfLines={1}>
                    {t('saved') || 'Guardado'}: {formatCurrency(currentAmount)}
                  </Text>
                  <Text style={styles.remainingText} numberOfLines={1}>
                    {t('remaining') || 'Falta'}:{' '}
                    {formatCurrency(
                      Math.max(calculatedTarget - currentAmount, 0),
                    )}
                  </Text>
                </View>

                <View
                  style={[
                    styles.cardActionsRow,
                    isSmallDevice && styles.cardActionsRowStacked,
                  ]}
                >
                  <Button
                    mode="contained"
                    onPress={() => setContribModalVisible(true)}
                    buttonColor={featureColors.emergencyFund}
                    textColor="#FFFFFF"
                    icon="plus"
                    style={styles.actionBtn}
                    labelStyle={styles.actionBtnLabel}
                  >
                    {t('addContribution') || 'Abonar'}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setIsEditing(true)}
                    icon="pencil"
                    style={styles.actionBtn}
                    labelStyle={styles.actionBtnLabel}
                  >
                    {t('editEmergencyFund')}
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Details Breakdown */}
            <Card style={styles.detailsCard}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.detailsTitle}>
                  {t('details') || 'Detalles del Cálculo'}
                </Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {t('monthlyExpenseAverage')}
                  </Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(monthlyExpenseBase)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {t('monthsToCoverLabel')}
                  </Text>
                  <Text style={styles.detailValue}>
                    {t('monthsCount', { count: monthsToCover })}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {t('selectMonthsToCover')}
                  </Text>
                  <Text style={styles.detailValue}>
                    {t('monthsCount', { count: selectedMonths.length })}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={contribModalVisible}
          onDismiss={() => setContribModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {t('addContribution') || 'Abonar al Fondo'}
          </Text>
          <TextInput
            label={t('amount') || 'Monto'}
            value={contribInput}
            onChangeText={(text) =>
              setContribInput(text.replace(/[^0-9.]/g, ''))
            }
            keyboardType="numeric"
            style={styles.modalInput}
            mode="outlined"
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setContribModalVisible(false)}>
              {t('cancel') || 'Cancelar'}
            </Button>
            <Button
              mode="contained"
              onPress={handleContributeSubmit}
              buttonColor={featureColors.emergencyFund}
              textColor="#FFFFFF"
            >
              {t('save') || 'Guardar'}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: spacing.md,
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
    },
    setupCard: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    cardContent: {
      padding: spacing.md,
    },
    iconHeaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    headerIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.dark ? '#052E16' : '#DCFCE7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    setupTitle: {
      flex: 1,
      fontSize: fontScale(20),
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.onSurface,
    },
    sectionSubtitle: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    emptyMonthsBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: theme.colors.background,
      borderRadius: theme.roundness,
      gap: spacing.xs,
    },
    emptyMonthsText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    monthsList: {
      gap: spacing.xs,
      marginVertical: spacing.xs,
    },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.background,
    },
    monthRowSelected: {
      backgroundColor: theme.dark ? '#052E16' : '#F0FDF4',
      borderWidth: 1,
      borderColor: featureColors.emergencyFund,
    },
    monthLabel: {
      flex: 1,
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      color: theme.colors.onSurface,
      marginRight: spacing.xs,
    },
    monthExpense: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.onSurface,
      textAlign: 'right',
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: spacing.md,
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      marginVertical: spacing.sm,
    },
    monthsDisplayBadge: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      backgroundColor: theme.colors.background,
      borderRadius: theme.roundness,
      minWidth: 90,
    },
    monthsNumberText: {
      fontSize: fontScale(24),
      fontFamily: 'Inter-SemiBold',
      color: featureColors.emergencyFund,
    },
    monthsUnitText: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
    },
    calculationPreviewCard: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.roundness,
      padding: spacing.md,
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    calcRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    calcRowTotal: {
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    calcLabel: {
      flex: 1,
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      marginRight: spacing.sm,
    },
    calcValue: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      color: theme.colors.onSurface,
      textAlign: 'right',
    },
    calcTotalLabel: {
      flex: 1,
      fontSize: fontScale(15),
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.onSurface,
      marginRight: spacing.sm,
    },
    calcTotalValue: {
      fontSize: fontScale(18),
      fontFamily: 'Inter-SemiBold',
      color: featureColors.emergencyFund,
      textAlign: 'right',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    actionButtonsRowStacked: {
      flexDirection: 'column',
    },
    cancelBtn: {
      flex: 1,
    },
    saveBtn: {
      flex: 1,
    },
    actionBtnLabel: {
      fontSize: fontScale(13),
    },
    tipCard: {
      borderRadius: theme.roundness,
      backgroundColor: theme.dark ? '#052E16' : '#ECFDF5',
      borderColor: featureColors.emergencyFund,
      borderWidth: 1,
      marginBottom: spacing.md,
    },
    tipCardContent: {
      padding: spacing.md,
    },
    tipHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    tipIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.dark ? '#064E3B' : '#A7F3D0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipTitle: {
      flex: 1,
      fontSize: fontScale(18),
      fontFamily: 'Inter-SemiBold',
      color: theme.dark ? '#6EE7B7' : '#047857',
    },
    tipText: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      color: theme.dark ? '#D1FAE5' : '#065F46',
      lineHeight: 22,
    },
    progressCard: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      marginBottom: spacing.md,
    },
    progressHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    targetAmountContainer: {
      flex: 1,
      marginRight: spacing.sm,
    },
    progressLabel: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
    },
    targetAmountText: {
      fontSize: fontScale(24),
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.onSurface,
    },
    percentBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      backgroundColor: theme.dark ? '#052E16' : '#DCFCE7',
      borderRadius: 12,
    },
    percentText: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-SemiBold',
      color: featureColors.emergencyFund,
    },
    progressBar: {
      height: 10,
      borderRadius: 5,
      marginVertical: spacing.xs,
    },
    progressFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    savedText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      color: theme.colors.onSurface,
      flex: 1,
      marginRight: spacing.xs,
    },
    remainingText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      textAlign: 'right',
    },
    cardActionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    cardActionsRowStacked: {
      flexDirection: 'column',
    },
    actionBtn: {
      flex: 1,
    },
    detailsCard: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    detailsTitle: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.onSurface,
      marginBottom: spacing.sm,
    },
    detailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    detailLabel: {
      flex: 1,
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      marginRight: spacing.sm,
    },
    detailValue: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      color: theme.colors.onSurface,
      textAlign: 'right',
    },
    modalContainer: {
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      margin: spacing.lg,
      borderRadius: theme.roundness,
      maxWidth: 500,
      width: '90%',
      alignSelf: 'center',
    },
    modalTitle: {
      fontSize: fontScale(18),
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.onSurface,
      marginBottom: spacing.md,
    },
    modalInput: {
      marginBottom: spacing.md,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
  });
