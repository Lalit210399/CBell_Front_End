# 🔔 CBELL Notification System

## Overview

The CBELL notification system provides real-time push notifications for event assignments and other important updates. It integrates Firebase Cloud Messaging (FCM) with a React-based frontend to deliver seamless notification experiences.

## 🏗️ Architecture

### Components Structure
```
src/
├── Services/
│   ├── firebase-config.js      # Firebase configuration
│   └── fcm-service.js          # FCM service for API calls
├── Context/
│   └── NotificationContext.js  # Global notification state
├── CommonComponents/
│   └── NotificationDropdown/
│       ├── NotificationDropdown.js
│       ├── NotificationDropdown.css
│       └── index.js
└── App.js                      # Main app with NotificationProvider
```

### Key Features
- ✅ Real-time push notifications
- ✅ Notification dropdown in navbar
- ✅ Mark as read/unread functionality
- ✅ Delete notifications
- ✅ Unread count badge
- ✅ Auto-refresh every 30 seconds
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Background notification handling

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install firebase
```

### 2. Configure Firebase
1. Follow the `FIREBASE_SETUP_GUIDE.md` for detailed setup
2. Update `src/Services/firebase-config.js` with your Firebase config
3. Update `public/firebase-messaging-sw.js` with your Firebase config

### 3. Backend Integration
Ensure your backend API endpoints are available:
- `POST /api/fcm/register-token`
- `GET /apis/notifications/user`
- `POST /apis/notifications/mark-read`
- `POST /apis/notifications/mark-all-read`
- `DELETE /apis/notifications/{id}`
- `GET /apis/notifications/unread-count`

## 📱 Usage

### Basic Integration
The notification system is automatically integrated into the navbar. Users will see:
- Bell icon with unread count badge
- Dropdown panel with notifications
- Action buttons for each notification

### Using Notification Context
```javascript
import { useNotification } from '../Context/NotificationContext';

const MyComponent = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotification();

  // Use notification data and actions
};
```

### FCM Service Usage
```javascript
import { fcmService } from '../Services/fcm-service';

// Initialize FCM
await fcmService.registerToken();

// Get notifications
const data = await fcmService.getNotifications();

// Mark as read
await fcmService.markAsRead(notificationId);
```

## 🎨 Styling

The notification system includes comprehensive CSS with:
- Responsive design for mobile and desktop
- Dark mode support
- Smooth animations and transitions
- Accessible color schemes
- Hover effects and interactive states

### Customization
Modify `src/CommonComponents/NotificationDropdown/NotificationDropdown.css` to customize:
- Colors and themes
- Spacing and layout
- Animation timings
- Responsive breakpoints

## 🔧 Configuration

### Environment Variables
For production, use environment variables:
```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

### Notification Types
The system supports different notification types:
- `event_assigned` - When assigned to an event
- `task_assigned` - When assigned to a task
- `system` - System notifications

### Auto-refresh Settings
Modify the refresh interval in `NotificationContext.js`:
```javascript
const interval = setInterval(() => {
  refreshNotifications();
}, 30000); // 30 seconds - change as needed
```

## 🧪 Testing

### Manual Testing
1. **Token Registration**: Check browser console for "FCM token registered"
2. **Notifications**: Create events with assigned users via API
3. **UI Interactions**: Test mark as read, delete, and dropdown functionality
4. **Background Notifications**: Test with app in background

### API Testing with Postman
1. Login to get authentication cookies
2. Register FCM token
3. Create event with assigned users
4. Check notifications endpoint
5. Test notification actions

## 🐛 Troubleshooting

### Common Issues

1. **FCM Token Registration Fails**
   - Check Firebase configuration
   - Verify user authentication
   - Check browser console for errors

2. **Notifications Not Appearing**
   - Verify backend API endpoints
   - Check notification permissions
   - Ensure service worker is registered

3. **Permission Denied**
   - User needs to grant notification permission
   - Check browser notification settings
   - Ensure HTTPS in production

4. **Styling Issues**
   - Check CSS file imports
   - Verify responsive breakpoints
   - Test in different browsers

### Debug Steps
1. Open browser developer tools
2. Check console for error messages
3. Verify network requests in Network tab
4. Test API endpoints individually
5. Check Firebase Console for token registration

## 📊 Performance

### Optimization Features
- Lazy loading of notifications
- Efficient state management with React Context
- Minimal re-renders with useCallback hooks
- Auto-cleanup of intervals and event listeners

### Monitoring
- Console logging for debugging
- Error handling for all API calls
- Loading states for better UX
- Graceful fallbacks for failed operations

## 🔒 Security

### Best Practices
- Cookie-based authentication
- HTTPS required for notifications
- Secure Firebase configuration
- User-specific notification access
- Input validation and sanitization

## 🚀 Future Enhancements

### Planned Features
- [ ] Notification categories and filtering
- [ ] Push notification preferences
- [ ] Notification history pagination
- [ ] Rich notification content
- [ ] Notification templates
- [ ] Analytics and tracking

### Integration Opportunities
- [ ] Email notification fallback
- [ ] SMS notifications
- [ ] Desktop notifications
- [ ] Mobile app integration
- [ ] Third-party service integration

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review console logs
3. Test with Postman
4. Verify Firebase setup
5. Check backend API status

## 📝 Changelog

### Version 1.0.0
- Initial implementation
- FCM integration
- Notification dropdown UI
- Basic CRUD operations
- Responsive design
- Dark mode support



