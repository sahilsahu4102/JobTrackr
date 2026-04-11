import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCreateApplication, useParseJD } from '../../hooks/useApplications';
import { toast } from 'sonner';
import { Sparkles, Link as LinkIcon, FileText, Loader2 } from 'lucide-react';

const applicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  status: z.enum(['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']),
  requiredSkills: z.array(z.string()).optional(),
  jdLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  matchScore: z.number().nullable().optional(),
  missingSkills: z.array(z.string()).optional(),
  resumeSuggestions: z.array(z.string()).optional(),
  followUpDate: z.string().optional(),
});

type FormValues = z.infer<typeof applicationSchema>;

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({ isOpen, onClose }) => {
  const createApplication = useCreateApplication();
  const parseJD = useParseJD();

  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [parseInput, setParseInput] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      status: 'Applied',
      requiredSkills: [],
      matchScore: null,
      missingSkills: [],
      resumeSuggestions: [],
    }
  });

  const onSubmit = async (data: FormValues) => {
    createApplication.mutate(data, {
      onSuccess: () => {
        toast.success(`Application for ${data.company} added!`);
        reset();
        setParseInput('');
        onClose();
      },
      onError: (error) => {
        const err = error as any;
        toast.error(err.response?.data?.message || 'Failed to add application');
      }
    });
  };

  const handleParse = () => {
    if (!parseInput.trim()) return toast.error('Please provide a URL or Text');

    const payload = mode === 'url' ? { url: parseInput, text: undefined } : { url: undefined, text: parseInput };
    
    parseJD.mutate(payload, {
      onSuccess: (data) => {
        toast.success('Job details extracted successfully!');
        if (data.company) setValue('company', data.company);
        if (data.role) setValue('role', data.role);
        if (data.location) setValue('location', data.location);
        if (data.salaryRange) setValue('salaryRange', data.salaryRange);
        if (data.requiredSkills) setValue('requiredSkills', data.requiredSkills);
        if (mode === 'url') setValue('jdLink', parseInput);
        
        // Pass through AI evaluation fields
        if (data.matchScore !== undefined) setValue('matchScore', data.matchScore);
        if (data.missingSkills) setValue('missingSkills', data.missingSkills);
        if (data.resumeSuggestions) setValue('resumeSuggestions', data.resumeSuggestions);
      },
      onError: (error) => {
        const err = error as any;
        toast.error(err.response?.data?.message || 'Failed to parse. Try pasting text manually.');
      }
    });
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    ...(active 
      ? { background: 'linear-gradient(135deg, #6366f1, #6063ee)', color: 'white', boxShadow: '0 4px 15px rgba(96,99,238,0.25)' }
      : { background: 'transparent', color: '#a3aac4' }
    ),
  });

  const inputStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: 12,
    border: '1.5px solid rgba(64,72,93,0.15)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '12px 16px',
    fontSize: 14,
    color: '#dee5ff',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Application" maxWidth="max-w-2xl">
      
      {/* AI Parsing Section */}
      <div style={{
        marginBottom: 28,
        padding: 24,
        backgroundColor: 'rgba(20,31,56,0.5)',
        border: '1px solid rgba(99,102,241,0.1)',
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(99,102,241,0.04), transparent)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#a3a6ff', fontWeight: 600, fontSize: 14 }}>
            <Sparkles size={16} style={{ marginRight: 8 }} />
            AI Auto-Fill
          </div>
          <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 3, border: '1px solid rgba(64,72,93,0.15)' }}>
            <button type="button" onClick={() => setMode('url')} style={tabStyle(mode === 'url')}>
              <LinkIcon size={11} style={{ marginRight: 6 }} /> URL
            </button>
            <button type="button" onClick={() => setMode('text')} style={tabStyle(mode === 'text')}>
              <FileText size={11} style={{ marginRight: 6 }} /> Text
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
          {mode === 'url' ? (
            <input type="url" placeholder="Paste job posting URL (e.g. from LinkedIn)..." value={parseInput} onChange={(e) => setParseInput(e.target.value)} style={inputStyle} />
          ) : (
            <textarea placeholder="Paste full job description text here..." rows={3} value={parseInput} onChange={(e) => setParseInput(e.target.value)} style={{ ...inputStyle, resize: 'none' }} />
          )}
          <Button type="button" onClick={handleParse} isLoading={parseJD.isPending}>
            Extract
          </Button>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(163,170,196,0.5)', marginTop: 10, position: 'relative', zIndex: 1 }}>
          {mode === 'url' ? 'Note: Some job boards block scrapers. Use Text mode if parsing fails.' : 'Pro-tip: Just CTRL+A and CTRL+C the entire visible page.'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ position: 'relative' }}>
        
        {/* Shimmer overlay while parsing */}
        {parseJD.isPending && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, backgroundColor: 'rgba(6,14,32,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Loader2 size={32} style={{ color: '#a3a6ff', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
              <span style={{ color: '#a3a6ff', fontSize: 14, fontWeight: 600 }}>Extracting with AI...</span>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Input label="Company Name" placeholder="e.g. Google" {...register('company')} error={errors.company?.message} />
          <Input label="Role Title" placeholder="e.g. Senior Frontend Engineer" {...register('role')} error={errors.role?.message} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Input label="Location" placeholder="e.g. Remote, San Francisco" {...register('location')} error={errors.location?.message} />
          <Input label="Salary Range" placeholder="e.g. 120k-150k" {...register('salaryRange')} error={errors.salaryRange?.message} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ width: '100%' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a3aac4', marginBottom: 8 }}>
              Initial Status
            </label>
            <select
              {...register('status')}
              style={{
                display: 'flex',
                height: 48,
                width: '100%',
                borderRadius: 12,
                border: '1.5px solid rgba(64,72,93,0.2)',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '0 16px',
                fontSize: 14,
                color: '#dee5ff',
                outline: 'none',
                fontFamily: 'inherit',
                appearance: 'none',
              }}
            >
              <option value="Applied">Applied</option>
              <option value="Phone Screen">Phone Screen</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <Input type="date" label="Follow-up Date" {...register('followUpDate')} error={errors.followUpDate?.message} />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(64,72,93,0.1)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createApplication.isPending}>
            Save Application
          </Button>
        </div>
      </form>
    </Modal>
  );
};
