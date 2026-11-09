import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCreateApplication, useParseJD } from '../../hooks/useApplications';
import { toast } from 'sonner';

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

/** Elapsed seconds while the AI call runs, so a slow free model never looks like a frozen button. */
const useElapsed = (active: boolean) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  return seconds;
};

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({ isOpen, onClose }) => {
  const createApplication = useCreateApplication();
  const parseJD = useParseJD();
  const elapsed = useElapsed(parseJD.isPending);

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
    },
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
      },
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
        const message: string = err.response?.data?.message || '';
        console.error('AI extraction failed:', message || err.message);
        // The server lists every free model it tried; the visitor only needs to know what to do next.
        toast.error(
          message.startsWith('AI API Error')
            ? 'The AI could not answer right now. The free models may be busy or the daily limit is reached. You can fill the fields by hand.'
            : message || 'Failed to parse. Try pasting text manually.'
        );
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add application" maxWidth="max-w-2xl">
      {/* AI fill */}
      <section className="fill-box" aria-labelledby="fill-title">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <h3 id="fill-title" className="sec-title" style={{ border: 0, margin: 0, padding: 0 }}>
            Fill from a posting
          </h3>
          <div className="seg" role="group" aria-label="Posting source">
            <button type="button" aria-pressed={mode === 'url'} onClick={() => setMode('url')}>
              URL
            </button>
            <button type="button" aria-pressed={mode === 'text'} onClick={() => setMode('text')}>
              Text
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label className="visually-hidden" htmlFor="parse-input">
              {mode === 'url' ? 'Job posting URL' : 'Job description text'}
            </label>
            {mode === 'url' ? (
              <input
                id="parse-input"
                className="field"
                type="url"
                placeholder="Paste a job posting URL, for example from LinkedIn"
                value={parseInput}
                onChange={(e) => setParseInput(e.target.value)}
              />
            ) : (
              <textarea
                id="parse-input"
                className="textarea"
                placeholder="Paste the full job description text here"
                rows={4}
                value={parseInput}
                onChange={(e) => setParseInput(e.target.value)}
              />
            )}
          </div>
          <Button type="button" onClick={handleParse} isLoading={parseJD.isPending}>
            Extract
          </Button>
        </div>

        <p className="field-note">
          {mode === 'url'
            ? 'Some job boards block scrapers. Use Text mode if the URL fails.'
            : 'Tip: select the whole page with Ctrl+A, copy it, and paste it here.'}
        </p>
        <p className="field-note">
          The AI runs on free models. It can take 20 to 45 seconds, and it may be unavailable once the daily limit is reached.
        </p>

        <div role="status" aria-live="polite">
          {parseJD.isPending && (
            <p className="working">
              Reading the posting… {elapsed} s. Free models can be slow; you can fill the fields by hand instead.
            </p>
          )}
        </div>
      </section>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 20 }}>
        <fieldset disabled={parseJD.isPending} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <Input label="Company name" placeholder="e.g. Google" {...register('company')} error={errors.company?.message} />
            <Input label="Role title" placeholder="e.g. Senior Frontend Engineer" {...register('role')} error={errors.role?.message} />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <Input label="Location" placeholder="e.g. Remote, San Francisco" {...register('location')} error={errors.location?.message} />
            <Input label="Salary range" placeholder="e.g. 120k-150k" {...register('salaryRange')} error={errors.salaryRange?.message} />
          </div>

          <div className="form-grid">
            <div>
              <label className="label" htmlFor="add-status">Initial status</label>
              <select id="add-status" className="select" style={{ width: '100%' }} {...register('status')}>
                <option value="Applied">Applied</option>
                <option value="Phone Screen">Phone Screen</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <Input type="date" label="Follow-up date" {...register('followUpDate')} error={errors.followUpDate?.message} />
          </div>
        </fieldset>

        <div className="sheet-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createApplication.isPending}>
            Save application
          </Button>
        </div>
      </form>
    </Modal>
  );
};
