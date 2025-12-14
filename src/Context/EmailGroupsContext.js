import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import * as EmailGroupsAPI from '../Services/EmailGroups';

const EmailGroupsContext = createContext();

export const EmailGroupsProvider = ({ children }) => {
  const { user } = useUser();
  const [emailGroups, setEmailGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all email groups for the given organization
   */
  const fetchEmailGroups = useCallback(async (organizationId) => {
    setLoading(true);
    setError(null);
    
    try {
      const groups = await EmailGroupsAPI.getEmailGroups(organizationId);
      setEmailGroups(groups || []);
      return groups;
    } catch (err) {
      console.error('Error fetching email groups:', err);
      setError(err.message);
      setEmailGroups([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new email group
   */
  const addGroup = useCallback(async (groupData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Normalize members and add userId from context
      const groupDataWithUser = {
        ...groupData,
        members: (groupData.members || []).map(email => 
          typeof email === 'string' ? email.trim().toLowerCase() : email
        ),
        userId: user?.userId
      };
      
      const newGroup = await EmailGroupsAPI.createEmailGroup(groupDataWithUser);
      setEmailGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (err) {
      console.error('Error creating email group:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  /**
   * Update an existing email group
   */
  const updateGroup = useCallback(async (groupId, updatedData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Normalize members
      const normalizedData = {
        ...updatedData,
        members: (updatedData.members || []).map(email => 
          typeof email === 'string' ? email.trim().toLowerCase() : email
        )
      };
      
      await EmailGroupsAPI.updateEmailGroup(groupId, normalizedData);
      
      // Update local state
      setEmailGroups(prev =>
        prev.map((group) =>
          group.id === groupId ? { ...group, ...normalizedData } : group
        )
      );
    } catch (err) {
      console.error('Error updating email group:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an email group
   */
  const deleteGroup = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    
    try {
      await EmailGroupsAPI.deleteEmailGroup(groupId);
      
      // Update local state
      setEmailGroups(prev => prev.filter((group) => group.id !== groupId));
    } catch (err) {
      console.error('Error deleting email group:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a single group by ID
   */
  const getGroupById = useCallback((groupId) => {
    return emailGroups.find((group) => group.id === groupId);
  }, [emailGroups]);

  /**
   * Resolve email recipients (groups + individual emails)
   */
  const resolveRecipients = useCallback(async (groupIds, individualEmails, organizationId) => {
    setError(null);
    
    try {
      // Normalize individual emails
      const normalizedEmails = (individualEmails || []).map(email =>
        typeof email === 'string' ? email.trim().toLowerCase() : email
      );
      
      const result = await EmailGroupsAPI.resolveEmailRecipients({
        groupIds: groupIds || [],
        individualEmails: normalizedEmails,
        organizationId: organizationId
      });
      
      return result;
    } catch (err) {
      console.error('Error resolving recipients:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Send email with resolved recipients
   */
  const sendEmail = useCallback(async (emailData) => {
    setError(null);
    
    try {
      const result = await EmailGroupsAPI.sendEmail(emailData);
      return result;
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  return (
    <EmailGroupsContext.Provider
      value={{
        emailGroups,
        setEmailGroups,
        loading,
        error,
        fetchEmailGroups,
        addGroup,
        updateGroup,
        deleteGroup,
        getGroupById,
        resolveRecipients,
        sendEmail,
      }}
    >
      {children}
    </EmailGroupsContext.Provider>
  );
};

export const useEmailGroups = () => {
  const context = useContext(EmailGroupsContext);
  if (!context) {
    throw new Error('useEmailGroups must be used within EmailGroupsProvider');
  }
  return context;
};
