import React from 'react';
import { FileManagerProvider } from '../../Context/FileManagerContext';
import FileGrid from './FileGrid';
import FilePreviewModal from './FilePreviewModal';
import './FileManager.css';

const FileManagerContent = () => {
  return (
    <div className="fm-container">
      <div className="fm-layout">
        <FileGrid />
      </div>
      <FilePreviewModal />
    </div>
  );
};

const FileManager = () => {
  return (
    <FileManagerProvider>
      <FileManagerContent />
    </FileManagerProvider>
  );
};

export default FileManager;
