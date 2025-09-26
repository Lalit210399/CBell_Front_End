# Task & UI Fixes

## Assign To column: If empty, show -.
- [ ] Update renderCell in EventAssignToMe.js for "assignTo" case to show "-" if empty
- [ ] Update renderCell in ActiveEvents.js for "assignTo" case to show "-" if empty
- [ ] Test the tables on events pages to confirm empty "Assign To" shows "-"
- [ ] Mark task as completed in TODO.md
## Events Campaign: Fix scrolling issue.
## Avatar: Set proper background.
## Events "Assign To Me" column: Hide in New Task.
## Tiles: Require double-click to reflect data in the table.
## API Calls: Avoid duplicate calls (currently triggered twice on single Tile click).
## Created By column: Fix tooltip.

## Table:
### Implement lazy loading.
### Fix column width.
### Add filter functionality.

## Events Handling
### Completed Events: Show only events from the last 7 days.
### Event Creation: Prevent multiple API calls on single click.
### Event Organizer / Event Input: Dropdown issues need fixing.

## Task Management
### Task Name: Validate / fix binding.
### Tabs: Hide tabs during task creation.
### Approval Button: Change color and update text to "Submit for Approval".
### New Task Button: Hide for users with Designer role.
### Scope Dropdown: Fix issue.
### Next / Default Task: Set proper handling.

## UI Enhancements
### Checkbox → Radio Button conversion where required.
### Status: Use badges for files and status indicators.
### Tiles: Update names as per requirement.
### Input Dropdown: Fix styling/behavior.
### Ctrl + Enter: Add shortcut functionality.

## File & Media Handling
### YouTube Button: Hide if file type is an image (YouTube should not accept images).
### File Icons: Display based on file type.

## Notifications & Logs
### Success & Failure: Show popup messages.
### Console Logs: Remove unnecessary logs.
### Email: Improve error handling.
### Facebook Integration: Fix related issues.
