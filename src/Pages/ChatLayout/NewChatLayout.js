import React, { useState, useEffect } from 'react';
import ChatLayout from '../../CommonComponents/TaskChatLayout/ChatLayout';
import { useUser } from '../../Context/UserContext';

const NewPage = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'apis/dashboard/tasks?orgid=681460dcb8327b2e3417d8b1&filter=all',
          {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': '1',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []); // Use .tasks from API response
        } else {
          console.error('Failed to fetch tasks');
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserTasks();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="new-page-container">
      <div className="page-header">
        <h1>Task Conversations</h1>
        {/* <p>Chat with your team about specific tasks</p> */}
      </div>
      <ChatLayout
        tasks={tasks}
        eventId="your-event-id" // Pass the relevant event ID
      />
    </div>
  );
};

export default NewPage;
