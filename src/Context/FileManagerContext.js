import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getPublishedApprovedFiles,
  getUserById,
  viewFileAPI,
  downloadFileAPI
} from '../MockData/fileManagerData';

const FileManagerContext = createContext();

export const useFileManager = () => {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error('useFileManager must be used within FileManagerProvider');
  }
  return context;
};

export const FileManagerProvider = ({ children }) => {
  const [currentFiles, setCurrentFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load published and approved files
    const files = getPublishedApprovedFiles();
    setCurrentFiles(files);
    setLoading(false);
  }, []);

  const handleFilePreview = async (file) => {
    await viewFileAPI(file.id);
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const handleFileDownload = async (file) => {
    await downloadFileAPI(file.id);
  };

  const getFileUploader = (userId) => {
    return getUserById(userId);
  };

  const getFileApprover = (userId) => {
    return getUserById(userId);
  };

  const value = {
    currentFiles,
    previewFile,
    loading,
    handleFilePreview,
    closePreview,
    handleFileDownload,
    getFileUploader,
    getFileApprover
  };

  return (
    <FileManagerContext.Provider value={value}>
      {children}
    </FileManagerContext.Provider>
  );
};
