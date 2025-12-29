import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderKanban,
  Calendar,
  CheckSquare,
  Wrench,
  BookOpen,
  Search,
  Download,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  List,
  Grid3X3,
  X,
} from 'lucide-react';
import { useUser } from '../../Context/UserContext';
import './FileManager.css';

const FileManager = () => {
  const { user } = useUser();
  const isAdmin = user?.roles?.some(role => role.name === 'Admin' || role.displayName === 'Admin');

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [expandedEvents, setExpandedEvents] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [previewModal, setPreviewModal] = useState({ open: false, file: null });
  // API data states - only files (Document Details API)
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Only call Document Details API
        const filesResponse = await fetch('apis/document-details/task/692e76a02b1c5dc277b62d88', {
          headers: { 'ngrok-skip-browser-warning': '1' }
        });
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setFiles(filesData || []);
        } else {
          console.error('Failed to fetch document details');
          setFiles([]);
        }
      } catch (error) {
        console.error('Error fetching document details:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // Button handlers
  const handleViewFile = async (file) => {
    try {
      // Use only Document View API to fetch the file content
      const response = await fetch(`/apis/document-view/${getFileId(file)}`, {
        headers: { 'ngrok-skip-browser-warning': '1' }
      });
      if (!response.ok) {
        console.error('Failed to fetch document view for', getFileId(file));
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewModal({ open: true, file: { ...file, url } });
    } catch (error) {
      console.error('Error fetching document view:', error);
    }
  };

  const handleDownloadFile = (file) => {
    console.log('Downloading file:', file.name);
    // In a real app, this would trigger a download
  };

  const handleMoreActions = (file) => {
    console.log('More actions for file:', file.name);
    // In a real app, this would open a dropdown menu
  };

  const getFileName = (file) => (file && (file.name || file.filename || ''));
  const getFileId = (file) => (file && (file.documentId || file.id || ''));

  const handlePreviewFile = (file) => {
    setPreviewModal({ open: true, file });
  };

  const closePreviewModal = () => {
    if (previewModal.file && previewModal.file.url) {
      try { URL.revokeObjectURL(previewModal.file.url); } catch (e) {}
    }
    setPreviewModal({ open: false, file: null });
  };

  // const handleUpload = () => {
  //   console.log('Upload button clicked');
  //   // In a real app, this would open a file picker
  // };

  // const handleNewFolder = () => {
  //   console.log('New Folder button clicked');
  //   // In a real app, this would open a dialog to create a folder
  // };

  const handlePanelItemClick = (type, id) => {
    if (type === 'event') {
      setSelectedEvent(selectedEvent === id.toString() ? '' : id.toString());
      setSelectedTask(''); // Clear task selection when event changes
    } else if (type === 'task') {
      setSelectedTask(selectedTask === id.toString() ? '' : id.toString());
      setSelectedEvent(''); // Clear event selection when task changes
    }
  };

  const getFilePreview = (file) => {
    if (file.url) {
      switch (file.type) {
        case 'image':
          return <img src={file.url} alt={file.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handlePreviewFile(file)} />;
        case 'video':
          return <video src={file.url} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handlePreviewFile(file)} />;
        case 'audio':
          return <audio src={file.url} controls style={{ width: '100px', height: '30px', cursor: 'pointer' }} onClick={() => handlePreviewFile(file)} />;
        default:
          break;
      }
    }

    // Fallback to icons for non-media files or files without URLs
    switch (file.type) {
      case 'pdf':
        return <FileText size={20} />;
      case 'image':
        return <Image size={20} />;
      case 'video':
        return <Video size={20} />;
      case 'audio':
        return <Music size={20} />;
      case 'archive':
        return <Archive size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const name = (file && (file.name || file.filename || ''));
      const matchesSearch = name.toString().toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchesEvent = !selectedEvent || (file.eventId && file.eventId.toString() === selectedEvent);
      const matchesTask = !selectedTask || (file.taskId && file.taskId.toString() === selectedTask);
      const matchesCategory = !selectedCategory || file.category === selectedCategory;
      const matchesType = !selectedType || file.type === selectedType;
      return matchesSearch && matchesEvent && matchesTask && matchesCategory && matchesType;
    });
  }, [files, searchTerm, selectedEvent, selectedTask, selectedCategory, selectedType]);

  // Derive unique events and tasks from files metadata (no separate events/tasks APIs)
  const uniqueEvents = useMemo(() => {
    const map = new Map();
    files.forEach(f => {
      if (f.eventId) {
        map.set(f.eventId, { id: f.eventId, name: f.eventName || `Event ${f.eventId}` });
      }
    });
    return Array.from(map.values());
  }, [files]);

  const uniqueTasks = useMemo(() => {
    const map = new Map();
    files.forEach(f => {
      if (f.taskId) {
        map.set(f.taskId, { id: f.taskId, name: f.taskName || `Task ${f.taskId}` });
      }
    });
    return Array.from(map.values());
  }, [files]);

  const renderAllFiles = () => {
    if (viewMode === 'grid') {
      return (
        <div className="files-grid">
          {filteredFiles.length === 0 ? (
            <div className="no-files">No files found</div>
          ) : (
            filteredFiles.map(file => (
              <div key={getFileId(file)} className="file-card">
                <div className="file-card-header">
                  <div className="file-card-preview">
                    {getFilePreview(file)}
                  </div>
                  <div className="file-card-info">
                    <div className="file-card-name">{getFileName(file)}</div>
                    <div className="file-card-meta">
                      <div>{(file.eventName || (file.eventId ? `Event ${file.eventId}` : ''))} - {(file.taskName || (file.taskId ? `Task ${file.taskId}` : ''))}</div>
                      <div>{file.category === 'work' ? 'Work' : 'Reference'}</div>
                    </div>
                  </div>
                </div>
                <div className="file-card-body">
                  <div className="file-card-details">
                    <div className="file-card-detail">
                      <span className="file-card-detail-label">Uploaded by:</span>
                      <span className="file-card-detail-value">{file.uploadedBy}</span>
                    </div>
                    <div className="file-card-detail">
                      <span className="file-card-detail-label">Date:</span>
                      <span className="file-card-detail-value">{file.uploadDate}</span>
                    </div>
                  </div>
                  <div className="file-card-actions">
                    <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                    <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                    <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      );
    } else {
      return (
        <div className="file-list">
          {filteredFiles.length === 0 ? (
            <div className="no-files">No files found</div>
          ) : (
            filteredFiles.map(file => (
              <div key={getFileId(file)} className="file-item">
                <div className="file-icon">{getFilePreview(file)}</div>
                <div className="file-name">{getFileName(file)}</div>
                <div className="file-entity">
                  {(file.eventName || (file.eventId ? `Event ${file.eventId}` : ''))} - {(file.taskName || (file.taskId ? `Task ${file.taskId}` : ''))}
                </div>
                <div className="file-category">
                  {file.category === 'work' ? <Wrench size={16} /> : <BookOpen size={16} />}
                  {file.category}
                </div>
                <div className="file-uploaded-by">{file.uploadedBy}</div>
                <div className="file-upload-date">{file.uploadDate}</div>
                <div className="file_actions">
                  <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                  <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                  <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }
  };

  const renderByEvent = () => {
    const groupedByEvent = filteredFiles.reduce((acc, file) => {
      const eventId = file.eventId || 'no-event';
      if (!acc[eventId]) {
        acc[eventId] = {
          event: { id: eventId, name: file.eventName || (file.eventId ? `Event ${file.eventId}` : 'Unspecified') },
          eventFiles: [],
          tasks: {}
        };
      }

      if (!file.taskId) {
        acc[eventId].eventFiles.push(file);
      } else {
        const taskId = file.taskId;
        if (!acc[eventId].tasks[taskId]) acc[eventId].tasks[taskId] = { task: { id: taskId, name: file.taskName || `Task ${taskId}` }, workFiles: [], referenceFiles: [] };
        if (file.category === 'work') acc[eventId].tasks[taskId].workFiles.push(file);
        else acc[eventId].tasks[taskId].referenceFiles.push(file);
      }

      return acc;
    }, {});

    return (
      <div className="grouped-files">
        {Object.values(groupedByEvent).map(({ event, eventFiles, tasks }) => (
          <div key={event.id} className="event-group">
            <div
              className="group-header"
              onClick={() => setExpandedEvents(prev => ({ ...prev, [event.id]: !prev[event.id] }))}
            >
              {expandedEvents[event.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Calendar size={16} />
              {event.name}
            </div>
            {expandedEvents[event.id] && (
              <div className="group-files">
                {/* Event-level files */}
                {eventFiles.length > 0 && (
                  <div className="event-files-section">
                    <div className="sub-group-header">
                      <FolderKanban size={16} />
                      Event Files
                    </div>
                    {viewMode === 'grid' ? (
                      <div className="files-grid">
                        {eventFiles.map(file => (
                          <div key={getFileId(file)} className="file-card">
                            <div className="file-card-header">
                            <div className="file-card-preview">
                                {getFilePreview(file)}
                              </div>
                              <div className="file-card-info">
                                <div className="file-card-name">{getFileName(file)}</div>
                                <div className="file-card-meta">
                                  <div>{file.category === 'work' ? 'Work' : 'Reference'}</div>
                                </div>
                              </div>
                            </div>
                            <div className="file-card-body">
                              <div className="file-card-details">
                                <div className="file-card-detail">
                                  <span className="file-card-detail-label">Uploaded by:</span>
                                  <span className="file-card-detail-value">{file.uploadedBy}</span>
                                </div>
                                <div className="file-card-detail">
                                  <span className="file-card-detail-label">Date:</span>
                                  <span className="file-card-detail-value">{file.uploadDate}</span>
                                </div>
                              </div>
                              <div className="file-card-actions">
                                <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                                <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                                <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="file-list">
                        {eventFiles.map(file => (
                          <div key={getFileId(file)} className="file-item">
                            <div className="file-icon">{getFilePreview(file)}</div>
                            <div className="file-name">{getFileName(file)}</div>
                            <div className="file-category">
                              {file.category === 'work' ? <Wrench size={16} /> : <BookOpen size={16} />}
                              {file.category}
                            </div>
                            <div className="file-uploaded-by">{file.uploadedBy}</div>
                            <div className="file-upload-date">{file.uploadDate}</div>
                            <div className="file_actions">
                              <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                              <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                              <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tasks under this event */}
                {Object.values(tasks).map(({ task, workFiles, referenceFiles }) => (
                  <div key={task.id} className="task-group">
                    <div
                      className="group-header task-header"
                      onClick={() => setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                    >
                      {expandedTasks[task.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <CheckSquare size={16} />
                      {task.name}
                    </div>
                    {expandedTasks[task.id] && (
                      <div className="group-files task-files">
                        <div className="sub-group">
                          <div className="sub-group-header">
                            <Wrench size={16} />
                            Work Files
                          </div>
                          {viewMode === 'grid' ? (
                            <div className="files-grid">
                              {workFiles.map(file => (
                                <div key={getFileId(file)} className="file-card">
                                  <div className="file-card-header">
                                    <div className="file-card-preview">
                                      {getFilePreview(file)}
                                    </div>
                                    <div className="file-card-info">
                                      <div className="file-card-name">{getFileName(file)}</div>
                                    </div>
                                  </div>
                                  <div className="file-card-body">
                                    <div className="file-card-details">
                                      <div className="file-card-detail">
                                        <span className="file-card-detail-label">Uploaded by:</span>
                                        <span className="file-card-detail-value">{file.uploadedBy}</span>
                                      </div>
                                      <div className="file-card-detail">
                                        <span className="file-card-detail-label">Date:</span>
                                        <span className="file-card-detail-value">{file.uploadDate}</span>
                                      </div>
                                    </div>
                                    <div className="file-card-actions">
                                      <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                                      <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                                      <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="file-list">
                              {workFiles.map(file => (
                                <div key={getFileId(file)} className="file-item">
                                  <div className="file-icon">{getFilePreview(file)}</div>
                                  <div className="file-name">{getFileName(file)}</div>
                                  <div className="file-uploaded-by">{file.uploadedBy}</div>
                                  <div className="file-upload-date">{file.uploadDate}</div>
                                  <div className="file_actions">
                                    <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                                    <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                                    <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="sub-group">
                          <div className="sub-group-header">
                            <BookOpen size={16} />
                            Reference Files
                          </div>
                          {viewMode === 'grid' ? (
                            <div className="files-grid">
                              {referenceFiles.map(file => (
                                <div key={getFileId(file)} className="file-card">
                            <div className="file-card-header">
                              <div className="file-card-preview">
                                {getFilePreview(file)}
                              </div>
                              <div className="file-card-info">
                                <div className="file-card-name">{getFileName(file)}</div>
                              </div>
                            </div>
                                  <div className="file-card-body">
                                    <div className="file-card-details">
                                      <div className="file-card-detail">
                                        <span className="file-card-detail-label">Uploaded by:</span>
                                        <span className="file-card-detail-value">{file.uploadedBy}</span>
                                      </div>
                                      <div className="file-card-detail">
                                        <span className="file-card-detail-label">Date:</span>
                                        <span className="file-card-detail-value">{file.uploadDate}</span>
                                      </div>
                                    </div>
                                    <div className="file-card-actions">
                                      <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                                      <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                                      <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="file-list">
                              {referenceFiles.map(file => (
                                <div key={getFileId(file)} className="file-item">
                                  <div className="file-icon">{getFilePreview(file)}</div>
                                  <div className="file-name">{getFileName(file)}</div>
                                  <div className="file-uploaded-by">{file.uploadedBy}</div>
                                  <div className="file-upload-date">{file.uploadDate}</div>
                                  <div className="file_actions">
                                    <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                                    <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                                    <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderByTask = () => {
    const groupedByTask = filteredFiles.reduce((acc, file) => {
      if (!file.taskId) return acc;
      const taskId = file.taskId;
      if (!acc[taskId]) acc[taskId] = { task: { id: taskId, name: file.taskName || `Task ${taskId}` }, workFiles: [], referenceFiles: [] };
      if (file.category === 'work') acc[taskId].workFiles.push(file);
      else acc[taskId].referenceFiles.push(file);
      return acc;
    }, {});

    return (
      <div className="grouped-files">
        {Object.values(groupedByTask).map(({ task, workFiles, referenceFiles }) => (
          <div key={task.id} className="task-group">
            <div
              className="group-header"
              onClick={() => setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
            >
              {expandedTasks[task.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <CheckSquare size={16} />
              {task.name}
            </div>
            {expandedTasks[task.id] && (
              <div className="group-files">
                <div className="sub-group">
                  <div className="sub-group-header">
                    <Wrench size={16} />
                    Work Files
                  </div>
                  {workFiles.map(file => (
                    <div key={getFileId(file)} className="file-item">
                      <div className="file-icon">{getFilePreview(file)}</div>
                      <div className="file-name">{getFileName(file)}</div>
                      <div className="file-uploaded-by">{file.uploadedBy}</div>
                      <div className="file-upload-date">{file.uploadDate}</div>
                      <div className="file_actions">
                        <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                        <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                        <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                  <div className="sub-group">
                    <div className="sub-group-header">
                      <BookOpen size={16} />
                      Reference Files
                    </div>
                    {referenceFiles.map(file => (
                      <div key={getFileId(file)} className="file-item">
                        <div className="file-icon">{getFilePreview(file)}</div>
                        <div className="file-name">{getFileName(file)}</div>
                        <div className="file-uploaded-by">{file.uploadedBy}</div>
                        <div className="file-upload-date">{file.uploadDate}</div>
                        <div className="file_actions">
                          <button className="action-btn" onClick={() => handleViewFile(file)}>View</button>
                          <button className="action-btn" onClick={() => handleDownloadFile(file)}><Download size={16} /></button>
                          <button className="action-btn" onClick={() => handleMoreActions(file)}><MoreVertical size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // const renderLeftPanel = () => (
  //   <div className="left-panel">
  //     <div className="panel-section">
  //       <div className="section-header">Events</div>
  //       {mockData.events.map(event => (
  //         <div key={event.id} className="panel-item" onClick={() => setSelectedEvent(event.id.toString())}>
  //           <Calendar size={16} />
  //           {event.name}
  //         </div>
  //       ))}
  //     </div>
  //     <div className="panel-section">
  //       <div className="section-header">Tasks</div>
  //       {mockData.tasks.map(task => (
  //         <div key={task.id} className="panel-item" onClick={() => setSelectedTask(task.id.toString())}>
  //           <CheckSquare size={16} />
  //           {task.name}
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  const renderRightPanelContent = () => {
    switch (activeTab) {
      case 'all':
        return renderAllFiles();
      case 'byEvent':
        return renderByEvent();
      case 'byTask':
        return renderByTask();
      default:
        return renderAllFiles();
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'all':
        return 'All Files';
      case 'byEvent':
        return 'Files by Event';
      case 'byTask':
        return 'Files by Task';
      default:
        return 'All Files';
    }
  };

  const renderRightPanel = () => (
    <>
      <div className="right-panel-header">
        <div className="right-panel-header-left">
          <h2>{getTabTitle()}</h2>
        </div>
        <div className="right-panel-header-controls">
          <div className="view-toggle">
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Tiles View"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="right-panel-body">
        <div className="files-section">
          <div className="files-section-header">
            <div className="files-section-header-left">
              <FileText size={16} />
              {getTabTitle()} ({filteredFiles.length})
            </div>
            {/* <div className="files-section-actions">
              <button className="action-btn" onClick={handleUpload}>
                Upload
              </button>
              <button className="action-btn" onClick={handleNewFolder}>
                New Folder
              </button>
            </div> */}
          </div>
          <div className="files-content">
            {renderRightPanelContent()}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="file-manager">
      <div className="header">
        <h1>File Manager</h1>
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            <option value="">All Events</option>
            {uniqueEvents.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
          <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
            <option value="">All Tasks</option>
            {uniqueTasks.map(task => (
              <option key={task.id} value={task.id}>{task.name}</option>
            ))}
          </select>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="work">Work</option>
            <option value="reference">Reference</option>
          </select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="docx">Document</option>
            <option value="archive">Archive</option>
          </select>
        </div>
      </div>
      <div className="tabs">
        <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All Files</button>
        <button className={activeTab === 'byEvent' ? 'active' : ''} onClick={() => setActiveTab('byEvent')}>By Event</button>
        <button className={activeTab === 'byTask' ? 'active' : ''} onClick={() => setActiveTab('byTask')}>By Task</button>
      </div>
      <div className="main_content">
        {/* {renderLeftPanel()} */}
        <div className="right-panel">
          {renderRightPanel()}
        </div>
      </div>
      {previewModal.open && (
        <div className="preview-modal-overlay" onClick={closePreviewModal}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="preview-modal-close" onClick={closePreviewModal}>
              <X size={24} />
            </button>
            <div className="preview-modal-content">
              {previewModal.file.type === 'image' && (
                <img src={previewModal.file.url} alt={getFileName(previewModal.file)} className="preview-image" />
              )}
              {previewModal.file.type === 'video' && (
                <video src={previewModal.file.url} controls className="preview-video" />
              )}
              {previewModal.file.type === 'audio' && (
                <audio src={previewModal.file.url} controls className="preview-audio" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
