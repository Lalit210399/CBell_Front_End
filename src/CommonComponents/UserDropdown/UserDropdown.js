import React, { useState, useMemo } from "react";

const UserDropdown = ({
  isOpen,
  onClose,
  users = [],
  selectedUserIds = [],
  onUserSelectionChange,
  placeholder = "Search by name, email, org, or role...",
  className = "",
  maxHeight = "200px"
}) => {
  const [userSearch, setUserSearch] = useState("");

  const getUserInitials = (firstName = "", lastName = "") => {
    const a = (firstName[0] || "").toUpperCase();
    const b = (lastName[0] || "").toUpperCase();
    return (a + b) || "?";
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.organizationCode || "").toLowerCase().includes(q) ||
      (u.roles?.[0]?.name || "").toLowerCase().includes(q) ||
      (u.roles?.[0]?.displayName || "").toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const isUserSelected = (id) => selectedUserIds.includes(id);

  const toggleUserSelection = (id) => {
    const next = isUserSelected(id)
      ? selectedUserIds.filter((x) => x !== id)
      : [...selectedUserIds, id];
    onUserSelectionChange(next);
  };

  if (!isOpen) return null;

  return (
    <div className={`inline-dropdown-new ${className}`}>
      <div className="user-dropdown-new">
        <div className="user-dropdown-header-new">
          <input
            type="text"
            className="user-search-new"
            placeholder={placeholder}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <button
            className="user-done-new"
            onClick={onClose}
          >
            Done
          </button>
        </div>
        <div className="user-dropdown-list-new" style={{ maxHeight }}>
          {filteredUsers.length === 0 ? (
            <div className="user-empty-new">No users found</div>
          ) : (
            filteredUsers.map((u) => (
              <label
                key={u.id}
                className={`user-item-new ${isUserSelected(u.id) ? "selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isUserSelected(u.id)}
                  onChange={() => toggleUserSelection(u.id)}
                />
                <span className="user-avatar-new">
                  {getUserInitials(u.firstName, u.lastName)}
                </span>
                <div className="user-info-new">
                  <div className="user-name-new">{`${u.firstName || "User"} ${u.lastName || ""}`}</div>
                  <div className="user-details-new">
                    <span className="user-role-new">{u.roles?.[0]?.name || u.roles?.[0]?.displayName || "No role"}</span>
                    {u.organizationCode && (
                      <span className="user-org-new">• {u.organizationCode}</span>
                    )}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDropdown;
