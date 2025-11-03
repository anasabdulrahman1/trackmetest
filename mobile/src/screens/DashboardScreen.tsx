// mobile/src/screens/DashboardScreen.tsx

// 1. We have REMOVED the unused 'useEffect' import
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, List, FAB, Appbar, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; 

export type Subscription = {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  next_payment_date: string;
};

// --- SubscriptionItem Component ---
// This component is correct and does not need changes.
type SubscriptionItemProps = {
  item: Subscription;
};

const SubscriptionItem = React.memo(({ item }: SubscriptionItemProps) => {
  const renderLeftIcon = (props: any) => <List.Icon {...props} icon="wallet" />;
  
  const renderRightPrice = (props: any) => (
    <Text {...props} style={styles.priceText}>
      ₹{item.price}
    </Text>
  );

  return (
    <List.Item
      title={item.name}
      description={`Next payment: ${item.next_payment_date}`}
      left={renderLeftIcon}
      right={renderRightPrice}
      onPress={() => console.log('Tapped on', item.name)}
    />
  );
});
// --- End of SubscriptionItem ---


export const DashboardScreen = () => {
  const { session, signOut } = useAuth();
  const navigation = useNavigation<any>(); 

  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);

  // --- 2. THE FIX: Wrap `fetchSubscriptions` in its own useCallback ---
  // This function will now only be re-created if the `session` changes.
  const fetchSubscriptions = useCallback(async () => {
    if (!session) return; 

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, name, price, billing_cycle, next_payment_date')
        .eq('user_id', session.user.id)
        .eq('status', 'active'); 

      if (error) throw error;

      if (data) {
        setSubscriptions(data as Subscription[]);
        
        const total = data.reduce((acc, sub) => {
          if (sub.billing_cycle === 'monthly') {
            return acc + sub.price;
          }
          return acc;
        }, 0);
        setTotalSpend(total);
      }
    } catch (error: any) {
      Alert.alert('Error fetching data', error.message);
    } finally {
      setLoading(false);
    }
  }, [session]); // This function depends on `session`

  // --- 3. THE FIX: Update the `useFocusEffect` dependency ---
  // Now we pass our stable `fetchSubscriptions` function as a dependency.
  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [fetchSubscriptions]) // <-- This is now correct.
  );

  const renderSubscriptionItem = ({ item }: { item: Subscription }) => (
    <SubscriptionItem item={item} />
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Your Dashboard" />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      <Card style={styles.summaryCard} mode="elevated">
        <Card.Title title="Total Monthly Spend" />
        <Card.Content>
          <Text variant="displayMedium">₹{totalSpend.toFixed(2)}</Text>
          <Text variant="bodyMedium">
            Based on {subscriptions.length} active subscriptions
          </Text>
        </Card.Content>
      </Card>

      <Text variant="headlineSmall" style={styles.listHeader}>
        Active Subscriptions
      </Text>
      
      {loading ? (
        <ActivityIndicator animating={true} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderSubscriptionItem}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No subscriptions yet. Tap the '+' button to add your first one!
            </Text>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddSubscription')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  summaryCard: {
    margin: 16,
  },
  listHeader: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  priceText: {
    alignSelf: 'center',
    marginRight: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
});