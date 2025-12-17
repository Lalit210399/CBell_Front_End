import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MultiSelectDropdown from '../../CommonComponents/Dropdown/MultiSelectDropdown';
import { useAdmin } from './AdminContext';
import './Admin.css';

const AssignRoles = () => {
  const { id } = useParams();
  const { users, roles, updateUserRoles, loading, error } = useAdmin();
  const [selectedRoles, setSelectedRoles] = useState([]);
  const navigate = useNavigate();

  const user = users.find(u => u.id === parseInt(id));

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles);
    }
  }, [user]);

  const handleRoleChange = (role) => {
    if (role.clearAll) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(prev =>
        prev.includes(role.value)
          ? prev.filter(r => r !== role.value)
          : [...prev, role.value]
      );
    }
  };

  const handleSave = () => {
    updateUserRoles(id, selectedRoles);
    navigate('/admin/users');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!user) return <div className="error">User not found</div>;

  const roleOptions = roles.map(role => ({
    value: role.id,
    label: role.displayName,
  }));

  return (
    <div className="assign-roles">
      <h2>Assign Roles to {user.name}</h2>
      <div className="current-roles">
        <h3>Current Roles:</h3>
        <ul>
          {user.roles.map(roleId => {
            const role = roles.find(r => r.id === roleId);
            return <li key={roleId}>{role ? role.displayName : roleId}</li>;
          })}
        </ul>
      </div>
      <div className="role-selection">
        <label>Select Roles:</label>
        <MultiSelectDropdown
          options={roleOptions}
          selectedValues={selectedRoles}
          onSelect={handleRoleChange}
          placeholder="Select roles"
        />
      </div>
      <div className="actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={() => navigate('/admin/users')}>Cancel</button>
      </div>
    </div>
  );
};

export default AssignRoles;
