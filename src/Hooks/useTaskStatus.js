import { useContext } from 'react';
import { TaskStatusContext } from '../Context/TaskStatusContext';

export const useTaskStatus = () => {
  const context = useContext(TaskStatusContext);
  if (!context) {
    throw new Error("useTaskStatus must be used within a TaskStatusProvider");
  }
  return context;
};
