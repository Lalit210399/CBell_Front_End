import { render, screen, waitFor } from '@testing-library/react';
import { EventTypesProvider, useEventTypes } from '../EventTypesContext';
import { UserProvider } from '../UserContext';
import { MessageProvider } from '../MessageContext';

// Mock the fetchWithRefresh function
jest.mock('../RefereshToken', () => ({
  fetchWithRefresh: jest.fn()
}));

// Mock component to test the context
const TestComponent = () => {
  const { eventTypes, loading, error, hasEventTypes, isCacheValid } = useEventTypes();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="has-event-types">{hasEventTypes ? 'true' : 'false'}</div>
      <div data-testid="is-cache-valid">{isCacheValid ? 'true' : 'false'}</div>
      <div data-testid="event-types-count">{eventTypes.length}</div>
      {eventTypes.map((type, index) => (
        <div key={type.id || index} data-testid={`event-type-${index}`}>
          {type.name}
        </div>
      ))}
    </div>
  );
};

const renderWithProviders = (component) => {
  return render(
    <UserProvider>
      <MessageProvider>
        <EventTypesProvider>
          {component}
        </EventTypesProvider>
      </MessageProvider>
    </UserProvider>
  );
};

describe('EventTypesContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<TestComponent />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithProviders(<TestComponent />);
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
  });

  it('handles successful event types fetch', async () => {
    const mockEventTypes = [
      { id: '1', name: 'Conference', description: 'Conference event' },
      { id: '2', name: 'Workshop', description: 'Workshop event' }
    ];

    const { fetchWithRefresh } = require('../RefereshToken');
    fetchWithRefresh.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockEventTypes })
    });

    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('has-event-types')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('event-types-count')).toHaveTextContent('2');
    expect(screen.getByTestId('event-type-0')).toHaveTextContent('Conference');
    expect(screen.getByTestId('event-type-1')).toHaveTextContent('Workshop');
  });

  it('handles error state', async () => {
    const { fetchWithRefresh } = require('../RefereshToken');
    fetchWithRefresh.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('API Error');
    });
  });

  it('provides helper methods', async () => {
    const mockEventTypes = [
      { id: '1', name: 'Conference', description: 'Conference event' },
      { id: '2', name: 'Workshop', description: 'Workshop event' }
    ];

    const { fetchWithRefresh } = require('../RefereshToken');
    fetchWithRefresh.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockEventTypes })
    });

    const TestHelperComponent = () => {
      const { getEventTypeById, getEventTypeByName, getActiveEventTypes } = useEventTypes();
      
      return (
        <div>
          <div data-testid="type-by-id">{getEventTypeById('1')?.name || 'Not Found'}</div>
          <div data-testid="type-by-name">{getEventTypeByName('Conference')?.id || 'Not Found'}</div>
          <div data-testid="active-types-count">{getActiveEventTypes().length}</div>
        </div>
      );
    };

    renderWithProviders(<TestHelperComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('type-by-id')).toHaveTextContent('Conference');
      expect(screen.getByTestId('type-by-name')).toHaveTextContent('1');
      expect(screen.getByTestId('active-types-count')).toHaveTextContent('2');
    });
  });
});
