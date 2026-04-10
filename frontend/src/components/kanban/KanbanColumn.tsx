import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Application, ApplicationStatus } from '../../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: ApplicationStatus;
  applications: Application[];
  onCardClick: (app: Application) => void;
}

const dotColors: Record<ApplicationStatus, string> = {
  'Applied': '#8a95ff',
  'Phone Screen': '#f59e0b',
  'Interview': '#c890ff',
  'Offer': '#10b981',
  'Rejected': '#ff6e84',
};

const badgeStyles: Record<ApplicationStatus, React.CSSProperties> = {
  'Applied': { backgroundColor: 'rgba(138,149,255,0.12)', color: '#8a95ff' },
  'Phone Screen': { backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  'Interview': { backgroundColor: 'rgba(200,144,255,0.12)', color: '#c890ff' },
  'Offer': { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' },
  'Rejected': { backgroundColor: 'rgba(255,110,132,0.12)', color: '#ff6e84' },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, applications, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: 'Column', status: id }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, width: 300, height: '100%' }}>
      {/* Column Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColors[id] }} />
          <h3 style={{ fontWeight: 600, color: '#dee5ff', fontSize: 14 }}>{id}</h3>
        </div>
        <div style={{ ...badgeStyles[id], padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>
          {applications.length}
        </div>
      </div>

      {/* Droppable Area */}
      <div 
        ref={setNodeRef}
        style={{
          flex: 1,
          borderRadius: 16,
          padding: 12,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'all 0.2s ease',
          backgroundColor: isOver ? 'rgba(20,31,56,0.8)' : 'rgba(9,19,40,0.5)',
          border: isOver ? '1.5px solid rgba(99,102,241,0.3)' : '1.5px solid rgba(64,72,93,0.1)',
          boxShadow: isOver ? 'inset 0 0 30px rgba(96,99,238,0.05)' : 'none',
        }}
      >
        <SortableContext 
          items={applications.map(app => app._id)} 
          strategy={verticalListSortingStrategy}
        >
          <div style={{ minHeight: 150, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {applications.map((app) => (
              <KanbanCard key={app._id} application={app} onClick={onCardClick} />
            ))}
            
            {applications.length === 0 && (
              <div style={{
                height: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                fontSize: 13,
                color: '#6d758c',
                border: '2px dashed rgba(64,72,93,0.3)',
                borderRadius: 12,
                backgroundColor: 'rgba(20,31,56,0.2)',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(20,31,56,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18, opacity: 0.8 }}>📥</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 600, color: '#8b95a5' }}>Empty</span>
                  <span style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.7 }}>Drop a job card here</span>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};
