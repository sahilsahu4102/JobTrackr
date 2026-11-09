import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { AppBar } from '../components/layout/AppBar';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import api from '../api/axios';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [resumeText, setResumeText] = useState(user?.resumeText || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.resumeText && !resumeText) {
      setResumeText(user.resumeText);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.put('/auth/profile', { resumeText });
      updateUser({ resumeText });
      toast.success('Resume updated! The AI will now use this for job matching.');
    } catch (error) {
      toast.error('Failed to update resume profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AppBar />
      <main className="page page-narrow">
        <h1 className="page-title">Master resume</h1>
        <p className="lede" style={{ maxWidth: '62ch' }}>
          Paste the text of your resume. When you extract a job posting, JobTrackr sends the posting and this text to the AI model, which returns a match
          score, the skills you are missing and suggested edits.
        </p>

        <div style={{ marginTop: 24 }}>
          <label className="label" htmlFor="resume-text">Resume text</label>
          <textarea
            id="resume-text"
            className="textarea"
            style={{ minHeight: 320 }}
            placeholder={'Your name\nYour title\n\nExperience:\n- What you built, with numbers where you have them'}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        </div>

        <div className="sheet-actions" style={{ justifyContent: 'space-between', borderTop: 0, paddingTop: 0 }}>
          <p className="field-note" style={{ margin: 0 }}>Saved to your account.</p>
          <Button onClick={handleSave} isLoading={isSaving}>
            <Save size={16} aria-hidden="true" />
            Save resume
          </Button>
        </div>
      </main>
    </>
  );
};
