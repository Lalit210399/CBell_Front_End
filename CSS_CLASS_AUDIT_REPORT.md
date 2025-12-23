# CSS Class Audit Report

Scans src/**/*.{js,jsx,ts,tsx} that import CSS and compares className usage against the imported CSS selectors.

Generated: 2025-12-16T06:09:35.457Z
Total files flagged: 42

---
File: src\Pages\Task\Tasks.js
CSS imports: ./Tasks.css
Missing in imported CSS (16): assigned-users, dashboard-btn, dashboard-btn-primary, empty-state, error-state, filter-dropdown, retry-button, status-, tasks-content, tasks-controls, tasks-header, tasks-page-container, tasks-title, text-danger, user-avatar, user-count
Not found anywhere in src CSS (8): status-, tasks-content, tasks-controls, tasks-header, tasks-page-container, tasks-title, text-danger, user-count

---
File: src\CommonComponents\FileUpload\FileUpload.js
CSS imports: ./FileUpload.css
Missing in imported CSS (7): file-icon, icon, open-pdf-link, pdf-full-preview, pdf-open-link, pdf-thumb-large, upload-text
Not found anywhere in src CSS (6): file-icon, open-pdf-link, pdf-full-preview, pdf-open-link, pdf-thumb-large, upload-text

---
File: src\CommonComponents\FileandUpload\FilesAndUploads.js
CSS imports: ./FilesandUploads.css
Missing in imported CSS (5): animate-spin, avatar-text-large, file-icon, files-container, popup-header-right
Not found anywhere in src CSS (5): animate-spin, avatar-text-large, file-icon, files-container, popup-header-right

---
File: src\CommonComponents\ChatLayout\TaskFilesPanel.js
CSS imports: ./TaskFilesPanel.css
Missing in imported CSS (3): preview-audio, preview-video, status-
Not found anywhere in src CSS (3): preview-audio, preview-video, status-

---
File: src\CommonComponents\UserAuth\Login.js
CSS imports: ./Auth.css
Missing in imported CSS (3): auth-message, forgot-password-link, forgot-password-text
Not found anywhere in src CSS (3): auth-message, forgot-password-link, forgot-password-text

---
File: src\CommonComponents\ConversationModule\ConversationModule.js
CSS imports: ./Style.css
Missing in imported CSS (3): connection-error, retry-button, typing-names
Not found anywhere in src CSS (2): connection-error, typing-names

---
File: src\CommonComponents\EventsList\EventsList.js
CSS imports: react-loading-skeleton/dist/skeleton.css, ./EventsList.css
Missing CSS imports: react-loading-skeleton/dist/skeleton.css
Missing in imported CSS (3): event-date, event-org, status-header
Not found anywhere in src CSS (2): event-org, status-header

---
File: src\CommonComponents\TimelineCard\TimelineCard.js
CSS imports: ./TimelineCard.css
Missing in imported CSS (3): event-footer, no-events, skeleton-group
Not found anywhere in src CSS (2): event-footer, skeleton-group

---
File: src\Pages\Task\Publish\Publish.js
CSS imports: ./Publish.css
Missing in imported CSS (3): Publish_Section, icon-btn, status-
Not found anywhere in src CSS (2): Publish_Section, status-

---
File: src\CommonComponents\TabMenu\TabMenu.js
CSS imports: ./TabMenu.css
Missing in imported CSS (2): tab-content, tab-panel
Not found anywhere in src CSS (2): tab-content, tab-panel

---
File: src\CommonComponents\TaskTopSection\EditTopSection.js
CSS imports: ./EditTopSection.css, ./RevertModal.css
Missing in imported CSS (2): edit-top-status-, edit-top-user-dropdown-wrapper
Not found anywhere in src CSS (2): edit-top-status-, edit-top-user-dropdown-wrapper

---
File: src\Pages\Task\Tasks\Tasks.js
CSS imports: ../Tasks.css
Missing in imported CSS (2): Publish_Section, status-
Not found anywhere in src CSS (2): Publish_Section, status-

---
File: src\CommonComponents\ActiveEvents\ActiveEvents.js
CSS imports: ./ActiveEvents.css
Missing in imported CSS (3): clickable-cell, empty-field, fixed-height
Not found anywhere in src CSS (1): clickable-cell

---
File: src\CommonComponents\EventAssignToMe\EventAssignToMe.js
CSS imports: ./EventAssignToMe.css
Missing in imported CSS (3): clickable-cell, empty-field, fixed-height
Not found anywhere in src CSS (1): clickable-cell

---
File: src\Pages\Dashboard\Dashboard.js
CSS imports: ./Dashboard.css
Missing in imported CSS (3): add-icon, add_event, add_event_text
Not found anywhere in src CSS (1): add-icon

---
File: src\Pages\Task\Files_Uploads\FilesUploads.js
CSS imports: react-loading-skeleton/dist/skeleton.css, ../Tasks.css
Missing CSS imports: react-loading-skeleton/dist/skeleton.css
Missing in imported CSS (3): Publish_Section, file-card, files-grid
Not found anywhere in src CSS (1): Publish_Section

---
File: src\CommonComponents\RecentTaskBox\RecentTask.js
CSS imports: ./RecentTask.css
Missing in imported CSS (2): clickable-cell, fixed-height
Not found anywhere in src CSS (1): clickable-cell

---
File: src\CommonComponents\Avatar\Avatar.js
CSS imports: ./Avatar.css
Missing in imported CSS (1): avatar-fallback
Not found anywhere in src CSS (1): avatar-fallback

---
File: src\CommonComponents\Button\Button.js
CSS imports: ./Button.css
Missing in imported CSS (1): btn_icon
Not found anywhere in src CSS (1): btn_icon

---
File: src\CommonComponents\ChatLayout\ChatLayout.js
CSS imports: ./ChatLayout.css
Missing in imported CSS (1): status_
Not found anywhere in src CSS (1): status_

---
File: src\CommonComponents\List\List.js
CSS imports: ./List.css
Missing in imported CSS (1): guest-image
Not found anywhere in src CSS (1): guest-image

---
File: src\CommonComponents\MessageStrip\MessageStrip.js
CSS imports: ./MessageStrip.css
Missing in imported CSS (1): sapUiSmallMargin
Not found anywhere in src CSS (1): sapUiSmallMargin

---
File: src\CommonComponents\NotificationDropdown\NotificationDropdown.js
CSS imports: ./NotificationDropdown.css
Missing in imported CSS (1): highlighted-name
Not found anywhere in src CSS (1): highlighted-name

---
File: src\CommonComponents\NotificationDropdown\NotificationSidebar.js
CSS imports: ./NotificationSidebar.css
Missing in imported CSS (1): highlighted-name
Not found anywhere in src CSS (1): highlighted-name

---
File: src\CommonComponents\Table\Table.js
CSS imports: ./Table.css
Missing in imported CSS (1): no-data
Not found anywhere in src CSS (1): no-data

---
File: src\CommonComponents\Table\TableNew.js
CSS imports: ./TableNew.css
Missing in imported CSS (1): tn-no_data
Not found anywhere in src CSS (1): tn-no_data

---
File: src\CommonComponents\TaskTopSection\DetailTopSectionNew.js
CSS imports: ./DetailTopSectionNew.css
Missing in imported CSS (1): detail-top-user-dropdown-wrapper
Not found anywhere in src CSS (1): detail-top-user-dropdown-wrapper

---
File: src\CommonComponents\UserAuth\ForgotPassword.js
CSS imports: ./Auth.css
Missing in imported CSS (1): auth-message
Not found anywhere in src CSS (1): auth-message

---
File: src\CommonComponents\UserAuth\Signup.js
CSS imports: ./Auth.css
Missing in imported CSS (1): auth-message
Not found anywhere in src CSS (1): auth-message

---
File: src\Pages\Task\TaskList.js
CSS imports: ./TaskList.css
Missing in imported CSS (1): status-
Not found anywhere in src CSS (1): status-

---
File: src\CommonComponents\SkeletonLoading\PageSkeleton.js
CSS imports: ./PageSkeleton.css
Missing in imported CSS (5): BreadCrumb, Inner-Content, Top-Section, event-detail-module, task-creation-module

---
File: src\CommonComponents\TaskTopSection\DetailTopSection.js
CSS imports: ./DetailTopSection.css
Missing in imported CSS (3): creator-avatar, user-details, view-mode-fields

---
File: src\Pages\NewDashboard\DesignerDashboard.js
CSS imports: ./DesignerDashboard.css
Missing in imported CSS (3): event-header, event-title, month-dropdown

---
File: src\CommonComponents\SocialMediaPost\Instagram.js
CSS imports: ./instagram.css
Missing in imported CSS (2): file-info, file-name

---
File: src\Pages\NewDashboard\Dashboard.js
CSS imports: ./Dashboard.css
Missing in imported CSS (2): event-header, event-title

---
File: src\Pages\Chat\NewChatLayout.js
CSS imports: ./NewChatLayout.css
Missing in imported CSS (1): page-loading

---
File: src\Pages\Event\Events.js
CSS imports: ./Events.css
Missing in imported CSS (1): empty-field

---
File: src\Pages\Task\EventDetailPage.js
CSS imports: ./Tasks.css
Missing in imported CSS (1): fade-in

---
File: src\Pages\Task\TaskDetailPage.js
CSS imports: ./Tasks.css, ../Task/Publish/Publish.css
Missing in imported CSS (1): fade-in

---
File: src\CommonComponents\Calendar\CustomCalendar.js
CSS imports: react-big-calendar/lib/css/react-big-calendar.css, ./Calendar.css
Missing CSS imports: react-big-calendar/lib/css/react-big-calendar.css

---
File: src\CommonComponents\Status_Card\Status_Card.js
CSS imports: react-loading-skeleton/dist/skeleton.css, ./Status_Card.css
Missing CSS imports: react-loading-skeleton/dist/skeleton.css

---
File: src\CommonComponents\TextEditor\TextEditor.js
CSS imports: quill/dist/quill.snow.css, ./TextEditor.css
Missing CSS imports: quill/dist/quill.snow.css
