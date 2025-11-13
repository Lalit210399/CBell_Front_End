//NEwChatLayout
import React, { useState, useEffect } from 'react';
import ChatLayout from '../../CommonComponents/ChatLayout/ChatLayout';
import { useUser } from '../../Context/UserContext';
import { fetchWithRefresh } from '../../Context/RefereshToken';
import "./NewChatLayout.css";

const NewChatLayout = () => {
  const { user, selectedOrganizationId, isViewingOwnOrganization, scopeChangeTrigger } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      // Use global selectedOrganizationId instead of hardcoded org ID
      const organizationId = selectedOrganizationId || user?.organizationId;

      if (!organizationId) {
        console.error("No organization selected");
        setLoading(false);
        return;
      }

      // Determine if we need to include X-Context-Organization header
      const isViewingOwnOrg = organizationId === user?.organizationId;
      
      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      };

      // Only add X-Context-Organization header when viewing a different organization
      if (!isViewingOwnOrg) {
        headers["X-Context-Organization"] = organizationId;
      }

      try {
        setLoading(true);
        const response = await fetchWithRefresh(
          `/apis/event/hierarchy/${organizationId}?userId=${user?.userId}`,
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

    if (user?.userId && selectedOrganizationId) {
      fetchEvents();
    }
  }, [user?.userId, user?.organizationId, selectedOrganizationId, scopeChangeTrigger]);

  if (loading) {
    return (
      <div className="page-loading">
        <div>Loading events...</div>
      </div>
    );
  }

  // Use the selected organization ID
  const organizationId = selectedOrganizationId || user?.organizationId;

  return (
    <div className="new-page-container">
      <div className="page-header">
        {/* <h1>Task Conversations</h1> */} 
        {/* <p>Chat with your team about specific tasks</p> */}
      </div>
      <ChatLayout
        events={events}
        organizationId={organizationId} // Pass dynamic organization ID for task API calls
      />
    </div>
  );
};

export default NewChatLayout;
