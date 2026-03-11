import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../store/useStore';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
];

export const SettingsScreen = () => {
  const currency = useStore((state) => state.currency);
  const setCurrency = useStore((state) => state.setCurrency);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <View style={styles.optionsContainer}>
          {CURRENCIES.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.option,
                currency === item.code && styles.activeOption,
              ]}
              onPress={() => setCurrency(item.code)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.currencySymbol}>{item.symbol}</Text>
                <View>
                  <Text style={styles.currencyCode}>{item.code}</Text>
                  <Text style={styles.currencyName}>{item.name}</Text>
                </View>
              </View>
              {currency === item.code && (
                <Ionicons name="checkmark-circle" size={24} color="#2196f3" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Changing the currency will update how all amounts are displayed across
          the app.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeOption: {
    backgroundColor: '#f0f7ff',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    width: 40,
    textAlign: 'center',
    marginRight: 16,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  currencyName: {
    fontSize: 12,
    color: '#888',
  },
  infoSection: {
    padding: 24,
  },
  infoText: {
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 14,
  },
});
