# API Management with useReducer Pattern

This directory contains a consistent API management pattern using `useReducer` for all API calls in the application.

## Files

- `apiReducer.js` - Generic reducer for handling API states
- `useApi.js` - Custom hook that uses the reducer for API management
- `__tests__/useApi.test.js` - Unit tests for the useApi hook

## Usage

### Basic Usage

```javascript
import useApi from '../Hooks/useApi';

const MyComponent = () => {
  const fetchData = async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('API Error');
    return response.json();
  };

  const { data, loading, error, execute, reset } = useApi(fetchData);

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>Data: {JSON.stringify(data)}</div>}
      <button onClick={execute}>Fetch Data</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};
```

### With Dependencies

```javascript
const MyComponent = ({ userId }) => {
  const fetchUserData = async () => {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('API Error');
    return response.json();
  };

  // Will re-execute when userId changes
  const { data, loading, error } = useApi(fetchUserData, [userId]);

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>User: {data.name}</div>}
    </div>
  );
};
```

### Disable Auto-execution

```javascript
const MyComponent = () => {
  const fetchData = async () => {
    // API call logic
  };

  // Won't execute on mount
  const { data, loading, error, execute } = useApi(fetchData, [], false);

  return (
    <button onClick={execute} disabled={loading}>
      {loading ? 'Loading...' : 'Fetch Data'}
    </button>
  );
};
```

## API Reference

### useApi(fetchFn, dependencies, executeOnMount)

#### Parameters

- `fetchFn` (Function): Async function that performs the API call
- `dependencies` (Array): Array of dependencies to watch for re-execution (default: [])
- `executeOnMount` (boolean): Whether to execute on component mount (default: true)

#### Returns

- `data` (any): The data returned from the API call
- `loading` (boolean): Whether the API call is in progress
- `error` (string|null): Error message if the API call failed
- `execute` (Function): Function to manually trigger the API call
- `reset` (Function): Function to reset the state to initial values

## State Management

The reducer manages three states:

- `FETCH_INIT`: Sets loading to true, clears error
- `FETCH_SUCCESS`: Sets loading to false, stores data, clears error
- `FETCH_FAILURE`: Sets loading to false, stores error, clears data
- `RESET`: Resets to initial state

## Benefits

1. **Consistency**: All API calls follow the same pattern
2. **Reusability**: Easy to reuse across components
3. **Error Handling**: Centralized error handling
4. **Loading States**: Automatic loading state management
5. **Type Safety**: Can be easily extended with TypeScript
6. **Testing**: Easy to test with mock functions

## Migration from Old Pattern

### Before (Old Pattern)

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch('/api/data');
    const result = await response.json();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, [dependency]);
```

### After (New Pattern)

```javascript
const fetchData = async () => {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('API Error');
  return response.json();
};

const { data, loading, error, execute } = useApi(fetchData, [dependency]);
```

## Best Practices

1. **Error Handling**: Always throw errors in fetchFn for proper error handling
2. **Dependencies**: Include all variables used in fetchFn in the dependencies array
3. **Cleanup**: Use reset() when component unmounts or when switching between different data sets
4. **Loading States**: Use the loading state to show spinners or disable buttons
5. **Error Display**: Always show error states to users

## Examples in Dashboard

The Dashboard component demonstrates the pattern with multiple API calls:

- Dashboard Summary API
- Active Events Count API
- Events Campaign API
- Tasks API
- Active Events API
- Assigned Events API

Each API call is managed independently with its own useApi hook, providing clean separation of concerns and easy maintenance.
