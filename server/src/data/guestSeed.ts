import type { Types } from 'mongoose';
import type { ApplicationStatus } from '../types/index.js';

// A short made-up resume so "Analyze fit" works the moment a guest pastes a job description.
export const GUEST_RESUME = `Full-stack software engineer, 2 years of experience.
Skills: TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, REST APIs, Docker, Git, Jest.
Experience: built and shipped a React + Node.js dashboard used by 300 customers; cut API response time by 40% with indexing and caching; wrote CI pipelines on GitHub Actions.
Education: B.Tech in Computer Science.`;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);

interface Sample {
  company: string; role: string; status: ApplicationStatus; location: string; salaryRange?: string; seniority: string;
  matchScore: number; requiredSkills: string[]; niceToHaveSkills: string[]; missingSkills: string[];
  applied: number; followUp?: number; notes?: string; activities: string[];
}

// Made-up companies on purpose: the board looks lived-in without naming real employers.
const SAMPLES: Sample[] = [
  { company: 'Northwind Labs', role: 'Backend Engineer', status: 'Offer', location: 'Remote', salaryRange: '18-24 LPA', seniority: 'Mid',
    matchScore: 88, requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs'], niceToHaveSkills: ['Docker', 'AWS'], missingSkills: ['AWS'],
    applied: 21, notes: 'Verbal offer received. Asked for the written offer by Friday.',
    activities: ['Applied through the careers page', 'Phone screen with the recruiter', 'Technical interview passed', 'Offer call'] },
  { company: 'Orbit Payments', role: 'Full-Stack Developer', status: 'Interview', location: 'Bengaluru', salaryRange: '14-20 LPA', seniority: 'Mid',
    matchScore: 81, requiredSkills: ['React', 'Node.js', 'MongoDB', 'TypeScript'], niceToHaveSkills: ['Stripe', 'Redis'], missingSkills: ['Stripe'],
    applied: 12, followUp: 2, notes: 'Final round: system design with the engineering manager.',
    activities: ['Applied on LinkedIn', 'Recruiter call', 'Coding round: 2 problems, both solved'] },
  { company: 'Lumen Analytics', role: 'Software Engineer II', status: 'Phone Screen', location: 'Hyderabad', seniority: 'Mid',
    matchScore: 72, requiredSkills: ['Python', 'SQL', 'React', 'Data pipelines'], niceToHaveSkills: ['Airflow', 'dbt'], missingSkills: ['Python', 'Airflow'],
    applied: 7, followUp: 1, activities: ['Applied via referral', 'Phone screen booked'] },
  { company: 'Helix Health', role: 'Frontend Engineer', status: 'Applied', location: 'Remote', seniority: 'Junior',
    matchScore: 76, requiredSkills: ['React', 'TypeScript', 'CSS', 'Testing'], niceToHaveSkills: ['Accessibility', 'Storybook'], missingSkills: ['Storybook'],
    applied: 4, followUp: 5, activities: ['Applied through the careers page'] },
  { company: 'Stackline Cloud', role: 'Platform Engineer', status: 'Applied', location: 'Pune', seniority: 'Mid',
    matchScore: 58, requiredSkills: ['Kubernetes', 'Terraform', 'Go', 'AWS'], niceToHaveSkills: ['Prometheus'], missingSkills: ['Kubernetes', 'Terraform', 'Go'],
    applied: 2, activities: ['Applied on LinkedIn'] },
  { company: 'Acme Robotics', role: 'Software Engineer', status: 'Rejected', location: 'Chennai', seniority: 'Mid',
    matchScore: 49, requiredSkills: ['C++', 'ROS', 'Linux'], niceToHaveSkills: ['Python'], missingSkills: ['C++', 'ROS'],
    applied: 30, notes: 'Wanted C++ and ROS experience. Not a fit.', activities: ['Applied on the company site', 'Rejection email'] },
];

export function sampleApplications(userId: Types.ObjectId) {
  const nextOrder: Partial<Record<ApplicationStatus, number>> = {};
  return SAMPLES.map(({ applied, followUp, activities, ...s }) => {
    const order = (nextOrder[s.status] = (nextOrder[s.status] ?? -1) + 1);
    return {
      ...s, userId, order,
      resumeSuggestions: [],
      jdLink: `https://example.com/careers/${s.company.toLowerCase().replace(/\W+/g, '-')}`,
      dateApplied: daysAgo(applied),
      followUpDate: followUp ? daysAhead(followUp) : undefined,
      activities: activities.map((text, j) => ({ text, date: daysAgo(Math.max(applied - j * 3, 0)) })),
    };
  });
}
