    import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFileManager } from '../../Context/FileManagerContext';
import {
  mockEvents,
  mockTasks,
  mockUsers
} from '../../MockData/fileManagerData';
import FilesUploads from '../../CommonComponents/FileandUpload/FilesAndUploads';
import './FileManager.css';

const FileManager = () => {
  const { currentFiles, loading } = useFileManager();

  // Filters
  const [org, setOrg] = useState('all');
  const [uploader, setUploader] = useState('all');
  const [eventId, setEventId] = useState('all');
  const [taskId, setTaskId] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchRef = useRef(null);

  // Helper to get file type from MIME - defined before use
  const getFileTypeFromMime = (mime) => {
    if (!mime) return 'file';
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('video')) return 'video';
    if (mime.startsWith('audio')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'file';
  };

  // derive uploader options (designers only and unique)
  const uploaderOptions = useMemo(() => {
    return Object.values(mockUsers).filter(u => u.role === 'designer');
  }, []);

  // derive event options
  const eventOptions = mockEvents;

  // derive task options based on event selection
  const taskOptions = useMemo(() => {
    if (eventId === 'all') return mockTasks;
    return mockTasks.filter(t => t.eventId === eventId);
  }, [eventId]);

  // debounce search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setDebouncedSearch(searchText.trim().toLowerCase());
    }, 300);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [searchText]);

  // filter files: only those uploaded by designers and already published/approved (FileManagerContext provides published/approved)
  const filteredFiles = useMemo(() => {
    if (!currentFiles) return [];

    return currentFiles
      .filter(file => {
        // uploader filter
        const uploaderObj = mockUsers.designer; // Use mock designer user
        if (!uploaderObj) return false;
        if (uploaderObj.role !== 'designer') return false; // show designer uploads only

        if (uploader !== 'all' && String(file.uploadedBy) !== String(uploader)) return false;

        // org filter - placeholder: treat 'design' org as designer role
        if (org !== 'all' && org !== 'design') return false;

        // event/task filter
        if (eventId !== 'all') {
          if (!mockTasks.find(t => t.id === file.taskId && t.eventId === eventId)) return false;
        }
        if (taskId !== 'all' && file.taskId !== taskId) return false;

        // search filter across file name, task name, event name
        if (debouncedSearch) {
          const fname = (file.name || '').toLowerCase();
          const task = mockTasks.find(t => t.id === file.taskId);
          const tname = task ? task.name.toLowerCase() : '';
          const ev = task ? mockEvents.find(e => e.id === task.eventId) : null;
          const ename = ev ? ev.name.toLowerCase() : '';

          const term = debouncedSearch;
          return fname.includes(term) || tname.includes(term) || ename.includes(term);
        }

        return true;
      })
      .map(file => {
        const task = mockTasks.find(t => t.id === file.taskId);
        const event = task ? mockEvents.find(e => e.id === task.eventId) : null;
        const uploaderObj = mockUsers.designer;
        
        // Transform file to match FilesUploads component format
        return {
          documentId: file.id,
          name: file.name,
          type: getFileTypeFromMime(file.type),
          src: file.url,
          description: `${event ? event.name : '—'} • ${task ? task.name : '—'}`,
          uploadDate: file.uploadedAt,
          size: file.size,
          status: file.status,
          publishedTo: file.publishedBy ? [{
            isPublished: true,
            platform: 'Web',
            publishedAt: file.publishedAt
          }] : [],
          userInfo: {
            fullName: uploaderObj ? uploaderObj.name : 'Unknown User',
            roles: uploaderObj ? [{ name: uploaderObj.role, displayName: uploaderObj.role }] : []
          }
        };
      });
  }, [currentFiles, uploader, org, eventId, taskId, debouncedSearch]);

  if (loading) return <div className="fm-loading">Loading files...</div>;

  return (
    <div className="fm-page">
      <h2>Designer Files (Published / Approved)</h2>

      <div className="fm-controls">
        <input
          type="search"
          placeholder="Search by file, task or event..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="fm-search"
        />

        <select value={org} onChange={e => setOrg(e.target.value)}>
          <option value="all">All Organizations</option>
          <option value="design">Design</option>
        </select>

        <select value={uploader} onChange={e => setUploader(e.target.value)}>
          <option value="all">All Designers</option>
          {uploaderOptions.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select value={eventId} onChange={e => { setEventId(e.target.value); setTaskId('all'); }}>
          <option value="all">All Events</option>
          {eventOptions.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>

        <select value={taskId} onChange={e => setTaskId(e.target.value)}>
          <option value="all">All Tasks</option>
          {taskOptions.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <button className="btn" onClick={() => { setOrg('all'); setUploader('all'); setEventId('all'); setTaskId('all'); setSearchText(''); }}>Clear</button>
      </div>

      {/* Use FilesUploads component to display files */}
      <FilesUploads
        files={filteredFiles}
        readOnly={true}
        mode="view"
        externalLoading={loading}
      />
    </div>
  );
};

export default FileManager;
