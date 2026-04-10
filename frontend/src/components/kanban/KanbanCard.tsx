import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application } from '../../types';
import { Building2, Calendar, MapPin, Clock } from 'lucide-react';

interface KanbanCardProps {
  application: Application;
  onClick: (app: Application) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ application, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application._id, data: application });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: 'rgba(20,31,56,0.75)',
    backdropFilter: 'blur(16px)',
    border: isDragging ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(163,166,255,0.06)',
    borderRadius: 14,
    padding: 16,
    cursor: 'grab',
    touchAction: 'none',
    boxShadow: isDragging 
      ? '0 20px 60px rgba(96,99,238,0.12)' 
      : '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr));
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' };
    if (score >= 60) return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
    return { bg: 'rgba(255,110,132,0.15)', color: '#ff6e84' };
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(application)}
    >
      {/* Title + Match Score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h4 style={{ fontWeight: 600, color: '#dee5ff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: 8 }}>
          {application.role}
        </h4>
        {application.matchScore != null && (() => {
          const mc = getMatchColor(application.matchScore);
          return (
            <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, backgroundColor: mc.bg, color: mc.color, whiteSpace: 'nowrap' }}>
              {application.matchScore}%
            </span>
          );
        })()}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#a3aac4' }}>
          <Building2 size={12} style={{ marginRight: 6, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{application.company}</span>
        </div>
        
        {application.location && (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#a3aac4' }}>
            <MapPin size={12} style={{ marginRight: 6, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{application.location}</span>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#6d758c' }}>
          <Calendar size={12} style={{ marginRight: 6, flexShrink: 0 }} />
          <span>{formatDate(application.dateApplied)}</span>
        </div>
        
        {application.followUpDate && (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: (() => {
            const daysToFollowUp = (new Date(application.followUpDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            if (daysToFollowUp < 0) return '#ff6e84'; // Past due
            if (daysToFollowUp < 2) return '#f59e0b'; // Soon
            return '#8b95a5';
          })() }}>
            <Clock size={12} style={{ marginRight: 6, flexShrink: 0 }} />
            <span>Follow up: {formatDate(application.followUpDate)}</span>
          </div>
        )}
      </div>

      {/* Skill tags */}
      {application.requiredSkills && application.requiredSkills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(64,72,93,0.1)' }}>
          {application.requiredSkills.slice(0, 2).map((skill, index) => (
            <span 
              key={index} 
              style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 500, backgroundColor: 'rgba(15,25,48,0.8)', color: '#a3aac4' }}
            >
              {skill}
            </span>
          ))}
          {application.requiredSkills.length > 2 && (
            <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 500, backgroundColor: 'rgba(15,25,48,0.8)', color: '#6d758c' }}>
              +{application.requiredSkills.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
