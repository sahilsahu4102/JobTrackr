import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import type { Application } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useDeleteApplication, useAddActivity, useUpdateApplication } from '../../hooks/useApplications';
import { toast } from 'sonner';
import { ExternalLink, Trash2, Plus, Copy, Check, Pencil, Save, X } from 'lucide-react';
import { followUpState, matchBand, MATCH_WORD } from '../../utils/followUp';

interface ApplicationModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUSES = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'] as const;

const formatDate = (dateStr: string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(dateStr));

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ application, isOpen, onClose }) => {
  const deleteApp = useDeleteApplication();
  const addActivity = useAddActivity();
  const updateApp = useUpdateApplication();
  const [newNote, setNewNote] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Application>>({});

  useEffect(() => {
    if (application) {
      setEditData({
        company: application.company,
        role: application.role,
        location: application.location,
        status: application.status,
        jdLink: application.jdLink,
      });
      setIsEditing(false); // Reset edit state when varying applications
      setCopiedIndex(null);
    }
  }, [application]);

  if (!application) return null;

  const urgency = followUpState(application);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteApp.mutate(application._id, {
        onSuccess: () => {
          toast.success('Application deleted');
          onClose();
        },
        onError: () => toast.error('Failed to delete application'),
      });
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Suggestion copied to clipboard!');
  };

  const handleSaveEdit = () => {
    if (!editData.company || !editData.role) {
      return toast.error('Company and Role are required.');
    }
    updateApp.mutate(
      { id: application._id, data: editData },
      {
        onSuccess: () => {
          toast.success('Application updated');
          setIsEditing(false);
        },
        onError: () => toast.error('Failed to update application'),
      }
    );
  };

  const submitNote = () => {
    if (newNote.trim()) {
      addActivity.mutate({ id: application._id, text: newNote.trim() }, { onSuccess: () => setNewNote('') });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Application details" maxWidth="max-w-2xl">
      <div className="stack-24">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          {isEditing ? (
            <div style={{ flex: 1 }} className="stack-16">
              <Input label="Role" value={editData.role || ''} onChange={(e) => setEditData({ ...editData, role: e.target.value })} />
              <Input label="Company" value={editData.company || ''} onChange={(e) => setEditData({ ...editData, company: e.target.value })} />
              <Input label="Location" value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} />
              <Input label="Job link URL" value={editData.jdLink || ''} onChange={(e) => setEditData({ ...editData, jdLink: e.target.value })} />
              <div>
                <label className="label" htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  className="select"
                  style={{ width: '100%' }}
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as Application['status'] })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <h3 className="page-title" style={{ fontSize: '1.875rem', overflowWrap: 'anywhere' }}>{application.role}</h3>
                {application.matchScore != null && (
                  <span
                    className={`score band-${matchBand(application.matchScore)}`}
                    style={{ marginTop: 4 }}
                    aria-label={`Match score ${application.matchScore} percent, ${MATCH_WORD[matchBand(application.matchScore)]}`}
                  >
                    {application.matchScore}<small>%</small> match
                  </span>
                )}
              </div>
              <dl className="rows" style={{ marginTop: 12 }}>
                <div><dt>Company</dt><dd>{application.company}</dd></div>
                {application.location && <div><dt>Location</dt><dd>{application.location}</dd></div>}
                <div><dt>Applied</dt><dd>{formatDate(application.dateApplied)}</dd></div>
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
                <div><dt>Status</dt><dd>{application.status}</dd></div>
              </dl>
            </div>
          )}

          <div>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Cancel editing"
                  onClick={() => {
                    setEditData({
                      company: application.company,
                      role: application.role,
                      location: application.location,
                      status: application.status,
                      jdLink: application.jdLink,
                    });
                    setIsEditing(false);
                  }}
                >
                  <X size={16} aria-hidden="true" />
                </Button>
                <Button size="sm" onClick={handleSaveEdit} isLoading={updateApp.isPending}>
                  <Save size={16} aria-hidden="true" /> Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil size={16} aria-hidden="true" /> Edit
              </Button>
            )}
          </div>
        </div>

        {!isEditing && editData.jdLink && (
          <p>
            <a href={editData.jdLink} target="_blank" rel="noopener noreferrer">
              View original posting <ExternalLink size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} />
            </a>
          </p>
        )}

        {/* Skills */}
        {application.requiredSkills?.length > 0 && (
          <div className="stack-24">
            <section>
              <h4 className="sec-title">Required skills</h4>
              <ul className="chips">
                {application.requiredSkills.map((skill, idx) => (
                  <li key={idx} className="chip">{skill}</li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="sec-title">Match against your resume</h4>

              <p className="label">Missing from your resume</p>
              {application.missingSkills && application.missingSkills.length > 0 ? (
                <ul className="chips" style={{ marginBottom: 20 }}>
                  {application.missingSkills.map((skill, index) => (
                    <li key={index} className="chip chip-gap">{skill}</li>
                  ))}
                </ul>
              ) : (
                <p className="field-note" style={{ marginBottom: 20 }}>
                  {application.matchScore != null
                    ? 'No missing skills identified. Good match.'
                    : 'Save your master resume on the Profile page to see missing skills.'}
                </p>
              )}

              <p className="label">Suggestions</p>
              {application.resumeSuggestions && application.resumeSuggestions.length > 0 ? (
                <ul className="list-rule">
                  {application.resumeSuggestions.map((suggestion, index) => (
                    <li key={index}>
                      <span>{suggestion}</span>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleCopy(suggestion, index)}
                        aria-label={copiedIndex === index ? 'Suggestion copied' : 'Copy suggestion'}
                      >
                        {copiedIndex === index ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="field-note">
                  {application.matchScore != null
                    ? 'No suggestions for this posting.'
                    : 'Save your master resume on the Profile page to get suggestions.'}
                </p>
              )}
            </section>
          </div>
        )}

        {/* Notes Timeline */}
        <section>
          <h4 className="sec-title">Activity timeline</h4>

          {application.activities?.length > 0 ? (
            <ol className="timeline">
              {application.activities.map((activity, idx) => (
                <li key={idx}>
                  <span>{activity.text}</span>
                  <time dateTime={activity.date}>
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.date))}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="field-note">No activities recorded yet.</p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Add a note or event"
                placeholder="e.g. Recruiter call booked for Friday"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newNote.trim()) {
                    e.preventDefault();
                    submitNote();
                  }
                }}
              />
            </div>
            <Button size="md" onClick={submitNote} isLoading={addActivity.isPending}>
              <Plus size={16} aria-hidden="true" /> Add
            </Button>
          </div>
        </section>

        {/* Footer */}
        <div className="sheet-actions" style={{ justifyContent: 'space-between', marginTop: 0 }}>
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleteApp.isPending}>
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </Button>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
