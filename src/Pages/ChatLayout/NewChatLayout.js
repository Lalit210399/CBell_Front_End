import React, { useState, useEffect } from 'react';
import ChatLayout from '../../CommonComponents/TaskChatLayout/ChatLayout';
import { useUser } from '../../Context/UserContext';
import "./NewChatLayout.css";

const NewPage = () => {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `apis/event/hierarchy/681460dcb8327b2e3417d8b1?userId=${user?.userId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': '1',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setEvents(data.data || []); // Use .data from API response
        } else {
          console.error('Failed to fetch events');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      fetchEvents();
    }
  }, [user?.userId]);

  if (loading) {
    return (
      <div className="page-loading">
        <div>Loading events...</div>
      </div>
    );
  }

  return (
    <div className="new-page-container">
      <div className="page-header">
        {/* <h1>Task Conversations</h1> */} 
        {/* <p>Chat with your team about specific tasks</p> */}
      </div>
      <ChatLayout
        events={events}
        organizationId="681460dcb8327b2e3417d8b1" // Pass organization ID for task API calls
      />
    </div>
  );
};

export default NewPage;