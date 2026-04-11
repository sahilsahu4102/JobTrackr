# Phase 2: Kanban Board & Application CRUD

> **Status**: Complete ✅

## Overview
Phase 2 focused on building the core application feature: a functional, drag-and-drop Kanban Board using `@dnd-kit/core` with optimistic UI updates via `@tanstack/react-query`. The system allows a user to track job applications seamlessly through different stages of the funnel.

## Backend Implementation
1. **Application Model**: Created `Application` schema with indexing on `userId` and `status` to enable fast lookups. Includes fields like `company`, `role`, `status`, `jdLink`, `notes`, `requiredSkills` (which will be leveraged in Phase 3), and `order` for drag-and-drop sorting.
2. **Controller Logic**: Implemented endpoints to get, create, update, and delete applications.
3. **Reordering Engine**: Complex dragging logic relies on mathematical order gaps (e.g., initial item order is `1024`, between `1024` and `2048` is `1536`). 
   - `PATCH /api/applications/:id/status`: single app status change.
   - `PATCH /api/applications/reorder`: bulk updates multiple items efficiently inside a column using Mongoose `bulkWrite`.
4. **Validation**: Fully integrated request validation using Zod.

## Frontend Implementation
1. **Drag-and-Drop Structure**:
   - `KanbanBoard`: Stores the application local state, configures collision detection, and maps out the Board. Handled `dragOver` (for immediate optimistic visual feedback) and `dragEnd` (for final commit API calls).
   - `KanbanColumn`: An individual drop zone that utilizes `SortableContext` for vertical reordering.
   - `KanbanCard`: The actual draggable job application item displaying company name, role, date, and required skills chips.
2. **React Query Hooks**:
   - Built a robust set of hooks (`useApplications`, `useCreateApplication`, `useBatchReorder`, `useUpdateApplicationStatus`, `useDeleteApplication`) to manage asynchronous interaction with standard optimistic caching patterns (cancel running queries, update cache, and rollback on error).
3. **Modals**:
   - Built a custom Framer Motion portal-based `<Modal />` component to avoid bloated component trees from traditional 3rd party overlay libraries.
   - `AddApplicationModal`: Hooked up with `react-hook-form` + Zod to generate new applications manually.
   - `ApplicationModal`: Detailed, read-only view supporting application deletion.

## Next Steps (Phase 3)
Build out the AI pipeline:
1. Allow parsing job descriptions (JD) via OpenAI to auto-populate cards.
2. Resume analyzer that compares the generated application `requiredSkills` against the User profile.
