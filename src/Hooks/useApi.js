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

    // Check if fetchFn is a function is passed
    if (!fetchFn) return;

    // Set everything to initial state
    dispatch({ type: API_ACTIONS.FETCH_INIT });

    try {
      // Call the resource function
      const result = await fetchFn(...args);

      // If the result is successful, dispatch the success action
      dispatch({
        type: API_ACTIONS.FETCH_SUCCESS,
        payload: result
      });
      return result;
    } catch (error) {
      // If the result is unsuccessful, dispatch the failure action
      const errorMessage = error?.message || 'An error occurred';

      // Dispatch the failure action
      dispatch({
        type: API_ACTIONS.FETCH_FAILURE,
        payload: errorMessage
      });

      // Don't throw the error - let components handle it through the error state
      // This prevents uncaught runtime errors
      console.warn('API call failed:', errorMessage);
    }
  }, [fetchFn]);

  // Reset function to clear state
  const reset = useCallback(() => {
    // Dispatch the reset action
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
