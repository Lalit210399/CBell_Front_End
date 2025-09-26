import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Schedule from '../Schedule';
import { UserProvider } from '../../../Context/UserContext';
import { MessageProvider } from '../../../Context/MessageContext';

// Mock the CustomCalendar component
jest.mock('../../../CommonComponents/Calendar/CustomCalendar', () => {
  return function MockCustomCalendar({ events, loading, error, onEventClick, isViewingOwnOrganization }) {
    return (
      <div data-testid="custom-calendar">
        <div data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</div>
        <div data-testid="error">{error || 'No Error'}</div>
        <div data-testid="events-count">{events?.length || 0}</div>
        <div data-testid="is-viewing-own-org">{isViewingOwnOrganization ? 'true' : 'false'}</div>
        {events?.map((event, index) => (
          <div key={event.id || index} data-testid={`event-${index}`} onClick={() => onEventClick(event)}>
            {event.title}
          </div>
        ))}
      </div>
    );
  };
});

// Mock the useApi hook
jest.mock('../../../Hooks/useApi', () => {
  return jest.fn(() => ({
    data: [
      {
        id: '1',
        title: 'Test Event',
        start: new Date('2024-01-01'),
        end: new Date('2024-01-01'),
        category: 'new',
        rawData: { id: '1', eventName: 'Test Event' }
      }
    ],
    loading: false,
    error: null,
    execute: jest.fn()
  }));
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

describe('Schedule Component', () => {
  it('renders without crashing', () => {
    renderWithProviders(<Schedule />);
    expect(screen.getByTestId('custom-calendar')).toBeInTheDocument();
  });

  it('displays events correctly', () => {
    renderWithProviders(<Schedule />);
    expect(screen.getByTestId('events-count')).toHaveTextContent('1');
    expect(screen.getByTestId('event-0')).toHaveTextContent('Test Event');
  });

  it('shows loading state', () => {
    const useApi = require('../../../Hooks/useApi');
    useApi.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      execute: jest.fn()
    });

    renderWithProviders(<Schedule />);
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
  });

  it('shows error state', () => {
    const useApi = require('../../../Hooks/useApi');
    useApi.mockReturnValue({
      data: null,
      loading: false,
      error: 'Test Error',
      execute: jest.fn()
    });

    renderWithProviders(<Schedule />);
    expect(screen.getByTestId('error')).toHaveTextContent('Test Error');
  });
});
