import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EventDetailPage from '../EventDetailPage';
import { UserProvider } from '../../../Context/UserContext';
import { MessageProvider } from '../../../Context/MessageContext';

// Mock the useApi hook
jest.mock('../../../Hooks/useApi', () => {
  return jest.fn(() => ({
    data: null,
    loading: false,
    error: null,
    execute: jest.fn()
  }));
});

// Mock the child components
jest.mock('../EventDetail/EventDetail', () => {
  return function MockEventDetail({ mode, onSave, guestsData, organizersData, initialDescription, initialLocation }) {
    return (
      <div data-testid="event-detail">
        <div data-testid="mode">{mode}</div>
        <div data-testid="description">{initialDescription}</div>
        <div data-testid="location">{initialLocation}</div>
        <div data-testid="guests-count">{guestsData?.length || 0}</div>
        <div data-testid="organizers-count">{organizersData?.length || 0}</div>
      </div>
    );
  };
});

jest.mock('../Tasks/Tasks', () => {
  return function MockTasks({ tasksData, eventId, eventName }) {
    return (
      <div data-testid="tasks">
        <div data-testid="event-id">{eventId}</div>
        <div data-testid="event-name">{eventName}</div>
        <div data-testid="tasks-count">{tasksData?.length || 0}</div>
      </div>
    );
  };
});

jest.mock('../Publish/Publish', () => {
  return function MockPublish({ publishData, eventId, onDownload, onSendMail }) {
    return (
      <div data-testid="publish">
        <div data-testid="publish-event-id">{eventId}</div>
        <div data-testid="publish-data-count">{publishData?.length || 0}</div>
      </div>
    );
  };
});

jest.mock('../Files_Uploads/FilesUploads', () => {
  return function MockFileUploads({ filesFromTasks, eventId, organizationId }) {
    return (
      <div data-testid="file-uploads">
        <div data-testid="files-event-id">{eventId}</div>
        <div data-testid="files-org-id">{organizationId}</div>
        <div data-testid="files-count">{filesFromTasks?.length || 0}</div>
      </div>
    );
  };
});

jest.mock('../../../CommonComponents/TabMenu/TabMenu', () => {
  return function MockTabMenu({ tabs, activeTab, setActiveTab, showEditButton, isEditMode, onEditClick, onCancelClick }) {
    return (
      <div data-testid="tab-menu">
        <div data-testid="active-tab">{activeTab}</div>
        <div data-testid="show-edit-button">{showEditButton ? 'true' : 'false'}</div>
        <div data-testid="is-edit-mode">{isEditMode ? 'true' : 'false'}</div>
        {tabs?.map((tab, index) => (
          <div key={tab.label} data-testid={`tab-${index}`} onClick={() => setActiveTab(tab.label)}>
            {tab.label}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../../CommonComponents/TaskTopSection/DetailTopSectionNew', () => {
  return function MockTopSection({ mode, onBackClick, onNewTaskClick, onSaveClick, data, participants, permissions, isSubmitting, errors, onClearError, users, assignedTo, onParticipantsChange }) {
    return (
      <div data-testid="top-section">
        <div data-testid="top-section-mode">{mode}</div>
        <div data-testid="top-section-title">{data?.title}</div>
        <div data-testid="top-section-participants-count">{participants?.length || 0}</div>
        <div data-testid="top-section-users-count">{users?.length || 0}</div>
        <div data-testid="top-section-assigned-count">{assignedTo?.length || 0}</div>
        <div data-testid="top-section-is-submitting">{isSubmitting ? 'true' : 'false'}</div>
      </div>
    );
  };
});

jest.mock('../../../CommonComponents/SkeletonLoading/PageSkeleton', () => {
  return function MockPageSkeleton({ type }) {
    return <div data-testid="page-skeleton">Loading {type}...</div>;
  };
});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <UserProvider>
        <MessageProvider>
          {component}
        </MessageProvider>
      </UserProvider>
    </BrowserRouter>
  );
};

describe('EventDetailPage Component', () => {
  const mockLocation = {
    state: {
      eventId: '123',
      mode: 'view',
      eventType: 'Conference',
      eventTypeId: '1',
      formData: {
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        location: 'Test Location'
      },
      selectedDate: '2024-01-01T10:00:00Z'
    }
  };

  beforeEach(() => {
    // Mock useLocation
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue(mockLocation);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<EventDetailPage />);
    expect(screen.getByTestId('top-section')).toBeInTheDocument();
  });

  it('shows loading state when event is loading', () => {
    const useApi = require('../../../Hooks/useApi');
    useApi.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      execute: jest.fn()
    });

    renderWithProviders(<EventDetailPage />);
    expect(screen.getByTestId('page-skeleton')).toBeInTheDocument();
  });

  it('displays event details correctly', async () => {
    const useApi = require('../../../Hooks/useApi');
    useApi.mockReturnValue({
      data: {
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        locationDetails: 'Test Location',
        coordinators: [],
        specialGuests: [],
        assignedUsers: []
      },
      loading: false,
      error: null,
      execute: jest.fn()
    });

    renderWithProviders(<EventDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('top-section-title')).toHaveTextContent('Test Event');
    });
  });

  it('handles create mode correctly', () => {
    const createLocation = {
      state: {
        mode: 'create',
        formData: {
          eventName: 'New Event',
          eventDescription: 'New Description',
          location: 'New Location'
        }
      }
    };
    
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue(createLocation);

    renderWithProviders(<EventDetailPage />);
    expect(screen.getByTestId('top-section-mode')).toHaveTextContent('create');
  });

  it('displays tabs correctly', () => {
    renderWithProviders(<EventDetailPage />);
    expect(screen.getByTestId('tab-menu')).toBeInTheDocument();
    expect(screen.getByTestId('tab-0')).toHaveTextContent('Details');
  });
});
