import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Account } from '../store/useStore';

interface Props {
  account: Account;
}

export const AccountCard: React.FC<Props> = ({ account }) => {
  return (
    <View style={[styles.card, { borderLeftColor: account.color || '#4caf50' }]}>
      <Text style={styles.name}>{account.name}</Text>
      <Text style={styles.type}>{account.type.toUpperCase()}</Text>
      <Text style={styles.balance}>${account.currentBalance.toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  type: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  balance: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
});
