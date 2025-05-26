// Context/UserContext.js

import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedPermissions = localStorage.getItem("permissions");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedPermissions) {
      const parsedPermissions = JSON.parse(savedPermissions);
      setPermissions(parsedPermissions);
      console.log("Loaded permissions:", parsedPermissions);
    }
  }, []);

  const hasPermission = (module, managementArea, action) => {
    try {
      return permissions?.[module]?.[managementArea]?.includes(action) ?? false;
    } catch {
      return false;
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, permissions, setPermissions, hasPermission }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
