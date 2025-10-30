# Firebase Setup Guide for CBELL Notifications

## 🔧 Configuration Steps

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable **Cloud Messaging** in the project settings

### 2. Web App Configuration

1. In Firebase Console, go to **Project Settings** > **General**
2. Scroll down to **Your apps** section
3. Click **Add app** and select **Web** (</>) icon
4. Register your app with a nickname (e.g., "CBELL Web App")
5. Copy the Firebase configuration object

### 3. Update Configuration Files

#### Update `src/Services/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};

export const vapidKey = "your-actual-vapid-key";
```

#### Update `public/firebase-messaging-sw.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

### 4. Generate VAPID Key

1. In Firebase Console, go to **Project Settings** > **Cloud Messaging**
2. Scroll down to **Web configuration**
3. Click **Generate key pair** under **Web Push certificates**
4. Copy the generated key and update `vapidKey` in `firebase-config.js`

### 5. Authorize Domains

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your development domain: `localhost`
3. Add your production domain when ready

### 6. Install Firebase SDK

Run the following command in your project root:
```bash
npm install firebase
```

## 🧪 Testing

### 1. Test FCM Token Registration
1. Open browser developer tools
2. Navigate to your app
3. Check console for "FCM token registered" message
4. Verify token appears in Firebase Console > Cloud Messaging > Tokens

### 2. Test Notifications
1. Use Postman to create an event with assigned users
2. Check if notifications appear in the bell icon dropdown
3. Test notification actions (mark as read, delete)

### 3. Test Background Notifications
1. Send a test notification from Firebase Console
2. Verify notification appears even when app is in background
3. Test notification click behavior

## 🔒 Security Notes

- Never commit actual Firebase config to version control
- Use environment variables for production
- Keep VAPID key secure
- Regularly rotate API keys

## 🚀 Production Deployment

1. Update Firebase config with production domains
2. Set up proper CORS policies
3. Configure HTTPS (required for notifications)
4. Test notification delivery in production environment

## 📞 Troubleshooting

### Common Issues:

1. **"Messaging: This browser doesn't support the API"**
   - Ensure you're using HTTPS in production
   - Check browser compatibility

2. **"Permission denied"**
   - User needs to grant notification permission
   - Check browser notification settings

3. **"Token registration failed"**
   - Verify Firebase config is correct
   - Check network connectivity
   - Ensure user is authenticated

4. **Notifications not appearing**
   - Check if service worker is registered
   - Verify VAPID key is correct
   - Check browser console for errors

### Debug Steps:
1. Check browser console for error messages
2. Verify Firebase project settings
3. Test API endpoints with Postman
4. Check service worker registration
5. Verify notification permissions

