import React from 'react';
import './Modal.css';
import './RolesManagement.css';

const ViewPermissionsModal = ({ role, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Permissions for {role.displayName || role.name}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="role-details">
            <p><strong>Role Name:</strong> {role.name}</p>
            <p><strong>Display Name:</strong> {role.displayName}</p>
            {role.description && (
              <p><strong>Description:</strong> {role.description}</p>
            )}
          </div>

          <div className="permissions-view">
            <h4>Permissions ({role.permissions?.length || 0})</h4>
            
            {!role.permissions || role.permissions.length === 0 ? (
              <p className="text-muted">No permissions assigned</p>
            ) : (
              <div className="permissions-grid">
                {role.permissions.map((perm, index) => (
                  <div key={index} className="permission-card">
                    <div className="permission-card-header">
                      <div>
                        <strong>{perm.moduleName || perm.moduleId}</strong>
                        <span className="separator">→</span>
                        <span>{perm.featureName || perm.featureId}</span>
                      </div>
                    </div>
                    <div className="permission-types">
                      {perm.permissionFlags?.map((flag, idx) => (
                        flag.isGranted && (
                          <span key={idx} className="badge badge-success">
                            {flag.permissionTypeName || flag.permissionTypeId}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPermissionsModal;
