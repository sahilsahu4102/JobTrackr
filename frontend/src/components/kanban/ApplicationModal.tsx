import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import type { Application } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useDeleteApplication, useAddActivity, useUpdateApplication } from '../../hooks/useApplications';
import { toast } from 'sonner';
import { Building2, Calendar, MapPin, Link as LinkIcon, Trash2, Sparkles, MessageSquare, Plus, Copy, Check, Edit2, Save, X } from 'lucide-react';

interface ApplicationModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteApp.mutate(application._id, {
        onSuccess: () => {
          toast.success('Application deleted');
          onClose();
        },
        onError: () => toast.error('Failed to delete application')
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
      return toast.error("Company and Role are required.");
    }
    updateApp.mutate({ id: application._id, data: editData }, {
      onSuccess: () => {
        toast.success('Application updated');
        setIsEditing(false);
      },
      onError: () => toast.error('Failed to update application')
    });
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(dateStr));
  };

  const getMatchStyle = (score: number): React.CSSProperties => {
    if (score >= 80) return { backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' };
    if (score >= 60) return { backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
    return { backgroundColor: 'rgba(255,110,132,0.15)', color: '#ff6e84' };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Application Details" maxWidth="max-w-2xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {isEditing ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Role" value={editData.role || ''} onChange={e => setEditData({ ...editData, role: e.target.value })} />
              <Input label="Company" value={editData.company || ''} onChange={e => setEditData({ ...editData, company: e.target.value })} />
              <Input label="Location" value={editData.location || ''} onChange={e => setEditData({ ...editData, location: e.target.value })} />
              <Input label="Job Link URL" value={editData.jdLink || ''} onChange={e => setEditData({ ...editData, jdLink: e.target.value })} />
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a3aac4', marginBottom: 8 }}>
                  Status
                </label>
                <select
                  value={editData.status}
                  onChange={e => setEditData({ ...editData, status: e.target.value as any })}
                  style={{
                    display: 'flex', height: 48, width: '100%', borderRadius: 12, border: '1.5px solid rgba(64,72,93,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0 16px', fontSize: 14, color: '#dee5ff', outline: 'none', fontFamily: 'inherit'
                  }}
                >
                  <option value="Applied">Applied</option>
                  <option value="Phone Screen">Phone Screen</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#dee5ff', letterSpacing: '-0.02em' }}>{application.role}</h3>
                {application.matchScore != null && (
                  <div style={{ ...getMatchStyle(application.matchScore), padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={12} />
                    {application.matchScore}% Match
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, color: '#a3aac4', fontSize: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Building2 size={14} style={{ marginRight: 8 }} />
                  {application.company}
                </div>
                {application.location && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MapPin size={14} style={{ marginRight: 8 }} />
                    {application.location}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Calendar size={14} style={{ marginRight: 8 }} />
                  Applied {formatDate(application.dateApplied)}
                </div>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {!isEditing && (
              <span style={{ padding: '6px 16px', borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(20,31,56,0.8)', color: '#a3aac4', border: '1px solid rgba(64,72,93,0.15)' }}>
                {application.status}
              </span>
            )}
            {isEditing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditData({ company: application.company, role: application.role, location: application.location, status: application.status, jdLink: application.jdLink });
                  setIsEditing(false);
                }}><X size={14} /></Button>
                <Button size="sm" onClick={handleSaveEdit} isLoading={updateApp.isPending}><Save size={14} /> Save</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 size={14} style={{ marginRight: 6 }} /> Edit
              </Button>
            )}
          </div>
        </div>

        {!isEditing && Object.keys(editData).length > 0 && editData.jdLink && (
          <a href={editData.jdLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', fontSize: 14, color: '#a3a6ff', textDecoration: 'none' }}>
            <LinkIcon size={14} style={{ marginRight: 6 }} />
            View Original Posting
          </a>
        )}

        {/* Skills */}
        {application.requiredSkills?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#a3aac4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Required Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {application.requiredSkills.map((skill, idx) => (
                  <span key={idx} style={{ padding: '6px 14px', backgroundColor: 'rgba(20,31,56,0.7)', borderRadius: 9999, fontSize: 12, fontWeight: 500, color: '#a3aac4' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Insights Section */}
            <div style={{ marginTop: 24 }}>
              <h5 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6d758c', marginBottom: 16 }}>
                <Sparkles size={12} style={{ display: 'inline', marginRight: 6, color: '#a3a6ff' }} />
                AI Resume Insights
              </h5>
              
              {/* Missing Skills */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ff6e84', marginBottom: 8 }}>Missing from your Resume:</div>
                {application.missingSkills && application.missingSkills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {application.missingSkills.map((skill, index) => (
                      <span key={index} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(255,110,132,0.1)', color: '#ff6e84', border: '1px solid rgba(255,110,132,0.2)' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#6d758c', fontStyle: 'italic' }}>
                    {application.matchScore != null ? "No missing skills identified! Great match." : "Upload your Master Resume in your Profile to see missing skills."}
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#a3a6ff', marginBottom: 8 }}>Actionable Suggestions:</div>
                {application.resumeSuggestions && application.resumeSuggestions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {application.resumeSuggestions.map((suggestion, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid rgba(64,72,93,0.1)' }}>
                        <div style={{ color: '#dee5ff', fontSize: 13, lineHeight: 1.6, flex: 1 }}>
                          {suggestion}
                        </div>
                        <button 
                          onClick={() => handleCopy(suggestion, index)}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 6, color: copiedIndex === index ? '#10b981' : '#6d758c', transition: 'all 0.2s'
                          }}
                          title="Copy suggestion"
                        >
                          {copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#6d758c', fontStyle: 'italic' }}>
                    {application.matchScore != null ? "Your resume looks perfectly tailored already!" : "Upload your Master Resume in your Profile to generate personalized AI improvement suggestions."}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes Timeline */}
        <div style={{ marginTop: 8 }}>
          <h5 style={{ fontSize: 13, fontWeight: 700, color: '#dee5ff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} color="#6366f1" />
            Activity Timeline
          </h5>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            {application.activities?.length > 0 ? (
              application.activities.map((activity, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366f1', marginTop: 6 }} />
                    {idx !== application.activities.length - 1 && (
                      <div style={{ width: 2, flex: 1, backgroundColor: 'rgba(99,102,241,0.2)', marginTop: 4 }} />
                    )}
                  </div>
                  <div>
                    <div style={{ color: '#dee5ff', fontSize: 13, lineHeight: 1.5 }}>{activity.text}</div>
                    <div style={{ color: '#6d758c', fontSize: 11, marginTop: 4 }}>
                      {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.date))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, color: '#6d758c', fontStyle: 'italic', paddingLeft: 20 }}>No activities recorded yet.</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Input 
              placeholder="Add a new note or event..." 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newNote.trim()) {
                  e.preventDefault();
                  addActivity.mutate({ id: application._id, text: newNote.trim() }, {
                    onSuccess: () => setNewNote('')
                  });
                }
              }}
              style={{ flex: 1 }}
            />
            <Button 
              size="sm" 
              onClick={() => {
                if (newNote.trim()) {
                  addActivity.mutate({ id: application._id, text: newNote.trim() }, {
                    onSuccess: () => setNewNote('')
                  });
                }
              }}
              isLoading={addActivity.isPending}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(64,72,93,0.1)' }}>
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleteApp.isPending}>
            <Trash2 size={14} style={{ marginRight: 8 }} />
            Delete
          </Button>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
