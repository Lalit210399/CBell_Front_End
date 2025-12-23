import React from 'react';
import { User, Building2, Shield, Hash } from 'lucide-react';
import { useUser } from '../../../Context/UserContext';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { user } = useUser();

  // Generate user initials
  const getUserInitials = (firstName = "", lastName = "") => {
    const firstInitial = (firstName[0] || "").toUpperCase();
    const lastInitial = (lastName[0] || "").toUpperCase();
    return (firstInitial + lastInitial) || "U";
  };

  const userInitials = getUserInitials(user?.firstName, user?.lastName);

  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="profile-settings">
      <div className="ps-header">
        <h2 className="ps-title">Profile</h2>
        <p className="ps-subtitle">
          View your account information and details
        </p>
      </div>

      <div className="ps-content">
        {/* Profile Card */}
        <div className="ps-card ps-profile-card">
          <div className="ps-avatar-section">
            <div className="ps-avatar-large">
              {userInitials}
            </div>
            <div className="ps-status-indicator"></div>
          </div>
          <div className="ps-profile-info">
            <h3 className="ps-profile-name">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="ps-profile-email">{user?.email}</p>
            <div className="ps-profile-badges">
              <div className="ps-profile-role">
                <Shield size={14} />
                <span>{user?.roles?.[0]?.name || user?.roles?.[0]?.displayName || 'User'}</span>
              </div>
              <div className="ps-profile-org">
                <Building2 size={14} />
                <span>{user?.organization?.code || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="ps-info-grid">
          {/* Personal Information */}
          <div className="ps-card">
            <div className="ps-card-header">
              <User className="ps-card-icon" size={20} />
              <h3 className="ps-card-title">Personal Information</h3>
            </div>
            <div className="ps-card-body">
              <div className="ps-info-item">
                <span className="ps-info-label">First Name</span>
                <span className="ps-info-value">{user?.firstName || 'N/A'}</span>
              </div>
              <div className="ps-info-item">
                <span className="ps-info-label">Last Name</span>
                <span className="ps-info-value">{user?.lastName || 'N/A'}</span>
              </div>
              <div className="ps-info-item">
                <span className="ps-info-label">Email Address</span>
                <span className="ps-info-value">{user?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          <div className="ps-card">
            <div className="ps-card-header">
              <Building2 className="ps-card-icon" size={20} />
              <h3 className="ps-card-title">Organization</h3>
            </div>
            <div className="ps-card-body">
              <div className="ps-info-item">
                <span className="ps-info-label">Organization Name</span>
                <span className="ps-info-value">{user?.organization?.name || 'N/A'}</span>
              </div>
              <div className="ps-info-item">
                <span className="ps-info-label">Organization Code</span>
                <span className="ps-info-value">{user?.organization?.code || 'N/A'}</span>
              </div>
              {/* {user?.organizationId && (
                <div className="ps-info-item">
                  <span className="ps-info-label">Organization ID</span>
                  <span className="ps-info-value">{user?.organizationId}</span>
                </div>
              )} */}
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="ps-card">
            <div className="ps-card-header">
              <Shield className="ps-card-icon" size={20} />
              <h3 className="ps-card-title">Role & Access</h3>
            </div>
            <div className="ps-card-body">
              <div className="ps-info-item">
                <span className="ps-info-label">Role</span>
                <span className="ps-info-value">
                  {user?.roles?.[0]?.name || user?.roles?.[0]?.displayName || 'User'}
                </span>
              </div>
              {user?.roles?.[0]?.description && (
                <div className="ps-info-item">
                  <span className="ps-info-label">Description</span>
                  <span className="ps-info-value">{user?.roles[0].description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Details */}
          {(user?.id || user?.createdAt) && (
            <div className="ps-card">
              <div className="ps-card-header">
                <Hash className="ps-card-icon" size={20} />
                <h3 className="ps-card-title">Account Details</h3>
              </div>
              <div className="ps-card-body">
                {user?.id && (
                  <div className="ps-info-item">
                    <span className="ps-info-label">User ID</span>
                    <span className="ps-info-value">{user.id}</span>
                  </div>
                )}
                {user?.createdAt && (
                  <div className="ps-info-item">
                    <span className="ps-info-label">Member Since</span>
                    <span className="ps-info-value">{formatDate(user.createdAt)}</span>
                  </div>
                )}
                {user?.updatedAt && (
                  <div className="ps-info-item">
                    <span className="ps-info-label">Last Updated</span>
                    <span className="ps-info-value">{formatDate(user.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
