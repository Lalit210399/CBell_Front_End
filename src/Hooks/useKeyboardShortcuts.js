import { useEffect, useCallback } from 'react';

export const useKeyboardShortcuts = (handlers) => {
  const handleKeyDown = useCallback(
    (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            handlers.newEvent?.();
            break;
          case 't':
            event.preventDefault();
            handlers.newTask?.();
            break;
          default:
            break;
        }
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
