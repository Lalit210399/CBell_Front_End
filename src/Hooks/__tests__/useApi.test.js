import { renderHook, act } from '@testing-library/react';
import useApi from '../useApi';

// Mock fetch function
global.fetch = jest.fn();

describe('useApi Hook', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should initialize with correct initial state', () => {
    const mockFetchFn = jest.fn();
    const { result } = renderHook(() => useApi(mockFetchFn, [], false));

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should execute API call and handle success', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetchFn = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useApi(mockFetchFn, [], false));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle API call errors', async () => {
    const mockError = new Error('API Error');
    const mockFetchFn = jest.fn().mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useApi(mockFetchFn, [], false));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('should reset state when reset is called', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetchFn = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useApi(mockFetchFn, [], false));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
