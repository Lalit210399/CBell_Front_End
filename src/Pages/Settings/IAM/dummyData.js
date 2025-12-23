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
];

export const users = [
  { id: 'u-alice', firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', userName: 'alice.j', organizationId: 'org-1', roles: [{ roleId: 'role-admin' }] },
  { id: 'u-bob', firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', userName: 'bob.s', organizationId: 'org-1', roles: [{ roleId: 'role-editor' }] },
  { id: 'u-carol', firstName: 'Carol', lastName: 'Lee', email: 'carol@example.com', userName: 'carol.l', organizationId: 'org-1', roles: [{ roleId: 'role-viewer' }] },
];

// Usage: import { modules, features, roles, permissionTypes, users } from './dummyData';
