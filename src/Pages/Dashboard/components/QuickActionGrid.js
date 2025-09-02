import React from 'react';
import PropTypes from 'prop-types';
import {
  CalendarPlus,
  ListTodo,
  Users,
  Settings,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const defaultActions = [
  {
    id: 'new-event',
    label: 'New Event',
    icon: CalendarPlus,
    path: '/dashboard/create-event',
    shortcut: 'Ctrl+N'
  },
  {
    id: 'new-task',
    label: 'New Task',
    icon: ListTodo,
    path: '/dashboard/create-task',
    shortcut: 'Ctrl+T'
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    path: '/dashboard/contacts'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/dashboard/reports'
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    path: '/dashboard/messages'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/dashboard/settings'
  }
];

export const QuickActionGrid = ({ actions = defaultActions }) => {
  const navigate = useNavigate();

  const handleActionClick = (path) => {
    navigate(path);
  };

  return (
    <div className="quick-action-grid">
      {actions.map(({ id, label, icon: Icon, path, shortcut }) => (
        <button
          key={id}
          className="quick-action-item"
          onClick={() => handleActionClick(path)}
          title={shortcut ? `${label} (${shortcut})` : label}
        >
          <Icon size={24} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

QuickActionGrid.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      path: PropTypes.string.isRequired,
      shortcut: PropTypes.string
    })
  )
};

export default QuickActionGrid;
