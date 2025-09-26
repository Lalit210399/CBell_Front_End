// API Reducer for consistent state management across all API calls
export const API_ACTIONS = {
  FETCH_INIT: 'FETCH_INIT',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_FAILURE: 'FETCH_FAILURE',
  RESET: 'RESET'
};

// Initial state for API calls
export const initialApiState = {
  data: null,
  loading: false,
  error: null
};

// Generic reducer for API state management
export const apiReducer = (state, action) => {
  switch (action.type) {
    case API_ACTIONS.FETCH_INIT:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case API_ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null
      };
    
    case API_ACTIONS.FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        data: null
      };
    
    case API_ACTIONS.RESET:
      return initialApiState;
    
    default:
      return state;
  }
};
