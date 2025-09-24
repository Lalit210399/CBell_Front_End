# Event Types Context Documentation

## Overview

The `EventTypesContext` provides a centralized way to manage event types data across the application. It implements intelligent caching, automatic refresh on scope changes, and provides helper methods for easy data access.

## Features

- ✅ **Intelligent Caching**: 5-minute cache duration to reduce API calls
- ✅ **Scope Change Support**: Automatically refreshes when organization changes
- ✅ **Error Handling**: Comprehensive error handling and recovery
- ✅ **Helper Methods**: Easy-to-use methods for finding event types
- ✅ **Loading States**: Proper loading state management
- ✅ **Cache Validation**: Built-in cache validation and staleness detection

## Usage

### Basic Usage

```javascript
import { useEventTypes } from '../Hooks/useEventTypes';

const MyComponent = () => {
  const { 
    eventTypes, 
    loading, 
    error, 
    getEventTypeById, 
    getEventTypeByName,
    getActiveEventTypes 
  } = useEventTypes();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {eventTypes.map(type => (
        <div key={type.id}>{type.name}</div>
      ))}
    </div>
  );
};
```

### Advanced Usage

```javascript
const MyComponent = () => {
  const { 
    eventTypes,
    loading,
    error,
    getEventTypeById,
    getEventTypeByName,
    getActiveEventTypes,
    hasEventTypes,
    isCacheValid,
    isStale,
    refreshEventTypes
  } = useEventTypes();

  // Get specific event type by ID
  const conferenceType = getEventTypeById('1');
  
  // Get specific event type by name
  const workshopType = getEventTypeByName('Workshop');
  
  // Get only active event types
  const activeTypes = getActiveEventTypes();
  
  // Check if we have event types
  if (!hasEventTypes) {
    return <div>No event types available</div>;
  }
  
  // Check if cache is valid
  if (!isCacheValid()) {
    // Cache is expired, will auto-refresh
  }
  
  // Force refresh
  const handleRefresh = () => {
    refreshEventTypes();
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh Event Types</button>
      {eventTypes.map(type => (
        <div key={type.id}>
          {type.name} - {type.description}
        </div>
      ))}
    </div>
  );
};
```

## API Reference

### Context Value

| Property | Type | Description |
|----------|------|-------------|
| `eventTypes` | `Array` | Array of event type objects |
| `loading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message if any |
| `lastFetched` | `number \| null` | Timestamp of last fetch |
| `fetchEventTypes` | `function` | Fetch event types (with caching) |
| `refreshEventTypes` | `function` | Force refresh event types |
| `getEventTypeById` | `function` | Get event type by ID |
| `getEventTypeByName` | `function` | Get event type by name |
| `getActiveEventTypes` | `function` | Get active event types only |
| `isCacheValid` | `function` | Check if cache is valid |
| `hasEventTypes` | `boolean` | Whether we have event types |
| `isStale` | `boolean` | Whether cache is stale |

### Event Type Object Structure

```javascript
{
  id: string,           // Event type ID
  name: string,         // Event type name
  description: string,  // Event type description
  isActive: boolean,    // Whether the type is active
  organizationId: string, // Organization ID
  // ... additional properties from API
}
```

## Caching Strategy

### Cache Duration
- **Default**: 5 minutes (300,000 ms)
- **Configurable**: Can be modified in the context

### Cache Invalidation
- **Automatic**: On organization change
- **Manual**: Via `refreshEventTypes()` method
- **Time-based**: After cache duration expires

### Cache Behavior
1. **First Load**: Fetches from API and caches
2. **Subsequent Loads**: Uses cached data if valid
3. **Scope Change**: Clears cache and fetches new data
4. **Manual Refresh**: Bypasses cache and fetches fresh data

## Error Handling

The context provides comprehensive error handling:

- **Network Errors**: Caught and stored in `error` state
- **API Errors**: HTTP errors are caught and logged
- **Data Validation**: Ensures data is in expected format
- **Graceful Degradation**: Falls back to empty array on errors

## Performance Benefits

1. **Reduced API Calls**: Caching prevents unnecessary requests
2. **Faster UI**: Instant access to cached data
3. **Better UX**: No loading states for cached data
4. **Efficient Updates**: Only refreshes when needed

## Integration with Other Contexts

The `EventTypesContext` integrates seamlessly with:

- **UserContext**: Uses organization ID for scoped data
- **MessageContext**: Shows error messages to users
- **ThemeContext**: Inherits theme settings

## Best Practices

1. **Use the Hook**: Always use `useEventTypes()` hook instead of direct context access
2. **Check Loading States**: Always handle loading and error states
3. **Leverage Helper Methods**: Use provided helper methods for data access
4. **Handle Empty States**: Check `hasEventTypes` before rendering lists
5. **Cache Awareness**: Use `isCacheValid()` for cache-aware operations

## Migration Guide

### Before (Old Pattern)
```javascript
const [eventTypes, setEventTypes] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/apis/eventtype/get_all_event-types');
      const data = await response.json();
      setEventTypes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchEventTypes();
}, []);
```

### After (New Pattern)
```javascript
const { eventTypes, loading, error } = useEventTypes();
// That's it! No need for useState, useEffect, or API calls
```

## Troubleshooting

### Common Issues

1. **Event Types Not Loading**
   - Check if organization is selected
   - Verify API endpoint is accessible
   - Check browser console for errors

2. **Stale Data**
   - Use `refreshEventTypes()` to force refresh
   - Check `isStale` property for staleness

3. **Performance Issues**
   - Ensure you're using the hook correctly
   - Check if multiple components are fetching simultaneously

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'EventTypesContext'` in browser console.

## Future Enhancements

- [ ] Offline support with localStorage fallback
- [ ] Real-time updates via WebSocket
- [ ] Advanced caching strategies (LRU, etc.)
- [ ] Batch operations for multiple event types
- [ ] Analytics and usage tracking
