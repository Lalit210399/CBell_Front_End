import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usersApi, rolesApi, organizationsApi, authApi } from '../../Services/api';
import CreateUserModal from './CreateUserModal';
import AssignRoleModal from './AssignRoleModal';
import './UsersManagement.css';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const data = await organizationsApi.getAll();
      setOrganizations(Array.isArray(data) ? data : data.organizations || []);
    } catch (error) {
      console.error('Failed to fetch organizations', error);
    }
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const handleUserCreated = () => {
    setShowCreateModal(false);
    fetchUsers();
  };

  const handleAssignRole = (user) => {
    setSelectedUser(user);
    setShowAssignRoleModal(true);
  };

  const handleRoleAssigned = () => {
    setShowAssignRoleModal(false);
    setSelectedUser(null);
    fetchUsers();
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = !filterOrg || user.organizationCode === filterOrg;
    return matchesSearch && matchesOrg;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="users-management">
      <div className="page-header">
        <h2>Users Management</h2>
        <button className="btn-primary" onClick={handleCreateUser}>
          + Create User
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
            className="filter-select"
          >
            <option value="">All Organizations</option>
            {organizations.map(org => (
              <option key={org._id || org.id} value={org.code}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-state">Loading users...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Organization</th>
                  <th>Parent Level</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">No users found</td>
                  </tr>
                ) : (
                  currentUsers.map(user => (
                    <tr key={user._id || user.id}>
                      <td>{user.email}</td>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.organizationCode || 'N/A'}</td>
                      <td>
                        <span className="badge badge-info">
                          {user.parentLevel || 0}
                        </span>
                      </td>
                      <td>
                        <div className="roles-list">
                          {user.roles?.length > 0 ? (
                            user.roles.map((role, idx) => (
                              <span key={idx} className="badge badge-primary">
                                {role.name || role}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">No roles</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-action"
                          onClick={() => handleAssignRole(user)}
                        >
                          Assign Role
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn-page"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn-page"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleUserCreated}
          organizations={organizations}
        />
      )}

      {showAssignRoleModal && selectedUser && (
        <AssignRoleModal
          user={selectedUser}
          onClose={() => {
            setShowAssignRoleModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleRoleAssigned}
        />
      )}
    </div>
  );
};

export default UsersManagement;
