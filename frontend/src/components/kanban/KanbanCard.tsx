import React from 'react';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application } from '../../types';
import { followUpState, matchBand, MATCH_WORD } from '../../utils/followUp';

interface KanbanCardProps {
  application: Application;
  onClick: (app: Application) => void;
}

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr));

/** One docket on the rail. The whole docket drags; the Details button is the keyboard route to the sheet. */
export const KanbanCard: React.FC<KanbanCardProps> = ({ application, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application._id,
    data: application,
  });

  const urgency = followUpState(application);
  const closed = application.status === 'Rejected';
  const skills = application.requiredSkills ?? [];
  const extra = skills.length - 2;

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('docket', isDragging && 'is-dragging', urgency && 'needs-action', closed && 'is-closed')}
      {...attributes}
      role="group"
      aria-label={`${application.role} at ${application.company}`}
      {...listeners}
      onClick={() => onClick(application)}
    >
      <div className="docket-head">
        <h4>{application.role}</h4>
        {application.matchScore != null && (
          <span
            className={`score band-${matchBand(application.matchScore)}`}
            aria-label={`Match score ${application.matchScore} percent, ${MATCH_WORD[matchBand(application.matchScore)]}`}
          >
            {application.matchScore}
            <small>%</small>
          </span>
        )}
      </div>
      <p className="docket-company">{application.company}</p>

      <dl className="rows">
        {application.location && (
          <div>
            <dt>Location</dt>
            <dd>{application.location}</dd>
          </div>
        )}
        <div>
          <dt>Applied</dt>
          <dd>{formatDate(application.dateApplied)}</dd>
        </div>
        {application.followUpDate && (
          <div className={urgency ? 'urgent' : undefined}>
            <dt>Follow up</dt>
            <dd>
              {formatDate(application.followUpDate)}
              {urgency === 'overdue' && ' · overdue'}
              {urgency === 'soon' && ' · due soon'}
            </dd>
          </div>
        )}
      </dl>

      {skills.length > 0 && (
        <p className="docket-skills">
          {skills.slice(0, 2).join(', ')}
          {extra > 0 && ` +${extra}`}
        </p>
      )}

      <div className="docket-foot">
        {closed && <span className="stamp stamp-press">Closed</span>}
        <button
          type="button"
          className="docket-open"
          onClick={(e) => {
            e.stopPropagation();
            onClick(application);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          Details
        </button>
      </div>
    </article>
  );
};
