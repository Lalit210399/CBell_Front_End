// Shared dummy data for IAM pages
// Based on models and examples in src/IAM.md

export const permissionTypes = [
  { id: 'perm-read', name: 'Read', displayName: 'Read', bitPosition: 0, isActive: true },
  { id: 'perm-create', name: 'Create', displayName: 'Create', bitPosition: 1, isActive: true },
  { id: 'perm-update', name: 'Update', displayName: 'Update', bitPosition: 2, isActive: true },
  { id: 'perm-delete', name: 'Delete', displayName: 'Delete', bitPosition: 3, isActive: true },
  { id: 'perm-assign', name: 'Assign', displayName: 'Assign', bitPosition: 4, isActive: true },
];

export const modules = [
  { id: 'mod-admin', name: 'administration', displayName: 'Administration', description: 'Administration module', isActive: true },
  { id: 'mod-tasks', name: 'task-management', displayName: 'Task Management', description: 'Task-related features', isActive: true },
  { id: 'mod-events', name: 'events', displayName: 'Events', description: 'Event scheduling and management', isActive: true },
];

export const features = [
  { id: 'feat-users', moduleId: 'mod-admin', name: 'users', displayName: 'Users', description: 'User management', isActive: true },
  { id: 'feat-roles', moduleId: 'mod-admin', name: 'roles', displayName: 'Roles', description: 'Role management', isActive: true },
  { id: 'feat-tasks', moduleId: 'mod-tasks', name: 'tasks', displayName: 'Tasks', description: 'Task CRUD', isActive: true },
  { id: 'feat-assign', moduleId: 'mod-tasks', name: 'assign-task', displayName: 'Assign Task', description: 'Assign tasks to users', isActive: true },
  { id: 'feat-events', moduleId: 'mod-events', name: 'events', displayName: 'Events', description: 'Event CRUD', isActive: true },
];

// permissionValue is bitwise flags (see IAM.md). Example: Read(1) + Update(4) = 5
export const roles = [
  {
    id: 'role-admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full access to the system',
    permissions: [
      { moduleId: 'mod-admin', featureId: 'feat-users', permissionValue: 31 },
      { moduleId: 'mod-admin', featureId: 'feat-roles', permissionValue: 31 },
    ],
    isActive: true,
  },
  {
    id: 'role-editor',
    name: 'editor',
    displayName: 'Editor',
    description: 'Can create and edit content',
    permissions: [
      { moduleId: 'mod-tasks', featureId: 'feat-tasks', permissionValue: 7 }, // Read+Create+Update
    ],
    isActive: true,
  },
  {
    id: 'role-viewer',
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access',
    permissions: [
      { moduleId: 'mod-tasks', featureId: 'feat-tasks', permissionValue: 1 },
      { moduleId: 'mod-events', featureId: 'feat-events', permissionValue: 1 },
    ],
    isActive: true,
  },
  // Additional roles from API
  {
    id: '682368bc134f67223e186e4a',
    name: 'Admin',
    displayName: 'Administrator',
    description: 'Full access to all features',
    permissions: [
      { moduleId: '6823660ba427aa892ec05fdc', featureId: '6823678f134f67223e186e49', permissionValue: 63 },
      { moduleId: '6824644353655e3728f9298d', featureId: '6824647953655e3728f9298e', permissionValue: 63 },
      { moduleId: '68247a17f26109963cd28983', featureId: '68247a43f26109963cd28984', permissionValue: 3 },
      { moduleId: '682d9e78ad238630db749e16', featureId: '682d9ea5ad238630db749e17', permissionValue: 2 },
      { moduleId: '682da865ad238630db749e18', featureId: '682da881ad238630db749e19', permissionValue: 3 },
      { moduleId: '682daacbad238630db749e1a', featureId: '682daae3ad238630db749e1b', permissionValue: 11 },
      { moduleId: '68cba4922f53897558e870e4', featureId: '68cba4cd2f53897558e870e5', permissionValue: 16 },
      { moduleId: '68cba4922f53897558e870e4', featureId: '68d3b0e90c4354e5d0f72e63', permissionValue: 3 },
      { moduleId: '68cba4922f53897558e870e4', featureId: '68d805462d428eca32719dab', permissionValue: 15 }
    ],
    isActive: true
  },
  {
    id: '68236ac1134f67223e186e4b',
    name: 'Manager',
    displayName: 'Manager',
    description: 'Full access all features',
    permissions: [
      { moduleId: '6823660ba427aa892ec05fdc', featureId: '6823678f134f67223e186e49', permissionValue: 63 },
      { moduleId: '6824644353655e3728f9298d', featureId: '6824647953655e3728f9298e', permissionValue: 63 },
      { moduleId: '68247a17f26109963cd28983', featureId: '68247a43f26109963cd28984', permissionValue: 3 },
      { moduleId: '682d9e78ad238630db749e16', featureId: '682d9ea5ad238630db749e17', permissionValue: 2 },
      { moduleId: '682da865ad238630db749e18', featureId: '682da881ad238630db749e19', permissionValue: 3 },
      { moduleId: '682daacbad238630db749e1a', featureId: '682daae3ad238630db749e1b', permissionValue: 11 },
      { moduleId: '68cba4922f53897558e870e4', featureId: '68cba4cd2f53897558e870e5', permissionValue: 16 },
      { moduleId: '68cba4922f53897558e870e4', featureId: '68d3b0e90c4354e5d0f72e63', permissionValue: 3 },
      { moduleId: '68cba4922f53897558e870e4', featureId: '68d805462d428eca32719dab', permissionValue: 15 }
    ],
    isActive: true
  },
  {
    id: '68236aec134f67223e186e4c',
    name: 'Designer',
    displayName: 'Designer',
    description: 'Limited access',
    permissions: [
      { moduleId: '6823660ba427aa892ec05fdc', featureId: '6823678f134f67223e186e49', permissionValue: 2 },
      { moduleId: '68247a17f26109963cd28983', featureId: '68247a43f26109963cd28984', permissionValue: 3 },
      { moduleId: '682d9e78ad238630db749e16', featureId: '682d9ea5ad238630db749e17', permissionValue: 2 },
      { moduleId: '682da865ad238630db749e18', featureId: '682da881ad238630db749e19', permissionValue: 0 },
      { moduleId: '682daacbad238630db749e1a', featureId: '682daae3ad238630db749e1b', permissionValue: 11 },
      { moduleId: '6824644353655e3728f9298d', featureId: '6824647953655e3728f9298e', permissionValue: 6 },
      { moduleId: '68cba4922f53897558e870e4', featureId: '68d805462d428eca32719dab', permissionValue: 2 }
    ],
    isActive: true
  }
];

export const users = [
  { id: 'u-alice', firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', userName: 'alice.j', organizationId: 'org-1', roles: [{ roleId: 'role-admin' }] },
  { id: 'u-bob', firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', userName: 'bob.s', organizationId: 'org-1', roles: [{ roleId: 'role-editor' }] },
  { id: 'u-carol', firstName: 'Carol', lastName: 'Lee', email: 'carol@example.com', userName: 'carol.l', organizationId: 'org-1', roles: [{ roleId: 'role-viewer' }] },
];

// Usage: import { modules, features, roles, permissionTypes, users } from './dummyData';
