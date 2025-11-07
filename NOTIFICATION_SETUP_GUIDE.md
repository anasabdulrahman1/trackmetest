# 🔔 Notification System Setup Guide

## ✅ What Was Fixed

### 1. **Missing Timezone Column**
- Added `timezone` column to `profiles` table
- Set default timezone to `Asia/Kolkata` for Indian users
- This was causing the Edge Function to fail with 500 errors

### 2. **Missing Cron Job**
- Created migration `20251107000000_schedule_send_reminders.sql`
- Scheduled `send-reminders` function to run **every hour**
- Function checks if it's 8am in each user's timezone before sending

### 3. **Missing Notification Handlers in Mobile App**
- Created `src/utils/notificationHandler.ts` with:
  - Foreground message handler (shows alert when app is open)
  - Background message handler (FCM handles display automatically)
  - Notification press handlers
- Integrated into `App.tsx` and `index.js`

## 📊 Database Tables

### `notification_events` Table
This table **DOES EXIST** (created in migration `20251104130000`). It logs all notification attempts:

```sql
SELECT * FROM notification_events ORDER BY created_at DESC LIMIT 10;
```

**Columns:**
- `id` - Unique notification event ID
- `user_id` - User who received the notification
- `subscription_id` - Which subscription triggered it
- `device_id` - Which device it was sent to
- `scheduled_for` - When it was scheduled (8am user's timezone)
- `sent_at` - When FCM actually sent it
- `offset_days` - How many days before payment (1, 3, 7, etc.)
- `status` - `sent` or `failed`
- `error` - Error message if failed

## 🔄 How Notifications Work

### Architecture:
```
Cron Job (hourly) 
  → Edge Function (send-reminders)
    → Checks subscriptions due in 1,3,7 days
      → Sends to FCM
        → FCM delivers to device
          → React Native app displays notification
```

### Timing:
1. **Cron runs every hour** at :00 minutes
2. **Function checks** if it's between 7:45-8:00am in user's timezone
3. **Sends notifications** for subscriptions matching reminder offsets
4. **Logs to** `notification_events` table

### Your Current Data:
- **TestSubT**: Next payment Nov 8, reminder at 1 day → Will trigger **tomorrow at 8am IST**
- **Tweet Hunter**: Next payment Nov 30, reminders at 1,2,7 days → Will trigger Nov 23, 28, 29 at 8am IST

## 🧪 Testing Results

### Test Function Response:
```json
{
  "candidates": 1,
  "sent": 1,
  "failed": 0,
  "message": "Test version - no time window restriction"
}
```

✅ **Notification was sent successfully to FCM**

## ❌ Why You Didn't Receive the Notification

The notification was sent to FCM, but you didn't see it because:

### **The app didn't have notification handlers set up!**

Before the fix:
- ❌ No foreground message handler
- ❌ No background message handler  
- ❌ No notification display logic

After the fix:
- ✅ Foreground handler shows Alert when app is open
- ✅ Background handler registered in index.js
- ✅ FCM handles display when app is closed/background

## 🚀 Next Steps to Test

### Option 1: Rebuild and Test Now

1. **Rebuild the app** (notification handlers need app restart):
   ```bash
   cd mobile
   npm run android
   # or
   npm run ios
   ```

2. **Keep the app open** and run the test function:
   ```powershell
   Invoke-WebRequest -Uri "https://aqpnksnxuiutwobkwzst.supabase.co/functions/v1/send-reminders-test" -Method POST -Headers @{"Authorization"="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcG5rc254dWl1dHdvYmt3enN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA1NzcwNywiZXhwIjoyMDc3NjMzNzA3fQ.QsvFNfhMihltdXq8aiyEJNISP5n0gSIHR52umobGfBI"; "Content-Type"="application/json"}
   ```

3. **You should see an Alert** popup with the reminder message!

4. **Close the app** and run again - you should see a system notification

### Option 2: Wait for Production

The production system will automatically send notifications:
- **Tomorrow (Nov 8) at 8:00 AM IST** for TestSubT
- **Nov 23, 28, 29 at 8:00 AM IST** for Tweet Hunter

## 🔍 Debugging

### Check if notification was logged:
```sql
SELECT 
  ne.*,
  s.name as subscription_name,
  d.device_token
FROM notification_events ne
JOIN subscriptions s ON s.id = ne.subscription_id
JOIN devices d ON d.id = ne.device_id
ORDER BY ne.created_at DESC
LIMIT 5;
```

### Check FCM token is valid:
```sql
SELECT 
  id,
  device_token,
  logged_in,
  last_active,
  platform
FROM devices
WHERE user_id = 'a9357098-8841-4442-8530-ec9a49c4b3cb';
```

### View Edge Function logs:
Go to Supabase Dashboard → Edge Functions → send-reminders → Logs

## 📝 Important Notes

1. **Background notifications** are handled automatically by FCM - no code needed
2. **Foreground notifications** show as Alert (you can customize this later)
3. **Test function** (`send-reminders-test`) bypasses the 8am time window
4. **Production function** (`send-reminders`) only sends at 8am user's timezone
5. **Cron job** runs every hour but function filters by time

## 🎯 Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Fixed | Added timezone column |
| Cron Job | ✅ Scheduled | Runs hourly |
| Edge Function | ✅ Working | Sends to FCM successfully |
| Mobile Handlers | ✅ Added | Need app rebuild |
| notification_events | ✅ Exists | Check for logged events |

**Next action:** Rebuild the mobile app and test!
