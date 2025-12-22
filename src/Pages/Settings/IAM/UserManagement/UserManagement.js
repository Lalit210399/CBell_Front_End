// Pages/Settings/IAM/UserManagement/UserManagement.js
import React, { useState, useEffect, useContext } from "react";
import { isValidElementType } from "react-is";
import { Users, Search, UserPlus, Pencil } from "lucide-react";
import { useIAM } from "../../../../Context/IAMContext";
import { users as dummyUsers, roles as dummyRoles } from "../dummyData";
import UserRoleAssignment from "../../../../CommonComponents/IAM/UserRoleAssignment/UserRoleAssignment";
import CreateUserModal from "./CreateUserModal";
import MessageStrip from "../../../../CommonComponents/MessageStrip/MessageStrip";
import PageSkeleton from "../../../../CommonComponents/SkeletonLoading/PageSkeleton";
import { UserContext } from "../../../../Context/UserContext";
import "./UserManagement.css";

const UserManagement = () => {
  const { user, selectedOrganizationId } = useContext(UserContext);
  // console.log("👤 User from Context:", user);
  // console.log("🏢 Selected Organization ID:", selectedOrganizationId);
  
  const {
    roles,
    fetchRoles,
    registerNewUser,
    fetchHierarchyUsers,
    assignRoles,
  } = useIAM();

  // Safety fallbacks for imports that could be invalid React element types at runtime.
  // Use `isValidElementType` from `react-is` to ensure the value can be rendered as a component.
  const UsersIcon = isValidElementType(Users)
    ? Users
    : () => <span className="um-header-icon-fallback" />;
  const SearchIcon = isValidElementType(Search) ? Search : () => null;
  const PencilIcon = isValidElementType(Pencil) ? Pencil : () => null;
  const UserPlusIcon = isValidElementType(UserPlus) ? UserPlus : () => null;
  const MessageStripSafe = isValidElementType(MessageStrip)
    ? MessageStrip
    : ({ text }) => <div className="message-strip-fallback">{text}</div>;
  const PageSkeletonSafe = isValidElementType(PageSkeleton)
    ? PageSkeleton
    : () => <div className="page-skeleton-fallback">Loading...</div>;
  const UserRoleAssignmentSafe = isValidElementType(UserRoleAssignment)
    ? UserRoleAssignment
    : () => null;

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch users and roles on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch roles
        if (!roles || roles.length === 0) {
          await fetchRoles();
        }

        // Get organization ID (prefer selectedOrganizationId, fallback to user.organizationId, then localStorage)
        const orgId = selectedOrganizationId || 
                      user?.organizationId || 
                      localStorage.getItem("dashboard-selected-organization");

        // Fetch users from hierarchy API
        if (orgId) {
          // console.log("🔄 Fetching users for organization:", orgId);
          const fetchedUsers = await fetchHierarchyUsers(orgId);
          // console.log("✅ Users fetched successfully:", fetchedUsers);
          setUsers(fetchedUsers);
        } else {
          console.warn("⚠️ No organizationId found. User:", user, "SelectedOrgId:", selectedOrganizationId);
          showMessage(
            "warning",
            "Organization ID not found. Using dummy data."
          );
          setUsers(dummyUsers);
        }
      } catch (error) {
        console.error("❌ Failed to load data:", error);
        showMessage("error", `Failed to load users: ${error.message}`);
        // Fallback to dummy data
        setUsers(dummyUsers);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, selectedOrganizationId, roles, fetchHierarchyUsers, fetchRoles]);

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(lowerSearch) ||
      user.lastName?.toLowerCase().includes(lowerSearch) ||
      user.email?.toLowerCase().includes(lowerSearch) ||
      user.userName?.toLowerCase().includes(lowerSearch)
    );
  });

  // Get role names for user
  const getUserRoleNames = (user) => {
    // API response already includes roles array with displayName
    if (!user.roles || user.roles.length === 0) return "No roles assigned";

    const roleNames = user.roles
      .map((role) => role.displayName || role.name)
      .filter(Boolean);

    return roleNames.length > 0 ? roleNames.join(", ") : "No roles assigned";
  };

  // Handle manage roles click
  const handleManageRoles = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  // Handle role assignment
  const handleAssignRoles = async (userId, roleIds) => {
    try {
      // Call API to assign roles
      await assignRoles(userId, roleIds);

      // Refetch users to get updated role information
      const orgId = selectedOrganizationId || 
                    user?.organizationId || 
                    localStorage.getItem("dashboard-selected-organization");
      
      if (orgId) {
        const fetchedUsers = await fetchHierarchyUsers(orgId);
        setUsers(fetchedUsers);
      }

      setShowRoleModal(false);
      setSelectedUser(null);
      showMessage("success", "User roles updated successfully");
    } catch (error) {
      showMessage("error", error.message || "Failed to assign roles");
    }
  };

  // Handle user creation
  const handleCreateUser = async (userData) => {
    try {
      await registerNewUser(userData);
      
      // Refetch users to get the complete list
      const orgId = selectedOrganizationId || 
                    user?.organizationId || 
                    localStorage.getItem("dashboard-selected-organization");
      
      if (orgId) {
        const fetchedUsers = await fetchHierarchyUsers(orgId);
        setUsers(fetchedUsers);
      }
      
      showMessage("success", "User created successfully");
      setShowCreateModal(false);
    } catch (error) {
      showMessage("error", error.message || "Failed to create user");
      throw error;
    }
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  // Close message
  const closeMessage = () => {
    setMessage({ type: "", text: "" });
  };

  if (loading) {
    return (
      <div className="um-container">
        <PageSkeletonSafe />
      </div>
    );
  }

  return (
    <div className="um-container">
      {/* Header */}
      <div className="um-header">
        <div className="um-header-content">
          <UsersIcon size={50} className="um-header-icon" />
          <div>
            <h1 className="um-title">User Management</h1>
            <p className="um-subtitle">Manage user roles and permissions</p>
          </div>
        </div>
      </div>

      {/* Message Strip */}
      {message.text && (
        <MessageStripSafe
          type={message.type}
          text={message.text}
          onClose={closeMessage}
        />
      )}

      {/* Toolbar */}
      <div className="um-toolbar">
        <div className="um-search">
          <SearchIcon size={18} className="um-search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="um-search-input"
          />
        </div>
        <div className="um-toolbar-actions">
          <button
            className="um-btn um-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlusIcon size={18} />
            Create User
          </button>
          <span className="um-stat-item">
            Total Users: <strong>{users.length}</strong>
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="um-table-container">
        {filteredUsers.length === 0 ? (
          <div className="um-empty-state">
            <UsersIcon size={64} className="um-empty-icon" />
            <p className="um-empty-text">
              {searchTerm
                ? "No users found matching your search"
                : "No users available"}
            </p>
          </div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Org Code</th>
                <th>Roles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="um-user-name">
                      <div className="um-user-avatar">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.organizationCode}</td>
                  <td>
                    <span className="um-roles-text">
                      {getUserRoleNames(user)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="um-action-btn um-btn-icon"
                      onClick={() => handleManageRoles(user)}
                      title="Manage Roles"
                    >
                      <PencilIcon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div
          className="um-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRoleModal(false);
              setSelectedUser(null);
            }
          }}
        >
          <UserRoleAssignmentSafe
            user={selectedUser}
            availableRoles={roles && roles.length > 0 ? roles : dummyRoles}
            currentRoleIds={selectedUser.roleIds || []}
            onAssignRoles={handleAssignRoles}
            onClose={() => {
              setShowRoleModal(false);
              setSelectedUser(null);
            }}
          />
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
};

export default UserManagement;
