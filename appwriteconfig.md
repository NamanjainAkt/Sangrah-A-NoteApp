# Appwrite Database Schema Guide

Complete guide to set up all collections and attributes for the NotesApp in Appwrite.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Collections Overview](#collections-overview)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Collection Schemas](#collection-schemas)
   - [Notes Collection](#notes-collection)
   - [Goals Collection](#goals-collection)
   - [Activity Log Collection](#activity-log-collection)
   - [Notifications Collection](#notifications-collection)
   - [Tags Collection](#tags-collection)
   - [Reminders Collection](#reminders-collection)
   - [Backups Collection](#backups-collection)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- ✅ Appwrite project created
- ✅ Database created
- ✅ Database ID saved in `.env` file (`VITE_APPWRITE_DATABASE_ID`)
- ✅ User authentication working (you can log in)

---

## Collections Overview

The NotesApp requires **7 collections**:

| Collection | Purpose | Phase |
|------------|---------|--------|
| **notes** | Main notes storage | Phase 0 |
| **user_goals** | Daily/weekly goal tracking | Phase 2 |
| **user_activity_log** | Activity heatmap data | Phase 2 |
| **user_notifications** | Notification system | Phase 2 |
| **tags** | Note categorization | Phase 3 |
| **reminders** | Due dates and alerts | Phase 3 |
| **backups** | Data exports/imports | Phase 3 |

---

## Step-by-Step Setup

### Step 1: Open Appwrite Console

1. Go to [https://cloud.appwrite.io/](https://cloud.appwrite.io/)
2. Select your project
3. Click **Databases** in the left sidebar
4. Select your database
5. Click **Create Collection** button

---

## Collection Schemas

### 1. Notes Collection

**Collection ID**: `notes`
**Description**: Main collection for storing user notes with all features

#### Attributes

| Attribute Key | Type | Required | Default | Description |
|--------------|------|-----------|-------------|
| `title` | String | ✅ Yes | Note title (max 200 chars) |
| `content` | String | ✅ Yes | Note content (long text) |
| `userId` | String | ✅ Yes | User ID who owns the note |
| `isArchived` | Boolean | No | `false` | Whether note is archived |
| `isImportant` | Boolean | No | `false` | Whether note is marked important |
| `isDeleted` | Boolean | No | `false` | Whether note is deleted (soft delete) |
| `tasks` | Array | No | `[]` | Todo checklist items within note |
| `status` | String (Enum) | No | `"todo"` | Kanban column status |

#### Enum Options for `status`
- `todo` - In To Do column
- `in_progress` - In Progress column
- `done` - In Done column

#### Indexes

Create these indexes for optimal query performance:

**Index 1**:
- **Key**: `userId`
- **Type**: `key`

**Index 2**:
- **Key**: `userId`, `isDeleted`
- **Type**: `key`

**Index 3**:
- **Key**: `isArchived`, `isDeleted`
- **Type**: `key`

**Index 4**:
- **Key**: `status`
- **Type**: `key`

#### Permissions

**Default Collection Permissions**: `Any`
- ✅ Read: `Any`
- ✅ Create: `Any` (Document-level will restrict)
- ✅ Update: `Any` (Document-level will restrict)
- ✅ Delete: `Any` (Document-level will restrict)

**Document-Level Permissions** (set automatically by the app):
- ✅ Read: User who owns the note (`Role.user(userId)`)
- ✅ Update: User who owns the note (`Role.user(userId)`)
- ✅ Delete: User who owns the note (`Role.user(userId)`)

---

### 2. Goals Collection

**Collection ID**: `user_goals`
**Description**: User goals for daily/weekly targets

#### Attributes

| Attribute Key | Type | Required | Default | Description |
|--------------|------|-----------|-------------|
| `userId` | String | ✅ Yes | User ID who owns the goal |
| `title` | String | ✅ Yes | Goal title |
| `description` | String | No | `null` | Goal description |
| `target` | Integer | ✅ Yes | Target value (e.g., number of notes) |
| `current` | Integer | ✅ Yes | Current progress (starts at 0) |
| `goalType` | String (Enum) | ✅ Yes | `"daily"` | Goal frequency |
| `category` | String | ✅ Yes | `"notes"` | Goal category |
| `completed` | Boolean | ✅ Yes | `false` | Whether goal is completed |
| `completedAt` | String (ISO DateTime) | No | `null` | When goal was completed |
| `createdAt` | String (ISO DateTime) | ✅ Yes | Current timestamp | When goal was created |

#### Enum Options for `goalType`
- `daily` - Resets each day
- `weekly` - Resets each week

#### Enum Options for `category`
- `notes` - Create X notes
- `tasks` - Complete X tasks
- `pomodoro` - Complete X Pomodoro sessions
- `focusTime` - Focus for X minutes
- `heatmap` - Maintain X day streak

#### Indexes

**Index 1**:
- **Key**: `userId`
- **Type**: `key`

**Index 2**:
- **Key**: `userId`, `goalType`
- **Type**: `key`

**Index 3**:
- **Key**: `completed`
- **Type**: `key`

#### Permissions

**Default Collection Permissions**: `Any`
- ✅ Read: `Any`
- ✅ Create: `Any`
- ✅ Update: `Any`
- ✅ Delete: `Any`

**Document-Level Permissions**:
- ✅ Read: User who owns the goal
- ✅ Update: User who owns the goal
- ✅ Delete: User who owns the goal

---

### 3. Activity Log Collection

**Collection ID**: `user_activity_log`
**Description**: Daily activity tracking for heatmap and analytics

#### Attributes

| Attribute Key | Type | Required | Default | Description |
|--------------|------|-----------|-------------|
| `userId` | String | ✅ Yes | User ID |
| `date` | String (ISO Date) | ✅ Yes | Date of activity (YYYY-MM-DD) |
| `activities` | Array | ✅ Yes | `[]` | List of activities performed that day |

#### Activities Array Structure
Each activity object in the `activities` array contains:
```javascript
{
  "type": "note_created" | "task_completed" | "kanban_move" | "pomodoro_session",
  "count": 1, // Number of times performed
  "timestamp": "2025-01-19T10:30:00.000Z" // ISO timestamp
}
```

#### Activity Types
- `note_created` - User created a note
- `task_completed` - User completed a task
- `kanban_move` - User moved note between columns
- `pomodoro_session` - User completed a Pomodoro session

#### Indexes

**Index 1**:
- **Key**: `userId`
- **Type**: `key`

**Index 2**:
- **Key**: `userId`, `date`
- **Type**: `key`

**Index 3**:
- **Key**: `date`
- **Type**: `key`

#### Permissions

**Default Collection Permissions**: `Any`
- ✅ Read: `Any`
- ✅ Create: `Any`
- ✅ Update: `Any`
- ✅ Delete: `Any`

**Document-Level Permissions**:
- ✅ Read: User who owns the log
- ✅ Update: User who owns the log
- ✅ Delete: User who owns the log

---

### 4. Notifications Collection

**Collection ID**: `user_notifications`
**Description**: In-app and browser notifications

#### Attributes

| Attribute Key | Type | Required | Default | Description |
|--------------|------|-----------|-------------|
| `userId` | String | ✅ Yes | User ID to notify |
| `title` | String | ✅ Yes | Notification title |
| `message` | String | ✅ Yes | Notification message |
| `type` | String (Enum) | ✅ Yes | Notification type |
| `read` | Boolean | ✅ Yes | `false` | Whether user has read it |
| `createdAt` | String (ISO DateTime) | ✅ Yes | Current timestamp | When notification was created |
| `metadata` | Object | No | `null` | Additional data (badge earned, level up, etc.) |

#### Enum Options for `type`
- `badge_earned` - User earned a new badge
- `level_up` - User leveled up
- `streak_milestone` - User reached a streak milestone
- `goal_achieved` - User completed a goal
- `reminder_due` - Task due date approaching
- `reminder_overdue` - Task is overdue

#### Indexes

**Index 1**:
- **Key**: `userId`
- **Type**: `key`

**Index 2**:
- **Key**: `userId`, `read`
- **Type**: `key`

**Index 3**:
- **Key**: `createdAt`
- **Type**: `key`

#### Permissions

**Default Collection Permissions**: `Any`
- ✅ Read: `Any`
- ✅ Create: `Any`
- ✅ Update: `Any`
- ✅ Delete: `Any`

**Document-Level Permissions**:
- ✅ Read: User who owns the notification
- ✅ Update: User who owns the notification
- ✅ Delete: User who owns the notification

---

### 5. Tags Collection

**Collection ID**: `tags`
**Description**: Tags for organizing and categorizing notes

#### Attributes

| Attribute Key | Type | Required | Default | Description |
|--------------|------|-----------|-------------|
| `userId` | String | ✅ Yes | User ID who created the tag |
| `name` | String | ✅ Yes | Tag name (unique per user) |
| `color` | String | ✅ Yes | `"#3B82F6"` | Tag color (hex) |
| `usageCount` | Integer | ✅ Yes | `0` | How many notes use this tag |
| `createdAt` | String (ISO DateTime) | ✅ Yes | Current timestamp | When tag was created |

#### Color Options (Hex Values)
- `#3B82F6` - Blue (default)
- `#EF4444` - Red
- `#10B981` - Green
- `#F59E0B` - Yellow
- `#8B5CF6` - Purple
- `#EC4899` - Pink
- `#6366F1` - Indigo
- `#6B7280` - Gray

#### Indexes

**Index 1**:
- **Key**: `userId`
- **Type**: `key`

**Index 2**:
- **Key**: `userId`, `name`
- **Type**: `key`

**Index 3**:
- **Key**: `usageCount`
- **Type**: `key`

#### Permissions

**Default Collection Permissions**: `Any`
- ✅ Read: `Any`
- ✅ Create: `Any`
- ✅ Update: `Any`
- ✅ Delete: `Any`

**Document-Level Permissions**:
- ✅ Read: User who owns the tag
- ✅ Update: User who owns the tag
- ✅ Delete: User who owns the tag

---

### 6. Reminders Collection

**Collection ID**: `reminders`
**Description**: Due dates and reminder scheduling for notes

#### Attributes

| Attribute Key | Type | Required | Default | Description |
|--------------|------|-----------|-------------|
| `userId` | String | ✅ Yes | User ID |
| `noteId` | String | ✅ Yes | ID of note to remind about |
| `dueDate` | String (ISO DateTime) | ✅ Yes | Due date/time |
| `reminderTime` | String (ISO DateTime) | No | `null` | When to send reminder |
| `isCompleted` | Boolean | ✅ Yes | `false` | Whether task is completed |
| `isSnoozed` | Boolean | ✅ Yes | `false` | Whether user snoozed reminder |
| `snoozeCount` | Integer | ✅ Yes | `0` | How many times snoozed |
| `priority` | String (Enum) | No | `"normal"` | Priority level |
| `createdAt` | String (ISO DateTime) | ✅ Yes | Current timestamp | When reminder was created |

#### Enum Options for `priority`
- `low` - Low priority
- `normal` - Normal priority (default)
- `high` - High priority
- `urgent` - Urgent priority

#### Indexes

**Index 1**:
- **Key**: `userId`
- **Type**: `key`

**Index 2**:
- **Key**: `userId`, `dueDate`
- **Type**: `key`

**Index 3**:
- **Key**: `noteId`
- **Type**: `key`

**Index 4**:
- **Key**: `isCompleted`, `dueDate`
- **Type**: `key`

#### Permissions

**Default Collection Permissions**: `Any`
- ✅ Read: `Any`
- ✅ Create: `Any`
- ✅ Update: `Any`
- ✅ Delete: `Any`

**Document-Level Permissions**:
- ✅ Read: User who owns the reminder
- ✅ Update: User who owns the reminder
- ✅ Delete: User who owns the reminder

---

### 7. Backups Collection

**Collection ID**: `backups`
**Description**: Data exports and import history

#### Attributes

| Attribute Key | Type | Required | Default | Description |
|--------------|------|-----------|-------------|
| `userId` | String | ✅ Yes | User ID |
| `fileName` | String | ✅ Yes | Exported file name |
| `format` | String (Enum) | ✅ Yes | `"json"` | File format |
| `version` | String | ✅ Yes | `"1.0"` | Schema version |
| `dataSize` | Integer | ✅ Yes | `0` | Size in bytes |
| `documentCount` | Integer | ✅ Yes | `0` | Number of documents |
| `checksum` | String | ✅ Yes | SHA-256 hash | Data integrity checksum |
| `createdAt` | String (ISO DateTime) | ✅ Yes | Current timestamp | When backup was created |

#### Enum Options for `format`
- `json` - JSON format (full export)
- `csv` - CSV format (notes only)

#### Indexes

**Index 1**:
- **Key**: `userId`
- **Type**: `key`

**Index 2**:
- **Key**: `createdAt`
- **Type**: `key`

**Index 3**:
- **Key**: `format`
- **Type**: `key`

#### Permissions

**Default Collection Permissions**: `Any`
- ✅ Read: `Any`
- ✅ Create: `Any`
- ✅ Update: `Any`
- ✅ Delete: `Any`

**Document-Level Permissions**:
- ✅ Read: User who owns the backup
- ✅ Update: User who owns the backup
- ✅ Delete: User who owns the backup

---

## Verification

### Test Each Feature

After creating all collections, test each feature:

#### 1. Basic Notes (Core)
- ✅ Create a new note
- ✅ Edit note title and content
- ✅ Archive a note
- ✅ Mark note as important
- ✅ Delete a note (soft delete to bin)
- ✅ Restore from bin

#### 2. Todo Checklists (Phase 1)
- ✅ Add tasks to a note
- ✅ Toggle task completion
- ✅ Delete tasks from note
- ✅ See task progress in note card

#### 3. Kanban Board (Phase 1)
- ✅ See notes in To Do, In Progress, Done columns
- ✅ Drag notes between columns
- ✅ Status updates when moved
- ✅ Add quick notes to each column

#### 4. Gamification (Phase 1)
- ✅ Earn points for creating notes
- ✅ Earn points for completing tasks
- ✅ Earn points for moving to Done column
- ✅ See current level and XP
- ✅ View earned badges

#### 5. Goals & Streaks (Phase 2)
- ✅ Create a daily/weekly goal
- ✅ Track goal progress
- ✅ Complete a goal
- ✅ See streak days

#### 6. Discipline Heatmap (Phase 2)
- ✅ See activity heatmap in Settings
- ✅ See colored cells for active days
- ✅ Hover to see activity details

#### 7. Analytics Dashboard (Phase 2)
- ✅ View charts (notes over time, completion rate)
- ✅ Filter by time (week, month, year, all time)
- ✅ Export data as CSV or JSON

#### 8. Notifications (Phase 2)
- ✅ See notification badge count
- ✅ Read notifications
- ✅ Get browser notifications (if enabled)
- ✅ See achievement notifications (badges, level up)

#### 9. Pomodoro Timer (Phase 3)
- ✅ Start/pause/reset timer
- ✅ Complete work sessions
- ✅ Take break sessions
- ✅ See session history
- ✅ Earn points for completed sessions

#### 10. Tags (Phase 3)
- ✅ Create tags with colors
- ✅ Assign tags to notes
- ✅ Filter notes by tag
- ✅ See tag cloud

#### 11. Reminders (Phase 3)
- ✅ Set due dates on notes
- ✅ See reminders in calendar
- ✅ See overdue reminders
- ✅ Mark reminders as completed
- ✅ Snooze reminders

#### 12. Data Export (Phase 3)
- ✅ Export all notes as JSON
- ✅ Export notes as CSV
- ✅ Import JSON files
- ✅ See backup history

---

## Troubleshooting

### Common Issues

#### Issue: "Invalid document structure: Unknown attribute: X"

**Cause**: Attribute doesn't exist in collection schema

**Solution**:
1. Go to Database → Collection name → Edit Attributes
2. Add the missing attribute with correct type
3. Save changes

#### Issue: Queries are slow

**Cause**: Missing indexes on queried fields

**Solution**:
1. Go to Database → Collection name → Indexes
2. Add index for fields used in `Query.equal()`
3. Common indexes needed: `userId`, `userId` + `date`, `status`, `isDeleted`

#### Issue: Can't access user's own data

**Cause**: Permissions not set correctly

**Solution**:
1. Check Collection Permissions are set to `Any`
2. Document-level permissions should restrict access per user
3. The app automatically sets `Role.user(userId)` permissions when creating documents

#### Issue: Array fields showing as empty

**Cause**: Array type not set correctly in Appwrite

**Solution**:
1. In Appwrite Console, edit the attribute
2. Set type to **Array** (not String)
3. Array attributes in Appwrite should contain object elements, not primitive values

#### Issue: Date comparisons not working

**Cause**: Date format mismatch

**Solution**:
1. Ensure dates are stored as **ISO 8601 format**: `"2025-01-19T10:30:00.000Z"`
2. The app uses `new Date().toISOString()` to format dates
3. Queries use date strings in same format

#### Issue: Enum values not recognized

**Cause**: Case sensitivity or typo in enum values

**Solution**:
1. Check enum values match exactly (case-sensitive)
2. For `status`: use `"todo"`, `"in_progress"`, `"done"`
3. For `goalType`: use `"daily"`, `"weekly"`
4. For `priority`: use `"low"`, `"normal"`, `"high"`, `"urgent"`

---

## Environment Configuration

After creating all collections, ensure your `.env` file has correct IDs:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here
VITE_APPWRITE_DATABASE_ID=your_database_id_here
```

**Where to find IDs**:
- **Project ID**: Appwrite Console → Settings → General
- **Database ID**: Appwrite Console → Databases → Click your database → See URL: `.../databases/`**[DATABASE_ID_HERE]**`/collections`

---

## Feature Toggle Guide

After setting up schema, enable features in Settings:

| Feature | Setting Location | Required Collections |
|---------|------------------|---------------------|
| Todo Checklists | Settings → Features → Todo Checklists | notes (with `tasks` array) |
| Kanban View | Settings → Features → Kanban View | notes (with `status` field) |
| Gamification | Settings → Features → Gamification | notes (base functionality) |
| Goals & Streaks | Settings → Phase 2 → Goals & Streaks | user_goals, user_activity_log |
| Discipline Heatmap | Settings → Phase 2 → Discipline Heatmap | user_activity_log |
| Analytics Dashboard | Settings → Phase 2 → Analytics Dashboard | user_activity_log |
| Enhanced Notifications | Settings → Phase 2 → Enhanced Notifications | user_notifications |
| Pomodoro Timer | Settings → Phase 3 → Pomodoro Timer | notes (base functionality) |
| Tags | Settings → Phase 3 → Tags | notes (with `tags` array), tags |
| Reminders | Settings → Phase 3 → Reminders | notes (with `dueDate` field), reminders |
| Data Export | Settings → Phase 3 → Data Export | backups |

---

## Quick Reference Card

### Notes Collection
```
Collection ID: notes
Required Attributes: title, content, userId
Optional Attributes: isArchived, isImportant, isDeleted, tasks, status
```

### Goals Collection
```
Collection ID: user_goals
Required Attributes: userId, title, target, current, goalType, category, completed, createdAt
Optional Attributes: description, completedAt
```

### Activity Log Collection
```
Collection ID: user_activity_log
Required Attributes: userId, date, activities
```

### Notifications Collection
```
Collection ID: user_notifications
Required Attributes: userId, title, message, type, read, createdAt
Optional Attributes: metadata
```

### Tags Collection
```
Collection ID: tags
Required Attributes: userId, name, color, usageCount, createdAt
```

### Reminders Collection
```
Collection ID: reminders
Required Attributes: userId, noteId, dueDate, isCompleted, isSnoozed, snoozeCount, createdAt
Optional Attributes: reminderTime, priority
```

### Backups Collection
```
Collection ID: backups
Required Attributes: userId, fileName, format, version, dataSize, documentCount, checksum, createdAt
```

---

## Support

If you encounter issues:
1. Check this guide for the correct schema
2. Verify all required attributes are present
3. Check indexes are created for queried fields
4. Verify permissions are set correctly
5. Check `.env` file has correct database and collection IDs

---

**Last Updated**: January 19, 2026
**App Version**: All Phases (0, 1, 2, 3) Complete
**Collections Required**: 7
