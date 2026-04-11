import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { FileText, Save, CheckCircle2, ArrowLeft, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
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
    <div style={{ minHeight: '100vh', backgroundColor: '#060e20', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', backgroundColor: 'rgba(96,99,238,0.05)', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 350, height: 350, borderRadius: '50%', backgroundColor: 'rgba(200,144,255,0.05)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      {/* Navbar */}
      <nav style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', backgroundColor: 'rgba(9,19,40,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(64,72,93,0.12)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #6063ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 20px rgba(96,99,238,0.25)' }}>
            <Briefcase size={18} />
          </div>
          <span className="gradient-text" style={{ fontSize: 18, fontWeight: 700 }}>JobTrackr</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} style={{ marginRight: 6 }} />
          Back to Board
        </Button>
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px', position: 'relative', zIndex: 10 }}>
        <div className="glass-card" style={{ padding: 48, position: 'relative', overflow: 'hidden' }}>
          {/* Decorative glow inside card */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 250, height: 250, backgroundColor: 'rgba(96,99,238,0.04)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative', zIndex: 1 }}>
            <FileText style={{ color: '#a3a6ff' }} size={28} />
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#dee5ff', letterSpacing: '-0.02em' }}>Master Resume</h2>
          </div>
          <p style={{ color: '#a3aac4', marginBottom: 32, fontSize: 14, lineHeight: 1.7, maxWidth: 500, position: 'relative', zIndex: 1 }}>
            Paste the raw text of your master resume below. JobTrackr will automatically cross-reference it against Job Descriptions using AI to generate a Match Score and identify missing skills.
          </p>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <textarea
              className="custom-scrollbar"
              style={{
                width: '100%',
                height: 320,
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1.5px solid rgba(64,72,93,0.15)',
                borderRadius: 14,
                padding: 20,
                fontSize: 14,
                color: '#dee5ff',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.7,
                transition: 'border-color 0.2s',
              }}
              placeholder={`E.g., John Doe\nSenior Software Engineer\n\nExperience:\n- Built scalable microservices in Node.js...`}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(64,72,93,0.15)'; }}
            />
          </div>

          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#a3aac4' }}>
              <CheckCircle2 size={14} style={{ marginRight: 8, color: '#10b981' }} />
              Securely stored and used only for your application matching.
            </div>
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save size={16} style={{ marginRight: 8 }} />
              Save Resume
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
