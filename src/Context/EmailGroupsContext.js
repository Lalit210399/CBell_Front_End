import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import * as EmailGroupsAPI from '../Services/EmailGroups';

const EmailGroupsContext = createContext();

const normalizeGroupsList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload) return [];

  // Common API wrapper shapes
  if (Array.isArray(payload.emailGroups)) return payload.emailGroups;
  if (Array.isArray(payload.groups)) return payload.groups;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.value)) return payload.value;

  return [];
};

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
      const normalized = normalizeGroupsList(groups);
      setEmailGroups(normalized);
      return normalized;
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

      // Ensure emails exist in common/master list so backend can convert → memberEmailIds.
      if (groupDataWithUser.organizationId && groupDataWithUser.members.length > 0) {
        await Promise.all(
          groupDataWithUser.members
            .filter((e) => typeof e === 'string' && e.length > 0)
            .map((email) =>
              EmailGroupsAPI.addCommonEmail({
                email,
                organizationId: groupDataWithUser.organizationId,
              }).catch(() => null)
            )
        );
      }
      
      const newGroup = await EmailGroupsAPI.createEmailGroup(groupDataWithUser);

      // If backend still returns the group but doesn't populate memberEmailIds yet,
      // do a best-effort update pass (some implementations populate IDs on update).
      if (
        newGroup?.id &&
        Array.isArray(groupDataWithUser.members) &&
        groupDataWithUser.members.length > 0 &&
        (newGroup.memberEmailIds?.length ?? 0) === 0 &&
        groupDataWithUser.organizationId
      ) {
        try {
          await EmailGroupsAPI.updateEmailGroup(newGroup.id, {
            name: groupDataWithUser.name,
            memberEmails: groupDataWithUser.members,
            organizationId: groupDataWithUser.organizationId,
          });
        } catch (e) {
          // Best-effort only; ignore and continue.
          console.warn('Post-create member resolution failed:', e?.message || e);
        }
      }

      // Prefer a re-fetch after create so we always get latest memberEmailIds.
      if (groupDataWithUser.organizationId) {
        const groups = await EmailGroupsAPI.getEmailGroups(groupDataWithUser.organizationId);
        const normalized = normalizeGroupsList(groups);
        setEmailGroups(normalized);
        return normalized.find(g => g.id === newGroup?.id) || newGroup;
      }

      if (newGroup) {
        setEmailGroups(prev => [...prev, newGroup]);
        return newGroup;
      }

      return null;
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

      // Ensure emails exist in common/master list before updating.
      if (normalizedData.organizationId && (normalizedData.members || []).length > 0) {
        await Promise.all(
          (normalizedData.members || [])
            .filter((e) => typeof e === 'string' && e.length > 0)
            .map((email) =>
              EmailGroupsAPI.addCommonEmail({
                email,
                organizationId: normalizedData.organizationId,
              }).catch(() => null)
            )
        );
      }
      
      const updatedGroup = await EmailGroupsAPI.updateEmailGroup(groupId, normalizedData);

      // Best case: backend returns the updated group (with memberEmailIds).
      if (updatedGroup) {
        setEmailGroups(prev =>
          prev.map((group) => (group.id === groupId ? updatedGroup : group))
        );
        return updatedGroup;
      }

      // If backend returns 204/no body, re-fetch to get the new memberEmailIds.
      if (normalizedData.organizationId) {
        const groups = await EmailGroupsAPI.getEmailGroups(normalizedData.organizationId);
        const normalizedGroups = normalizeGroupsList(groups);
        setEmailGroups(normalizedGroups);
        return normalizedGroups.find(g => g.id === groupId) || null;
      }

      // As a last resort, only update safe fields locally (avoid storing email arrays globally).
      setEmailGroups(prev =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                ...(typeof normalizedData.name === 'string' ? { name: normalizedData.name } : {}),
              }
            : group
        )
      );

      return null;
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
      return true;
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

  // Auto-load email groups when provider mounts or when user's organization changes.
  // This ensures email groups are available (e.g. in the EmailForm/GroupSelector)
  // even if the user hasn't visited Settings yet.
  useEffect(() => {
    // Call fetchEmailGroups with the user's organizationId (may be undefined).
    // Catch errors to avoid unhandled promise rejections during mount.
    fetchEmailGroups(user?.organizationId).catch((err) => {
      // Intentionally swallow here — error is tracked in state via setError.
      console.warn('Auto-fetch email groups failed:', err.message || err);
    });
  }, [user?.organizationId, fetchEmailGroups]);

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
