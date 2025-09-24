import { useReducer, useCallback, useEffect } from 'react';
import { apiReducer, initialApiState, API_ACTIONS } from './apiReducer';

/**
 * Custom hook for managing API calls with consistent state management
 * @param {Function} fetchFn - Async function that performs the API call
 * @param {Array} dependencies - Array of dependencies to watch for re-execution
 * @param {boolean} executeOnMount - Whether to execute the API call on component mount (default: true)
 * @returns {Object} { data, loading, error, execute, reset }
 */
const useApi = (fetchFn, dependencies = [], executeOnMount = true) => {
  const [state, dispatch] = useReducer(apiReducer, initialApiState);

  // Execute function that triggers the API call
  const execute = useCallback(async (...args) => {
    if (!fetchFn) return;
    
    dispatch({ type: API_ACTIONS.FETCH_INIT });
    
    try {
      const result = await fetchFn(...args);
      dispatch({ 
        type: API_ACTIONS.FETCH_SUCCESS, 
        payload: result 
      });
      return result;
    } catch (error) {
      const errorMessage = error?.message || 'An error occurred';
      dispatch({ 
        type: API_ACTIONS.FETCH_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  }, [fetchFn]);

  // Reset function to clear state
  const reset = useCallback(() => {
    dispatch({ type: API_ACTIONS.RESET });
  }, []);

  // Execute on mount and when dependencies change
  useEffect(() => {
    if (executeOnMount && fetchFn) {
      execute();
    }
  }, dependencies);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset
  };
};

export default useApi;
