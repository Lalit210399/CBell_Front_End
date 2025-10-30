// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// ✅ Real Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyBvtjcHxhA8lA10uFC0seVvXVxBWUdYG4g",
  authDomain: "cbell-web-app.firebaseapp.com",
  projectId: "cbell-web-app",
  storageBucket: "cbell-web-app.firebasestorage.app",
  messagingSenderId: "794273668439",
  appId: "1:794273668439:web:7f39061cd37f58e996f212"
};

firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Get notification data
    const notificationData = event.notification.data;
    const notificationType = notificationData?.type;
    
    // Determine the correct URL based on notification type
    let urlToOpen = '/';
    
    if (notificationType === 'event_assigned' && notificationData?.eventId) {
      // Navigate to event detail page
      urlToOpen = `/events/eventDetailPage?eventId=${notificationData.eventId}&mode=view`;
    } else if (notificationType === 'task_assigned' && notificationData?.taskId) {
      // Navigate to task detail page
      urlToOpen = `/events/eventDetailPage/tasks?taskId=${notificationData.taskId}&mode=view`;
    } else if (notificationData?.url) {
      // Use the provided URL
      urlToOpen = notificationData.url;
    }
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window/tab open with the app
        for (const client of clientList) {
          if (client.url.includes(window.location.origin) && 'focus' in client) {
            // Focus existing window and navigate to the correct page
            return client.focus().then(() => {
              // Send message to the client to navigate to the specific page
              return client.postMessage({
                type: 'NOTIFICATION_CLICK',
                data: {
                  notificationType,
                  eventId: notificationData?.eventId,
                  taskId: notificationData?.taskId,
                  url: urlToOpen
                }
              });
            });
          }
        }
        
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

