import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Goal, useStore, useTranslation } from '../store/useStore';
import { formatNumber } from '../utils/formatters';

const COLORS = [
  '#4caf50',
  '#2196f3',
  '#ff9800',
  '#f44336',
  '#9c27b0',
  '#e91e63',
  '#00bcd4',
  '#607d8b',
];

const ICONS = [
  'trophy',
  'car',
  'home',
  'airplane',
  'cart',
  'gift',
  'school',
  'medkit',
  'star',
  'heart',
  'sunny',
  'umbrella',
];

export const AddGoalScreen = ({ route, navigation }: any) => {
  const editingGoal = route.params?.goal as Goal | undefined;
  const isEditing = !!editingGoal;

  const { addGoal, editGoal, deleteGoal, contributeToGoal, formatCurrency } =
    useStore();
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(editingGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(
    editingGoal?.targetAmount || 0,
  );
  const [displayTargetAmount, setDisplayTargetAmount] = useState(
    editingGoal ? formatNumber(editingGoal.targetAmount, language) : '',
  );
  const [currentAmount, setCurrentAmount] = useState(
    editingGoal?.currentAmount || 0,
  );
  const [displayCurrentAmount, setDisplayCurrentAmount] = useState(
    editingGoal ? formatNumber(editingGoal.currentAmount, language) : '0',
  );
  const [color, setColor] = useState(editingGoal?.color || COLORS[0]);
  const [icon, setIcon] = useState(editingGoal?.icon || ICONS[0]);
  const [contribution, setContribution] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('enterGoalName'));
      return;
    }
    if (targetAmount <= 0) {
      Alert.alert(t('error'), t('enterTargetAmount'));
      return;
    }

    const goalData: Goal = {
      id: isEditing ? editingGoal!.id : Date.now().toString(),
      name: name.trim(),
      targetAmount,
      currentAmount,
      color,
      icon,
      status: currentAmount >= targetAmount ? 'completed' : 'active',
      deadline: editingGoal?.deadline || null,
    };

    if (isEditing) {
      editGoal(goalData);
    } else {
      addGoal(goalData);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(t('deleteGoal'), t('confirmDelete'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          deleteGoal(editingGoal!.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleContribute = () => {
    const amount = parseFloat(contribution.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }

    contributeToGoal(editingGoal!.id, amount);
    setContribution('');
    Alert.alert(t('success'), t('contributionAdded'));
  };

  const handleAmountChange = (
    text: string,
    setter: (val: number) => void,
    displaySetter: (val: string) => void,
  ) => {
    const onlyDigits = text.replace(/\D/g, '');
    if (onlyDigits === '') {
      displaySetter('');
      setter(0);
      return;
    }
    const num = parseInt(onlyDigits, 10);
    setter(num);
    displaySetter(formatNumber(num, language));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('goalName')}</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder={t('goalNamePlaceholder') || 'E.g. New Car'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('targetAmount')}</Text>
          <TextInput
            style={styles.textInput}
            value={displayTargetAmount}
            onChangeText={(text) =>
              handleAmountChange(text, setTargetAmount, setDisplayTargetAmount)
            }
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>

        {!isEditing && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('currentAmount')}</Text>
            <TextInput
              style={styles.textInput}
              value={displayCurrentAmount}
              onChangeText={(text) =>
                handleAmountChange(
                  text,
                  setCurrentAmount,
                  setDisplayCurrentAmount,
                )
              }
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('icon')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.iconScroll}
          >
            {ICONS.map((i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.iconChip,
                  icon === i && { backgroundColor: color },
                ]}
                onPress={() => setIcon(i)}
              >
                <Ionicons
                  name={i as any}
                  size={24}
                  color={icon === i ? '#fff' : '#666'}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('color')}</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  color === c && styles.activeColor,
                ]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        {isEditing && (
          <View style={styles.contributionSection}>
            <Text style={styles.label}>{t('contribute')}</Text>
            <View style={styles.contributionInputRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                value={contribution}
                onChangeText={(text) =>
                  setContribution(text.replace(/[^0-9]/g, ''))
                }
                keyboardType="numeric"
                placeholder="0.00"
              />
              <TouchableOpacity
                style={[styles.contributeBtn, { backgroundColor: color }]}
                onPress={handleContribute}
              >
                <Text style={styles.contributeBtnText}>
                  {t('add') || 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: color }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>
            {isEditing ? t('update') : t('save')}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>{t('deleteGoal')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 4,
  },
  iconScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColor: {
    borderColor: '#333',
  },
  contributionSection: {
    marginTop: 10,
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  contributionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contributeBtn: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  contributeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteBtnText: {
    color: '#f44336',
    fontWeight: '600',
  },
});
