import React, { createContext, useContext, useState, useEffect } from 'react';

const EmailGroupsContext = createContext();

export const EmailGroupsProvider = ({ children }) => {
  const [emailGroups, setEmailGroups] = useState([]);

  // Load email groups from localStorage on mount
  useEffect(() => {
    const storedGroups = localStorage.getItem('emailGroups');
    if (storedGroups) {
      try {
        setEmailGroups(JSON.parse(storedGroups));
      } catch (error) {
        console.error('Error loading email groups:', error);
        setEmailGroups([]);
      }
    }
  }, []);

  // Save email groups to localStorage whenever they change
  useEffect(() => {
    if (emailGroups.length > 0) {
      localStorage.setItem('emailGroups', JSON.stringify(emailGroups));
    }
  }, [emailGroups]);

  const addGroup = (group) => {
    const newGroup = {
      id: Date.now(),
      name: group.name,
      members: group.members,
      createdAt: new Date().toISOString(),
    };
    setEmailGroups([...emailGroups, newGroup]);
    return newGroup;
  };

  const updateGroup = (groupId, updatedData) => {
    setEmailGroups(
      emailGroups.map((group) =>
        group.id === groupId ? { ...group, ...updatedData } : group
      )
    );
  };

  const deleteGroup = (groupId) => {
    setEmailGroups(emailGroups.filter((group) => group.id !== groupId));
  };

  const getGroupById = (groupId) => {
    return emailGroups.find((group) => group.id === groupId);
  };

  return (
    <EmailGroupsContext.Provider
      value={{
        emailGroups,
        setEmailGroups,
        addGroup,
        updateGroup,
        deleteGroup,
        getGroupById,
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
