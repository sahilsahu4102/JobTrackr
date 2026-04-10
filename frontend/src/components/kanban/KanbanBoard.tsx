import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Application, ApplicationStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { AddApplicationModal } from './AddApplicationModal';
import { ApplicationModal } from './ApplicationModal';
import { useApplications, useUpdateApplicationStatus, useBatchReorder } from '../../hooks/useApplications';
import { Plus, LogOut, User as UserIcon, Briefcase, BarChart3, Search, Filter, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLUMNS: ApplicationStatus[] = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'];

export const KanbanBoard: React.FC = () => {
  const { user, logout } = useAuth();
  const { data: applications = [], isLoading } = useApplications();
  const updateStatus = useUpdateApplicationStatus();
  const batchReorder = useBatchReorder();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

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

  const navigate = useNavigate();

  // Metrics Data for Chart
  const funnelData = useMemo(() => {
    const counts = STATUS_COLUMNS.reduce((acc, status) => {
      acc[status] = localApps.filter(a => a.status === status).length;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Applied', count: counts['Applied'] },
      { name: 'Phone', count: counts['Phone Screen'] },
      { name: 'Interview', count: counts['Interview'] },
      { name: 'Offer', count: counts['Offer'] },
      { name: 'Rejected', count: counts['Rejected'] },
    ];
  }, [localApps]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group applications by status and sort them by order
  const columns = useMemo(() => {
    let filteredApps = localApps;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredApps = filteredApps.filter(app => 
        app.company?.toLowerCase().includes(q) || 
        app.role?.toLowerCase().includes(q)
      );
    }

    if (filterScore !== 'all') {
      filteredApps = filteredApps.filter(app => {
        if (app.matchScore == null) return false;
        if (filterScore === 'high') return app.matchScore >= 80;
        if (filterScore === 'medium') return app.matchScore >= 60 && app.matchScore < 80;
        if (filterScore === 'low') return app.matchScore < 60;
        return true;
      });
    }

    const cols = STATUS_COLUMNS.reduce((acc, status) => {
      acc[status] = filteredApps
        .filter(app => app.status === status)
        .sort((a, b) => a.order - b.order);
      return acc;
    }, {} as Record<ApplicationStatus, Application[]>);
    return cols;
  }, [localApps, searchQuery, filterScore]);

  const activeApp = useMemo(() => 
    localApps.find(app => app._id === activeId), 
  [activeId, localApps]);

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
    
    const activeApp = localApps.find(app => app._id === activeId);
    if (!activeApp) return;
    
    const activeStatus = activeApp.status;
    let overStatus: ApplicationStatus;

    if (isOverAColumn) {
      overStatus = overId as ApplicationStatus;
    } else {
      const overApp = localApps.find(app => app._id === overId);
      if (!overApp) return;
      overStatus = overApp.status;
    }

    if (activeStatus !== overStatus) {
      setLocalApps((prev) => {
        const overItems = prev.filter(app => app.status === overStatus);
        
        // Add to end of column if dropping directly on column
        const overIndex = isOverAColumn ? 
          overItems.length + 1 : 
          overItems.findIndex(app => app._id === overId);

        let newOrder = 0;
        if (overItems.length > 0) {
           newOrder = overItems[Math.max(0, overIndex - 1)]?.order + 10 || 1024;
        }

        return prev.map(app => 
          app._id === activeId ? { ...app, status: overStatus, order: newOrder } : app
        );
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const isOverAColumn = STATUS_COLUMNS.includes(overId as any);

    // Read the original unmutated status from the server applications array
    const originalApp = applications.find(app => app._id === activeId);
    if (!originalApp) return;

    const originalStatus = originalApp.status;
    let overStatus: ApplicationStatus;

    if (isOverAColumn) {
      overStatus = overId as ApplicationStatus;
    } else {
      const overApp = localApps.find(app => app._id === overId);
      if (!overApp) return;
      overStatus = overApp.status;
    }

    const itemsInOverColumn = localApps
        .filter(app => app.status === overStatus)
        .sort((a,b) => a.order - b.order);
        
    const activeIndex = itemsInOverColumn.findIndex(app => app._id === activeId);
    let overIndex = 0;
    
    if (isOverAColumn) {
      overIndex = itemsInOverColumn.length - 1; 
    } else {
      overIndex = itemsInOverColumn.findIndex(app => app._id === overId);
    }

    if (originalStatus === overStatus && activeId !== overId) {
       const reorderedItems = arrayMove(itemsInOverColumn, activeIndex, overIndex);
       
       const updates = reorderedItems.map((item, index) => ({
         id: item._id,
         status: item.status,
         order: (index + 1) * 1024
       }));
       
       batchReorder.mutate(updates, {
         onError: (err) => {
            console.error("Batch Reorder Failed:", err);
         }
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
       
       updateStatus.mutate({ 
         id: activeId, 
         status: overStatus, 
         order: newOrder 
       }, {
         onError: (err) => {
            console.error("Drag Status Update Failed:", err);
         }
       });
    }
  };

  const handleCardClick = (application: Application) => {
    setSelectedApp(application);
  };

  const exportToCSV = () => {
    // Export all apps according to user request
    if (!localApps || localApps.length === 0) return;
    
    const headers = ['Company', 'Role', 'Status', 'Date Applied', 'Match Score', 'Location', 'Follow-up Date'];
    const rows = localApps.map(app => [
      `"${app.company.replace(/"/g, '""')}"`,
      `"${app.role.replace(/"/g, '""')}"`,
      `"${app.status}"`,
      new Date(app.dateApplied).toLocaleDateString(),
      app.matchScore ?? 'N/A',
      `"${app.location?.replace(/"/g, '""') || 'N/A'}"`,
      app.followUpDate ? new Date(app.followUpDate).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
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

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative" style={{ backgroundColor: '#060e20' }}>
        <nav style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 32px', backgroundColor: 'rgba(9,19,40,0.7)', borderBottom: '1px solid rgba(64,72,93,0.12)' }}>
          <div style={{ width: 120, height: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
        </nav>
        <div style={{ padding: 32 }}>
          <div style={{ width: 200, height: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: 300, height: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 32, animation: 'pulse 1.5s infinite' }} />
          <div style={{ display: 'flex', gap: 24 }}>
            {[1, 2, 3, 4, 5].map((col) => (
              <div key={col} style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 100, height: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 4, animation: 'pulse 1.5s infinite' }} />
                {[1, 2, 3].map((card) => (
                  <div key={card} style={{ width: '100%', height: 120, backgroundColor: 'rgba(20,31,56,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative" style={{ backgroundColor: '#060e20' }}>
      {/* Ambient background orbs */}
      <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,99,238,0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,144,255,0.06) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      
      {/* Sticky Navbar */}
      <nav style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', backgroundColor: 'rgba(9,19,40,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(64,72,93,0.12)', position: 'relative', zIndex: 20, flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #6063ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 20px rgba(96,99,238,0.3)' }}>
            <Briefcase size={18} />
          </div>
          <span className="gradient-text" style={{ fontSize: 18, fontWeight: 700 }}>JobTrackr</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={exportToCSV}>
            <Download size={16} className="mr-1.5" />
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <BarChart3 size={16} className="mr-1.5" />
            Dashboard
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <UserIcon size={16} className="mr-1.5" />
            Profile
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut size={16} className="mr-1.5" />
            Sign out
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} className="mr-1.5" />
            Add Application
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative" style={{ padding: 32, zIndex: 10 }}>
        {/* Header with Search and Filter */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#dee5ff', marginBottom: 4, letterSpacing: '-0.02em' }}>Your Applications</h1>
            <p style={{ color: '#a3aac4', fontSize: 14 }}>Welcome, {user?.name}. Track and manage your job hunt.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6d758c' }} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies, roles..." 
                style={{ width: '100%', backgroundColor: 'rgba(20,31,56,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 16px 10px 40px', color: '#dee5ff', fontSize: 14, outline: 'none', transition: 'all 0.2s ease' }} 
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6d758c' }} />
              <select 
                value={filterScore}
                onChange={(e) => setFilterScore(e.target.value)}
                style={{ appearance: 'none', backgroundColor: 'rgba(20,31,56,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 36px 10px 40px', color: '#dee5ff', fontSize: 14, outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">All Match Scores</option>
                <option value="high">High Match (80%+)</option>
                <option value="medium">Medium Match (60-79%)</option>
                <option value="low">Low Match (&lt;60%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics Dashboard */}
        {applications.length > 0 && (
          <div style={{ height: 140, marginBottom: 32, backgroundColor: 'rgba(9,19,40,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(64,72,93,0.12)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minWidth: 160, paddingRight: 24, borderRight: '1px solid rgba(64,72,93,0.12)' }}>
              <h3 style={{ fontSize: 40, fontWeight: 800, color: '#dee5ff' }}>{applications.length}</h3>
              <p style={{ color: '#a3aac4', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: 4 }}>Total Applications</p>
            </div>
            <div style={{ flex: 1, height: '100%', paddingLeft: 24 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={funnelData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6063ee" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6063ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141f38', borderColor: 'rgba(64,72,93,0.2)', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#a3a6ff' }}
                  />
                  <XAxis dataKey="name" stroke="#6d758c" fontSize={11} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="count" stroke="#6063ee" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto custom-scrollbar" style={{ paddingBottom: 16 }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex items-start" style={{ gap: 20, height: '100%', width: 'max-content' }}>
              {STATUS_COLUMNS.map((status) => (
                <KanbanColumn 
                  key={status} 
                  id={status} 
                  applications={columns[status]} 
                  onCardClick={handleCardClick}
                />
              ))}
            </div>

            <DragOverlay 
              dropAnimation={{
                 sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) 
              }}
            >
              {activeApp ? (
                <KanbanCard application={activeApp} onClick={() => {}} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Modals */}
      <AddApplicationModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      <ApplicationModal 
        application={selectedApp} 
        isOpen={!!selectedApp} 
        onClose={() => setSelectedApp(null)} 
      />
    </div>
  );
};
