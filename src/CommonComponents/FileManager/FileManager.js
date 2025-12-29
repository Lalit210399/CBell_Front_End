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

  // API data states
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([
    {
      id: 1,
      name: 'sample-image.jpg',
      type: 'image',
      url: 'https://via.placeholder.com/300x200',
      category: 'work',
      uploadedBy: 'User1',
      uploadDate: '2023-10-01',
      eventId: 1,
      taskId: 1
    },
    {
      id: 2,
      name: 'sample-video.mp4',
      type: 'video',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      category: 'reference',
      uploadedBy: 'User2',
      uploadDate: '2023-10-02',
      eventId: 1,
      taskId: null
    },
    {
      id: 3,
      name: 'sample-audio.mp3',
      type: 'audio',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      category: 'work',
      uploadedBy: 'User3',
      uploadDate: '2023-10-03',
      eventId: 2,
      taskId: 2
    },
    {
      id: 4,
      name: 'document.pdf',
      type: 'pdf',
      category: 'reference',
      uploadedBy: 'User4',
      uploadDate: '2023-10-04',
      eventId: 2,
      taskId: 2
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch events
        const eventsResponse = await fetch('/apis/events', {
          headers: { 'ngrok-skip-browser-warning': '1' }
        });
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData);
        } else {
          console.error('Failed to fetch events');
          setEvents([]);
        }

        // Fetch tasks
        const tasksResponse = await fetch('/apis/tasks', {
          headers: { 'ngrok-skip-browser-warning': '1' }
        });
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
        } else {
          console.error('Failed to fetch tasks');
          setTasks([]);
        }

        // Fetch files based on active tab
        let fetchedFiles = [];
        if (activeTab === 'all') {
          // Fetch all files
          const filesResponse = await fetch('/apis/document-details', {
            headers: { 'ngrok-skip-browser-warning': '1' }
          });
          if (filesResponse.ok) {
            fetchedFiles = await filesResponse.json();
          } else {
            console.error('Failed to fetch all files');
            fetchedFiles = [];
          }
        } else if (activeTab === 'byEvent') {
          // Fetch event files - get files from all events
          const eventsData = events.length > 0 ? events : [];
          const eventFilesPromises = eventsData.map(async (event) => {
            try {
              const response = await fetch(`/apis/document-details/event/${event.id}?filter=event`, {
                headers: { 'ngrok-skip-browser-warning': '1' }
              });
              if (response.ok) {
                const eventFiles = await response.json();
                return eventFiles.map(file => ({ ...file, eventId: event.id, taskId: null }));
              }
              return [];
            } catch (error) {
              console.error(`Error fetching files for event ${event.id}:`, error);
              return [];
            }
          });
          const eventFilesArrays = await Promise.all(eventFilesPromises);
          fetchedFiles = eventFilesArrays.flat();
        } else if (activeTab === 'byTask') {
          // Fetch task files - get files from all tasks
          const tasksData = tasks.length > 0 ? tasks : [];
          const taskFilesPromises = tasksData.map(async (task) => {
            try {
              const response = await fetch(`/apis/document-details/task/${task.id}?filter=task`, {
                headers: { 'ngrok-skip-browser-warning': '1' }
              });
              if (response.ok) {
                const taskFiles = await response.json();
                return taskFiles.map(file => ({ ...file, eventId: task.eventId, taskId: task.id }));
              }
              return [];
            } catch (error) {
              console.error(`Error fetching files for task ${task.id}:`, error);
              return [];
            }
          });
          const taskFilesArrays = await Promise.all(taskFilesPromises);
          fetchedFiles = taskFilesArrays.flat();
        }
        setFiles(fetchedFiles);
      } catch (error) {
        console.error('Error fetching data:', error);
        setEvents([]);
        setTasks([]);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, events, tasks]);

  // Button handlers
  const handleViewFile = (file) => {
    console.log('Viewing file:', file.name);
    // In a real app, this would open the file in a viewer or download it
  };

  const handleDownloadFile = (file) => {
    console.log('Downloading file:', file.name);
    // In a real app, this would trigger a download
  };

  const handleMoreActions = (file) => {
    console.log('More actions for file:', file.name);
    // In a real app, this would open a dropdown menu
  };

  const handlePreviewFile = (file) => {
    setPreviewModal({ open: true, file });
  };

  const closePreviewModal = () => {
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
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEvent = !selectedEvent || file.eventId.toString() === selectedEvent;
      const matchesTask = !selectedTask || file.taskId.toString() === selectedTask;
      const matchesCategory = !selectedCategory || file.category === selectedCategory;
      const matchesType = !selectedType || file.type === selectedType;
      return matchesSearch && matchesEvent && matchesTask && matchesCategory && matchesType;
    });
  }, [files, searchTerm, selectedEvent, selectedTask, selectedCategory, selectedType]);

  const renderAllFiles = () => {
    if (viewMode === 'grid') {
      return (
        <div className="files-grid">
          {filteredFiles.length === 0 ? (
            <div className="no-files">No files found</div>
          ) : (
            filteredFiles.map(file => (
              <div key={file.id} className="file-card">
                <div className="file-card-header">
                  <div className="file-card-preview">
                    {getFilePreview(file)}
                  </div>
                  <div className="file-card-info">
                    <div className="file-card-name">{file.name}</div>
                    <div className="file-card-meta">
                      <div>{events.find(e => e.id === file.eventId)?.name} - {tasks.find(t => t.id === file.taskId)?.name}</div>
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
              <div key={file.id} className="file-item">
                <div className="file-icon">{getFilePreview(file)}</div>
                <div className="file-name">{file.name}</div>
                <div className="file-entity">
                  {events.find(e => e.id === file.eventId)?.name} - {tasks.find(t => t.id === file.taskId)?.name}
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
      const event = events.find(e => e.id === file.eventId);
      if (event) {
        if (!acc[event.id]) {
          acc[event.id] = {
            event,
            eventFiles: [],
            tasks: {}
          };
        }

        if (file.taskId === null) {
          // Event-level file
          acc[event.id].eventFiles.push(file);
        } else {
          // Task-level file
          const task = tasks.find(t => t.id === file.taskId);
          if (task) {
            if (!acc[event.id].tasks[task.id]) {
              acc[event.id].tasks[task.id] = { task, workFiles: [], referenceFiles: [] };
            }
            if (file.category === 'work') {
              acc[event.id].tasks[task.id].workFiles.push(file);
            } else {
              acc[event.id].tasks[task.id].referenceFiles.push(file);
            }
          }
        }
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
                          <div key={file.id} className="file-card">
                            <div className="file-card-header">
                            <div className="file-card-preview">
                                {getFilePreview(file)}
                              </div>
                              <div className="file-card-info">
                                <div className="file-card-name">{file.name}</div>
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
                          <div key={file.id} className="file-item">
                            <div className="file-icon">{getFilePreview(file)}</div>
                            <div className="file-name">{file.name}</div>
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
                                <div key={file.id} className="file-card">
                                  <div className="file-card-header">
                                    <div className="file-card-preview">
                                      {getFilePreview(file)}
                                    </div>
                                    <div className="file-card-info">
                                      <div className="file-card-name">{file.name}</div>
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
                                <div key={file.id} className="file-item">
                                  <div className="file-icon">{getFilePreview(file)}</div>
                                  <div className="file-name">{file.name}</div>
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
                                <div key={file.id} className="file-card">
                            <div className="file-card-header">
                              <div className="file-card-preview">
                                {getFilePreview(file)}
                              </div>
                              <div className="file-card-info">
                                <div className="file-card-name">{file.name}</div>
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
                                <div key={file.id} className="file-item">
                                  <div className="file-icon">{getFilePreview(file)}</div>
                                  <div className="file-name">{file.name}</div>
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
      const task = tasks.find(t => t.id === file.taskId);
      if (task) {
        if (!acc[task.id]) acc[task.id] = { task, workFiles: [], referenceFiles: [] };
        if (file.category === 'work') {
          acc[task.id].workFiles.push(file);
        } else {
          acc[task.id].referenceFiles.push(file);
        }
      }
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
                    <div key={file.id} className="file-item">
                      <div className="file-icon">{getFilePreview(file)}</div>
                      <div className="file-name">{file.name}</div>
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
                      <div key={file.id} className="file-item">
                        <div className="file-icon">{getFilePreview(file)}</div>
                        <div className="file-name">{file.name}</div>
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
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
          <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
            <option value="">All Tasks</option>
            {tasks.map(task => (
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
                <img src={previewModal.file.url} alt={previewModal.file.name} className="preview-image" />
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
