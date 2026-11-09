import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Application, ApplicationStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { AddApplicationModal } from './AddApplicationModal';
import { ApplicationModal } from './ApplicationModal';
import { useApplications, useUpdateApplicationStatus, useBatchReorder } from '../../hooks/useApplications';
import { useSlowNote, WAKING_NOTE } from '../../hooks/useSlowNote';
import { followUpState } from '../../utils/followUp';
import { Plus, Search, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { AppBar } from '../layout/AppBar';

const STATUS_COLUMNS: ApplicationStatus[] = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'];

export const KanbanBoard: React.FC = () => {
  const { data: applications = [], isLoading, isError, refetch } = useApplications();
  const updateStatus = useUpdateApplicationStatus();
  const batchReorder = useBatchReorder();
  const slow = useSlowNote(isLoading);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Keep only the id: the sheet always shows the live application, so new notes and edits appear at once
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Local state for optimistic drag-and-drop
  const [localApps, setLocalApps] = useState<Application[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScore, setFilterScore] = useState<string>('all');

  // Sync local state when server data changes
  React.useEffect(() => {
    if (applications) {
      setLocalApps(applications);
    }
  }, [applications]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group applications by status and sort them by order
  const columns = useMemo(() => {
    let filteredApps = localApps;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredApps = filteredApps.filter(
        (app) => app.company?.toLowerCase().includes(q) || app.role?.toLowerCase().includes(q)
      );
    }

    if (filterScore !== 'all') {
      filteredApps = filteredApps.filter((app) => {
        if (app.matchScore == null) return false;
        if (filterScore === 'high') return app.matchScore >= 80;
        if (filterScore === 'medium') return app.matchScore >= 60 && app.matchScore < 80;
        if (filterScore === 'low') return app.matchScore < 60;
        return true;
      });
    }

    const cols = STATUS_COLUMNS.reduce((acc, status) => {
      acc[status] = filteredApps.filter((app) => app.status === status).sort((a, b) => a.order - b.order);
      return acc;
    }, {} as Record<ApplicationStatus, Application[]>);
    return cols;
  }, [localApps, searchQuery, filterScore]);

  const activeApp = useMemo(() => localApps.find((app) => app._id === activeId), [activeId, localApps]);
  const selectedApp = useMemo(() => localApps.find((app) => app._id === selectedId) ?? null, [selectedId, localApps]);

  const needAction = useMemo(() => localApps.filter((app) => followUpState(app)).length, [localApps]);

  // Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isOverAColumn = STATUS_COLUMNS.includes(overId as ApplicationStatus);

    const activeApp = localApps.find((app) => app._id === activeId);
    if (!activeApp) return;

    const activeStatus = activeApp.status;
    let overStatus: ApplicationStatus;

    if (isOverAColumn) {
      overStatus = overId as ApplicationStatus;
    } else {
      const overApp = localApps.find((app) => app._id === overId);
      if (!overApp) return;
      overStatus = overApp.status;
    }

    if (activeStatus !== overStatus) {
      setLocalApps((prev) => {
        const overItems = prev.filter((app) => app.status === overStatus);

        // Add to end of column if dropping directly on column
        const overIndex = isOverAColumn ? overItems.length + 1 : overItems.findIndex((app) => app._id === overId);

        let newOrder = 0;
        if (overItems.length > 0) {
          newOrder = overItems[Math.max(0, overIndex - 1)]?.order + 10 || 1024;
        }

        return prev.map((app) => (app._id === activeId ? { ...app, status: overStatus, order: newOrder } : app));
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const isOverAColumn = STATUS_COLUMNS.includes(overId as ApplicationStatus);

    // Read the original unmutated status from the server applications array
    const originalApp = applications.find((app) => app._id === activeId);
    if (!originalApp) return;

    const originalStatus = originalApp.status;
    let overStatus: ApplicationStatus;

    if (isOverAColumn) {
      overStatus = overId as ApplicationStatus;
    } else {
      const overApp = localApps.find((app) => app._id === overId);
      if (!overApp) return;
      overStatus = overApp.status;
    }

    const itemsInOverColumn = localApps.filter((app) => app.status === overStatus).sort((a, b) => a.order - b.order);

    const activeIndex = itemsInOverColumn.findIndex((app) => app._id === activeId);
    let overIndex = 0;

    if (isOverAColumn) {
      overIndex = itemsInOverColumn.length - 1;
    } else {
      overIndex = itemsInOverColumn.findIndex((app) => app._id === overId);
    }

    if (originalStatus === overStatus && activeId !== overId) {
      const reorderedItems = arrayMove(itemsInOverColumn, activeIndex, overIndex);

      const updates = reorderedItems.map((item, index) => ({
        id: item._id,
        status: item.status,
        order: (index + 1) * 1024,
      }));

      batchReorder.mutate(updates, {
        onError: (err) => {
          console.error('Batch Reorder Failed:', err);
        },
      });
    } else if (originalStatus !== overStatus) {
      let newOrder = 1024;

      if (itemsInOverColumn.length > 1) {
        const prevItem = itemsInOverColumn[overIndex - 1];
        const nextItem = itemsInOverColumn[overIndex + 1];

        if (prevItem && nextItem) {
          newOrder = Math.round((prevItem.order + nextItem.order) / 2);
        } else if (prevItem) {
          newOrder = Math.round(prevItem.order + 1024);
        } else if (nextItem) {
          newOrder = Math.round(nextItem.order / 2);
        }
      }

      updateStatus.mutate(
        {
          id: activeId,
          status: overStatus,
          order: newOrder,
        },
        {
          onError: (err) => {
            console.error('Drag Status Update Failed:', err);
          },
        }
      );
    }
  };

  const handleCardClick = (application: Application) => {
    setSelectedId(application._id);
  };

  const exportToCSV = () => {
    // Export all apps according to user request
    if (!localApps || localApps.length === 0) return;

    const headers = ['Company', 'Role', 'Status', 'Date Applied', 'Match Score', 'Location', 'Follow-up Date'];
    const rows = localApps.map((app) => [
      `"${app.company.replace(/"/g, '""')}"`,
      `"${app.role.replace(/"/g, '""')}"`,
      `"${app.status}"`,
      new Date(app.dateApplied).toLocaleDateString(),
      app.matchScore ?? 'N/A',
      `"${app.location?.replace(/"/g, '""') || 'N/A'}"`,
      app.followUpDate ? new Date(app.followUpDate).toLocaleDateString() : 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create temporary link to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobtrackr_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const appBarActions = (
    <>
      <Button variant="outline" size="sm" onClick={exportToCSV} disabled={localApps.length === 0}>
        <Download size={16} aria-hidden="true" />
        Export CSV
      </Button>
      <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
        <Plus size={16} aria-hidden="true" />
        Add application
      </Button>
    </>
  );

  if (isLoading) {
    return (
      <>
        <AppBar />
        <main className="page">
          <h1 className="page-title">Applications</h1>
          <div role="status" aria-live="polite">
            <p className="lede">Loading your applications…</p>
            {slow && <p className="wait-note">{WAKING_NOTE}</p>}
          </div>
        </main>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <AppBar />
        <main className="page">
          <h1 className="page-title">Applications</h1>
          <div role="alert" style={{ marginTop: 12 }}>
            <p className="lede">The applications could not be loaded. The server may still be waking up, or the connection dropped.</p>
            <Button variant="outline" style={{ marginTop: 16 }} onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppBar actions={appBarActions} />

      <main className="page">
        <div className="toolbar">
          <div>
            <h1 className="page-title">Applications</h1>
            <p className="lede">
              <strong>{applications.length}</strong> in total
              {needAction > 0 && (
                <>
                  {' · '}
                  <span className="needs-count">{needAction} need action</span>
                  <span> (follow-up overdue or due within two days)</span>
                </>
              )}
              {applications.length === 0 && ' · Use Add application to paste a posting.'}
            </p>
          </div>

          <div className="toolbar-controls">
            <div className="search-wrap">
              <Search size={16} aria-hidden="true" />
              <label className="visually-hidden" htmlFor="board-search">Search companies and roles</label>
              <input
                id="board-search"
                className="field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies, roles"
              />
            </div>
            <div>
              <label className="visually-hidden" htmlFor="board-score">Filter by match score</label>
              <select id="board-score" className="select" value={filterScore} onChange={(e) => setFilterScore(e.target.value)}>
                <option value="all">All match scores</option>
                <option value="high">High match (80%+)</option>
                <option value="medium">Medium match (60-79%)</option>
                <option value="low">Low match (under 60%)</option>
              </select>
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board">
            {STATUS_COLUMNS.map((status) => (
              <KanbanColumn key={status} id={status} applications={columns[status]} onCardClick={handleCardClick} />
            ))}
          </div>

          <DragOverlay>{activeApp ? <KanbanCard application={activeApp} onClick={() => {}} /> : null}</DragOverlay>
        </DndContext>
      </main>

      {/* Modals */}
      <AddApplicationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      <ApplicationModal application={selectedApp} isOpen={!!selectedApp} onClose={() => setSelectedId(null)} />
    </>
  );
};
