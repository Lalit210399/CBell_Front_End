// Mock data for File Manager
export const mockUsers = {
  admin: {
    id: 1,
    name: 'John Admin',
    role: 'admin',
    email: 'admin@example.com'
  },
  manager: {
    id: 2,
    name: 'Sarah Manager',
    role: 'manager',
    email: 'manager@example.com'
  },
  designer: {
    id: 3,
    name: 'Mike Designer',
    role: 'designer',
    email: 'designer@example.com'
  }
};

export const mockEvents = [
  {
    id: 'evt-001',
    name: 'Product Launch Campaign',
    description: 'Marketing campaign for new product launch',
    createdBy: 1,
    createdAt: '2025-11-01T10:00:00Z',
    status: 'active',
    tasks: ['task-001', 'task-002', 'task-003']
  },
  {
    id: 'evt-002',
    name: 'Brand Redesign Project',
    description: 'Complete brand identity redesign',
    createdBy: 2,
    createdAt: '2025-11-05T09:00:00Z',
    status: 'active',
    tasks: ['task-004', 'task-005']
  },
  {
    id: 'evt-003',
    name: 'Holiday Season Content',
    description: 'Social media content for holiday season',
    createdBy: 1,
    createdAt: '2025-11-10T14:30:00Z',
    status: 'active',
    tasks: ['task-006', 'task-007', 'task-008']
  }
];

export const mockTasks = [
  {
    id: 'task-001',
    eventId: 'evt-001',
    name: 'Social Media Graphics',
    description: 'Create social media graphics for product launch',
    assignedTo: 3,
    createdBy: 2,
    createdAt: '2025-11-02T10:00:00Z',
    status: 'in-progress',
    files: ['file-001', 'file-002', 'file-003']
  },
  {
    id: 'task-002',
    eventId: 'evt-001',
    name: 'Product Photography',
    description: 'Product photos for website and ads',
    assignedTo: 3,
    createdBy: 1,
    createdAt: '2025-11-03T11:00:00Z',
    status: 'completed',
    files: ['file-004', 'file-005']
  },
  {
    id: 'task-003',
    eventId: 'evt-001',
    name: 'Email Templates',
    description: 'Design email templates for campaign',
    assignedTo: 2,
    createdBy: 1,
    createdAt: '2025-11-04T09:00:00Z',
    status: 'pending',
    files: ['file-006']
  },
  {
    id: 'task-004',
    eventId: 'evt-002',
    name: 'Logo Design',
    description: 'New logo design concepts',
    assignedTo: 3,
    createdBy: 2,
    createdAt: '2025-11-06T10:00:00Z',
    status: 'in-progress',
    files: ['file-007', 'file-008', 'file-009', 'file-010']
  },
  {
    id: 'task-005',
    eventId: 'evt-002',
    name: 'Brand Guidelines',
    description: 'Document brand guidelines',
    assignedTo: 2,
    createdBy: 1,
    createdAt: '2025-11-07T15:00:00Z',
    status: 'in-progress',
    files: ['file-011', 'file-012']
  },
  {
    id: 'task-006',
    eventId: 'evt-003',
    name: 'Holiday Banners',
    description: 'Create holiday season banners',
    assignedTo: 3,
    createdBy: 2,
    createdAt: '2025-11-11T10:00:00Z',
    status: 'in-progress',
    files: ['file-013', 'file-014']
  },
  {
    id: 'task-007',
    eventId: 'evt-003',
    name: 'Video Content',
    description: 'Short video clips for social media',
    assignedTo: 3,
    createdBy: 1,
    createdAt: '2025-11-12T14:00:00Z',
    status: 'pending',
    files: ['file-015', 'file-016']
  },
  {
    id: 'task-008',
    eventId: 'evt-003',
    name: 'Content Calendar',
    description: 'Plan content posting schedule',
    assignedTo: 2,
    createdBy: 1,
    createdAt: '2025-11-13T09:00:00Z',
    status: 'pending',
    files: ['file-017']
  }
];

export const mockFiles = [
  {
    id: 'file-001',
    taskId: 'task-001',
    name: 'facebook-post-1.png',
    type: 'image/png',
    size: 2048576,
    url: 'https://via.placeholder.com/800x600/FF6B6B/ffffff?text=Facebook+Post+1',
    uploadedBy: 3,
    uploadedAt: '2025-11-02T11:30:00Z',
    status: 'approved',
    approvedBy: 1,
    approvedAt: '2025-11-03T09:00:00Z'
  },
  {
    id: 'file-002',
    taskId: 'task-001',
    name: 'instagram-story.jpg',
    type: 'image/jpeg',
    size: 1536789,
    url: 'https://via.placeholder.com/1080x1920/4ECDC4/ffffff?text=Instagram+Story',
    uploadedBy: 3,
    uploadedAt: '2025-11-02T12:00:00Z',
    status: 'published',
    publishedBy: 2,
    publishedAt: '2025-11-04T10:00:00Z'
  },
  {
    id: 'file-003',
    taskId: 'task-001',
    name: 'twitter-banner.jpg',
    type: 'image/jpeg',
    size: 987654,
    url: 'https://via.placeholder.com/1500x500/95E1D3/ffffff?text=Twitter+Banner',
    uploadedBy: 3,
    uploadedAt: '2025-11-02T14:00:00Z'
  },
  {
    id: 'file-004',
    taskId: 'task-002',
    name: 'product-main.jpg',
    type: 'image/jpeg',
    size: 3145728,
    url: 'https://via.placeholder.com/1200x900/F38181/ffffff?text=Product+Main',
    uploadedBy: 3,
    uploadedAt: '2025-11-03T13:00:00Z'
  },
  {
    id: 'file-005',
    taskId: 'task-002',
    name: 'product-details.png',
    type: 'image/png',
    size: 2621440,
    url: 'https://via.placeholder.com/1200x900/AA96DA/ffffff?text=Product+Details',
    uploadedBy: 3,
    uploadedAt: '2025-11-03T15:30:00Z'
  },
  {
    id: 'file-006',
    taskId: 'task-003',
    name: 'email-template.html',
    type: 'text/html',
    size: 45678,
    url: null,
    uploadedBy: 2,
    uploadedAt: '2025-11-04T11:00:00Z'
  },
  {
    id: 'file-007',
    taskId: 'task-004',
    name: 'logo-concept-1.svg',
    type: 'image/svg+xml',
    size: 156789,
    url: null,
    uploadedBy: 3,
    uploadedAt: '2025-11-06T11:30:00Z'
  },
  {
    id: 'file-008',
    taskId: 'task-004',
    name: 'logo-concept-2.svg',
    type: 'image/svg+xml',
    size: 178234,
    url: null,
    uploadedBy: 3,
    uploadedAt: '2025-11-06T13:00:00Z'
  },
  {
    id: 'file-009',
    taskId: 'task-004',
    name: 'logo-concept-3.png',
    type: 'image/png',
    size: 456789,
    url: 'https://via.placeholder.com/800x800/FCBAD3/ffffff?text=Logo+3',
    uploadedBy: 3,
    uploadedAt: '2025-11-06T15:00:00Z'
  },
  {
    id: 'file-010',
    taskId: 'task-004',
    name: 'logo-final.ai',
    type: 'application/postscript',
    size: 2345678,
    url: null,
    uploadedBy: 3,
    uploadedAt: '2025-11-07T10:00:00Z'
  },
  {
    id: 'file-011',
    taskId: 'task-005',
    name: 'brand-guidelines.pdf',
    type: 'application/pdf',
    size: 5242880,
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    uploadedBy: 2,
    uploadedAt: '2025-11-07T16:00:00Z'
  },
  {
    id: 'file-012',
    taskId: 'task-005',
    name: 'color-palette.png',
    type: 'image/png',
    size: 234567,
    url: 'https://via.placeholder.com/1000x600/FFFFD2/333333?text=Color+Palette',
    uploadedBy: 2,
    uploadedAt: '2025-11-07T17:00:00Z'
  },
  {
    id: 'file-013',
    taskId: 'task-006',
    name: 'holiday-banner-desktop.jpg',
    type: 'image/jpeg',
    size: 1876543,
    url: 'https://via.placeholder.com/1920x600/A8E6CF/ffffff?text=Holiday+Banner+Desktop',
    uploadedBy: 3,
    uploadedAt: '2025-11-11T12:00:00Z'
  },
  {
    id: 'file-014',
    taskId: 'task-006',
    name: 'holiday-banner-mobile.jpg',
    type: 'image/jpeg',
    size: 987654,
    url: 'https://via.placeholder.com/750x1200/FFD3B6/ffffff?text=Holiday+Banner+Mobile',
    uploadedBy: 3,
    uploadedAt: '2025-11-11T13:30:00Z'
  },
  {
    id: 'file-015',
    taskId: 'task-007',
    name: 'promo-video.mp4',
    type: 'video/mp4',
    size: 15728640,
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    uploadedBy: 3,
    uploadedAt: '2025-11-12T15:00:00Z'
  },
  {
    id: 'file-016',
    taskId: 'task-007',
    name: 'background-music.mp3',
    type: 'audio/mpeg',
    size: 3145728,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    uploadedBy: 3,
    uploadedAt: '2025-11-12T16:00:00Z'
  },
  {
    id: 'file-017',
    taskId: 'task-008',
    name: 'content-calendar.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 456789,
    url: null,
    uploadedBy: 2,
    uploadedAt: '2025-11-13T10:30:00Z'
  }
];

// Helper functions
export const getEventsForUser = (userRole, userId) => {
  if (userRole === 'admin' || userRole === 'manager') {
    return mockEvents;
  }
  const designerTaskIds = mockTasks
    .filter(task => task.assignedTo === userId)
    .map(task => task.eventId);
  
  return mockEvents.filter(event => designerTaskIds.includes(event.id));
};

export const getTasksForUser = (userRole, userId, eventId = null) => {
  let filteredTasks = mockTasks;
  
  if (eventId) {
    filteredTasks = filteredTasks.filter(task => task.eventId === eventId);
  }
  
  if (userRole === 'designer') {
    filteredTasks = filteredTasks.filter(task => task.assignedTo === userId);
  }
  
  return filteredTasks;
};

export const getFilesForTask = (taskId) => {
  return mockFiles.filter(file => file.taskId === taskId);
};

export const getFilesForEvent = (eventId) => {
  const eventTasks = mockTasks.filter(task => task.eventId === eventId);
  const taskIds = eventTasks.map(task => task.id);
  return mockFiles.filter(file => taskIds.includes(file.taskId));
};

export const getUserById = (userId) => {
  return Object.values(mockUsers).find(user => user.id === userId);
};

export const canUploadFiles = (userRole) => {
  return ['admin', 'manager', 'designer'].includes(userRole);
};

export const getPublishedApprovedFiles = () => {
  return mockFiles.filter(file => file.status === 'published' || file.status === 'approved');
};

// API functions (no backend integration - just placeholders)
export const viewFileAPI = async (fileId) => {
  console.log('View File API called for:', fileId);
  const file = mockFiles.find(f => f.id === fileId);
  return { success: true, file };
};

export const downloadFileAPI = async (fileId) => {
  console.log('Download File API called for:', fileId);
  const file = mockFiles.find(f => f.id === fileId);
  if (file && file.url) {
    // Simulate download
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, message: 'File downloaded' };
  }
  return { success: false, message: 'File not found' };
};
