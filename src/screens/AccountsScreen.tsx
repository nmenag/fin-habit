import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AccountCard } from '../components/AccountCard';
import { useStore } from '../store/useStore';

export const AccountsScreen = () => {
  const accounts = useStore((state) => state.accounts);
  const addAccount = useStore((state) => state.addAccount);

  const handleAddQuickAccount = () => {
    // For MVP, randomly generated account mock
    addAccount({
      id: Date.now().toString(),
      name: 'New Wallet ' + Math.floor(Math.random() * 100),
      type: 'cash',
      initialBalance: 0,
      currentBalance: 0,
      color: '#00bcd4'
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AccountCard account={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No accounts found.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddQuickAccount}>
          <Text style={styles.addButtonText}>Add Demo Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  addButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
