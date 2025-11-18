import React from 'react';
import FileManager from '../CommonComponents/FileManager/FileManager';

const FileManagerPage = () => {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      <FileManager />
    </div>
  );
};

export default FileManagerPage;
