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
  const { eventTypes, loading, error, hasEventTypes } = useEventTypes();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="has-event-types">{hasEventTypes ? 'true' : 'false'}</div>
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

describe('EventTypesContext Fallback Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles 404 error with fallback data', async () => {
    const { fetchWithRefresh } = require('../RefereshToken');
    fetchWithRefresh.mockResolvedValue({
      ok: false,
      status: 404
    });

    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('has-event-types')).toHaveTextContent('true');
    });

    // Should have fallback event types
    expect(screen.getByTestId('event-types-count')).toHaveTextContent('5');
    expect(screen.getByTestId('event-type-0')).toHaveTextContent('Conference');
    expect(screen.getByTestId('event-type-1')).toHaveTextContent('Workshop');
    expect(screen.getByTestId('event-type-2')).toHaveTextContent('Meeting');
    expect(screen.getByTestId('event-type-3')).toHaveTextContent('Training');
    expect(screen.getByTestId('event-type-4')).toHaveTextContent('Seminar');
    
    // Should not show error for fallback data
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
  });

  it('handles network error with fallback data', async () => {
    const { fetchWithRefresh } = require('../RefereshToken');
    fetchWithRefresh.mockRejectedValue(new Error('Network Error'));

    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('has-event-types')).toHaveTextContent('true');
    });

    // Should have fallback event types
    expect(screen.getByTestId('event-types-count')).toHaveTextContent('5');
    expect(screen.getByTestId('event-type-0')).toHaveTextContent('Conference');
    
    // Should not show error for fallback data
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
  });

  it('handles unexpected data format with fallback', async () => {
    const { fetchWithRefresh } = require('../RefereshToken');
    fetchWithRefresh.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "not an array" })
    });

    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('has-event-types')).toHaveTextContent('true');
    });

    // Should have fallback event types
    expect(screen.getByTestId('event-types-count')).toHaveTextContent('3');
    expect(screen.getByTestId('event-type-0')).toHaveTextContent('Conference');
    expect(screen.getByTestId('event-type-1')).toHaveTextContent('Workshop');
    expect(screen.getByTestId('event-type-2')).toHaveTextContent('Meeting');
    
    // Should not show error for fallback data
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
  });
});
