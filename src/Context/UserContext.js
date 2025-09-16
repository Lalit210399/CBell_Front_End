import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simulate restoring session from localStorage
    const storedUser = localStorage.getItem("user");
    const storedPermissions = localStorage.getItem("permissions");
    const storedScope = localStorage.getItem("scope");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedPermissions) setPermissions(JSON.parse(storedPermissions));
    if (storedScope) setScope(JSON.parse(storedScope));

    setLoading(false); // ✅ auth state resolved
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, permissions, setPermissions, scope, setScope, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
