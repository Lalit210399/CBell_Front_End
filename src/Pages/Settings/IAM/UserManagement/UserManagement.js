// Pages/Settings/IAM/UserManagement/UserManagement.js
import React, { useState, useEffect, useContext } from 'react';
import { isValidElementType } from 'react-is';
import { Users, Search, UserCog } from 'lucide-react';
import { useIAM } from '../../../../Context/IAMContext';
import { users as dummyUsers, roles as dummyRoles } from '../dummyData';
import UserRoleAssignment from '../../../../CommonComponents/IAM/UserRoleAssignment/UserRoleAssignment';
import MessageStrip from '../../../../CommonComponents/MessageStrip/MessageStrip';
import PageSkeleton from '../../../../CommonComponents/SkeletonLoading/PageSkeleton';
import { UserContext } from '../../../../Context/UserContext';
import './UserManagement.css';

const UserManagement = () => {
  const { userInfo } = useContext(UserContext);
  const { roles, loading: iamLoading } = useIAM();

  // Safety fallbacks for imports that could be invalid React element types at runtime.
  // Use `isValidElementType` from `react-is` to ensure the value can be rendered as a component.
  const UsersIcon = isValidElementType(Users) ? Users : () => <span className="um-header-icon-fallback" />;
  const SearchIcon = isValidElementType(Search) ? Search : () => null;
  const UserCogIcon = isValidElementType(UserCog) ? UserCog : () => null;
  const MessageStripSafe = isValidElementType(MessageStrip) ? MessageStrip : (({ text }) => <div className="message-strip-fallback">{text}</div>);
  const PageSkeletonSafe = isValidElementType(PageSkeleton) ? PageSkeleton : (() => <div className="page-skeleton-fallback">Loading...</div>);
  const UserRoleAssignmentSafe = isValidElementType(UserRoleAssignment) ? UserRoleAssignment : (() => null);
  // Diagnostics: log imported values and resolved safe components
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('UserManagement imports:', { Users, Search, UserCog, MessageStrip, PageSkeleton, UserRoleAssignment });
    // eslint-disable-next-line no-console
    console.log('Resolved safe components:', { UsersIcon, SearchIcon, UserCogIcon, MessageStripSafe, PageSkeletonSafe, UserRoleAssignmentSafe });
  }
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Use shared dummy data instead of API calls
  useEffect(() => {
    setUsers(dummyUsers);
    setLoading(false);
  }, [userInfo]);

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(lowerSearch) ||
      user.lastName?.toLowerCase().includes(lowerSearch) ||
      user.email?.toLowerCase().includes(lowerSearch) ||
      user.userName?.toLowerCase().includes(lowerSearch)
    );
  });

  // Get role names for user
  const effectiveRoles = (roles && roles.length > 0) ? roles : dummyRoles;

  const getUserRoleNames = (user) => {
    if (!user.roles || user.roles.length === 0) return 'No roles assigned';

    const roleNames = user.roles
      .map(userRole => {
        const role = effectiveRoles.find(r => r.id === userRole.roleId);
        return role ? role.displayName : null;
      })
      .filter(Boolean);

    return roleNames.length > 0 ? roleNames.join(', ') : 'No roles assigned';
  };

  // Handle manage roles click
  const handleManageRoles = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  // Handle role assignment
  // Local-only role assignment (no API calls)
  const handleAssignRoles = async (userId, roleIds) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, roles: (roleIds || []).map(rid => ({ roleId: rid })) };
    }));

    setShowRoleModal(false);
    setSelectedUser(null);
    showMessage('success', 'User roles updated (local only)');
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Close message
  const closeMessage = () => {
    setMessage({ type: '', text: '' });
  };

  if (loading || iamLoading) {
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
        <div className="um-stats">
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
              {searchTerm ? 'No users found matching your search' : 'No users available'}
            </p>
          </div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Roles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="um-user-name">
                      <div className="um-user-avatar">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <span>{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.userName}</td>
                  <td>
                    <span className="um-roles-text">{getUserRoleNames(user)}</span>
                  </td>
                  <td>
                    <button
                      className="um-action-btn um-btn-manage"
                      onClick={() => handleManageRoles(user)}
                      title="Manage Roles"
                    >
                      <UserCogIcon size={16} />
                      Manage Roles
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
        <div className="um-modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowRoleModal(false);
            setSelectedUser(null);
          }
        }}>
          <UserRoleAssignmentSafe
            user={selectedUser}
            availableRoles={effectiveRoles}
            currentRoleIds={selectedUser.roles?.map(r => r.roleId) || []}
            onAssignRoles={handleAssignRoles}
            onClose={() => {
              setShowRoleModal(false);
              setSelectedUser(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UserManagement;
