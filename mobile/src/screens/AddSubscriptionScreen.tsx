// src/screens/AddSubscriptionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  Platform,
  View,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  Button,
  TextInput,
  Text,
  SegmentedButtons,
  Switch,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../Components/AppLayout';

export const AddSubscriptionScreen = ({ navigation }: any) => {
  const { session } = useAuth();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [firstPaymentDate, setFirstPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [reminderChips, setReminderChips] = useState<{ [k: number]: boolean }>({ 1: true, 3: true, 7: true });
  const [customReminder, setCustomReminder] = useState('');

  // Prevent crashes when navigating away during picker open
  useEffect(() => {
    return () => {
      setShowDatePicker(false);
    };
  }, []);

  // --- Safe Date Picker Logic ---
  const onDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFirstPaymentDate(selectedDate);
    }
  };

  const openDatePicker = () => {
    if (!showDatePicker) {
      setShowDatePicker(true);
    }
  };

  // --- Input Validation ---
  const validateInputs = (): boolean => {
    if (!name.trim()) {
      setSnackbar('Please enter a subscription name.');
      return false;
    }
    if (!isTrial && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      setSnackbar('Please enter a valid price.');
      return false;
    }
    return true;
  };

  // --- Save Subscription ---
  const handleSave = async () => {
    if (!session?.user) {
      Alert.alert('Error', 'You must be logged in to save a subscription.');
      return;
    }
    if (!validateInputs()) return;

    setLoading(true);

    const selectedOffsets = Object.entries(reminderChips)
      .filter(([k, v]) => v)
      .map(([k]) => parseInt(k, 10));
    const customOffsets = customReminder
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 365);
    const allOffsets = Array.from(new Set([...selectedOffsets, ...customOffsets])).slice(0, 12);
    const reminder_period = allOffsets.join(',');

    const subscriptionData = {
      user_id: session.user.id,
      name: name.trim(),
      price: parseFloat(price || '0'),
      billing_cycle: isTrial ? 'trial' : billingCycle,
      next_payment_date: firstPaymentDate.toISOString().split('T')[0],
      status: 'active',
      category: 'General',
      reminder_period,
    };

    try {
      const { error } = await supabase.from('subscriptions').insert(subscriptionData);
      if (error) throw error;

      setSnackbar(`${name} added successfully!`);
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      console.error('❌ Error Saving:', error.message);
      setSnackbar(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout scrollable>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <Text variant="headlineMedium" style={styles.title}>
            Add New Subscription
          </Text>

          <TextInput
            label="Subscription Name (e.g., Netflix)"
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Price (₹)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            disabled={isTrial}
          />
          {!isTrial && (
            <HelperText type="info" visible>
              Leave blank for ₹0 subscriptions (e.g., trials or free tiers)
            </HelperText>
          )}

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Is this a Free Trial?</Text>
            <Switch value={isTrial} onValueChange={setIsTrial} />
          </View>

          {!isTrial && (
            <SegmentedButtons
              value={billingCycle}
              onValueChange={setBillingCycle}
              style={styles.segmented}
              buttons={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
                { value: 'quarterly', label: 'Quarterly' },
              ]}
            />
          )}

          {/* Reminder Offsets */}
          <Text style={{ marginTop: 12, marginBottom: 8, color: '#444' }}>Remind me before due date</Text>
          <SegmentedButtons
            value={Object.keys(reminderChips).filter((k) => reminderChips[parseInt(k, 10)]).join(',')}
            onValueChange={(val) => {
              const n = parseInt(String(val), 10);
              setReminderChips((prev) => ({ ...prev, [n]: !prev[n] }));
            }}
            buttons={[
              { value: '1', label: '1 day' },
              { value: '3', label: '3 days' },
              { value: '7', label: '7 days' },
            ]}
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label="Custom offsets (e.g. 2,5,10)"
            value={customReminder}
            onChangeText={setCustomReminder}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="outlined"
            onPress={openDatePicker}
            style={styles.dateButton}>
            {isTrial ? 'Select Trial End Date' : 'Select First Payment Date'}
          </Button>

          <Text style={styles.dateText}>{firstPaymentDate.toDateString()}</Text>

          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={firstPaymentDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          {Platform.OS === 'ios' && showDatePicker && (
            <View style={styles.iosPickerContainer}>
              <DateTimePicker
                value={firstPaymentDate}
                mode="date"
                display="inline"
                onChange={onDateChange}
              />
              <Button
                onPress={() => setShowDatePicker(false)}
                style={styles.doneButton}>
                Done
              </Button>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading || !name}
            style={styles.saveButton}>
            Save Subscription
          </Button>

          <Snackbar
            visible={!!snackbar}
            onDismiss={() => setSnackbar('')}
            duration={2500}>
            {snackbar}
          </Snackbar>
        </View>
      </TouchableWithoutFeedback>
    </AppLayout>
  );
};

// ---------------------------------------------------------
// Styles
// ---------------------------------------------------------
const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  input: {
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  switchLabel: {
    fontSize: 16,
    color: '#444',
  },
  segmented: {
    marginBottom: 16,
  },
  dateButton: {
    marginTop: 10,
  },
  dateText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 18,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#6c47ff',
  },
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  doneButton: {
    alignSelf: 'flex-end',
    marginRight: 10,
    marginTop: 4,
  },
});

