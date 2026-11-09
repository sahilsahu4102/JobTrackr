import React from 'react';
import clsx from 'clsx';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Application, ApplicationStatus } from '../../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: ApplicationStatus;
  applications: Application[];
  onCardClick: (app: Application) => void;
}

/** One stage bay on the rail: a count tab, then the dockets hanging in it. */
export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, applications, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: 'Column', status: id },
  });

  return (
    <section className="bay" aria-label={`${id}, ${applications.length} applications`}>
      <div className="bay-head">
        <h3>{id}</h3>
        <span className="bay-count" aria-hidden="true">{applications.length}</span>
      </div>

      <div ref={setNodeRef} className={clsx('bay-body', isOver && 'is-over')}>
        <SortableContext items={applications.map((app) => app._id)} strategy={verticalListSortingStrategy}>
          <div className="bay-stack">
            {applications.map((app) => (
              <KanbanCard key={app._id} application={app} onClick={onCardClick} />
            ))}

            {applications.length === 0 && <div className="bay-empty">No dockets here. Drag one in.</div>}
          </div>
        </SortableContext>
      </div>
    </section>
  );
};
