//NEwChatLayout
import React, { useState, useEffect } from 'react';
import ChatLayout from '../../CommonComponents/ChatLayout/ChatLayout';
import { useUser } from '../../Context/UserContext';
import { fetchWithRefresh } from '../../Context/RefereshToken';
import "./NewChatLayout.css";

const NewChatLayout = () => {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const organizationId = user?.organizationId;

      if (!organizationId) {
        console.error("No organization selected");
        setLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      };

      try {
        setLoading(true);
        const response = await fetchWithRefresh(
          `/apis/event/hierarchy-extended/${organizationId}?userId=${user?.userId}&filter=normal`,
          {
            method: "GET",
            headers,
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

    if (user?.userId && user?.organizationId) {
      fetchEvents();
    }
  }, [user?.userId, user?.organizationId]);

  if (loading) {
    return (
      <div className="chat-layout-page">
        <div className="page-loading">
          <div>Loading events...</div>
        </div>
      </div>
    );
  }

  const organizationId = user?.organizationId;

  return (
    <div className="chat-layout-page">
      <ChatLayout
        events={events}
        organizationId={organizationId}
      />
    </div>
  );
};

export default NewChatLayout;