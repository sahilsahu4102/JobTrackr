import React, { useMemo } from 'react';
import { useApplications } from '../hooks/useApplications';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { data: applications, isLoading } = useApplications();
  const navigate = useNavigate();

  // Metrics Calculation
  const metrics = useMemo(() => {
    if (!applications || applications.length === 0) return null;

    // 1. Funnel Data
    const statusCounts = {
      'Applied': 0, 'Phone Screen': 0, 'Interview': 0, 'Offer': 0, 'Rejected': 0
    };
    applications.forEach(app => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });
    
    const funnelData = [
      { name: 'Applied', count: statusCounts['Applied'] },
      { name: 'Phone Screen', count: statusCounts['Phone Screen'] },
      { name: 'Interview', count: statusCounts['Interview'] },
      { name: 'Offer', count: statusCounts['Offer'] },
    ];

    // 2. Weekly Activity (Last 4 weeks)
    const weeksData: { [key: string]: number } = {};
    const today = new Date();
    for (let i = 28; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      weeksData[dateStr] = 0;
    }
    
    applications.forEach(app => {
      const d = new Date(app.dateApplied).toISOString().split('T')[0];
      if (weeksData[d] !== undefined) weeksData[d]++;
    });

    const activityData = Object.entries(weeksData).map(([date, count]) => ({
      date: date.substring(5), // MM-DD
      count
    }));

    // 3. Match Score Distribution
    let high = 0, medium = 0, low = 0;
    applications.forEach(app => {
      if (app.matchScore != null) {
        if (app.matchScore >= 80) high++;
        else if (app.matchScore >= 60) medium++;
        else low++;
      }
    });
    const matchData = [
      { name: 'High (80-100)', value: high, color: '#10b981' },
      { name: 'Medium (60-79)', value: medium, color: '#f59e0b' },
      { name: 'Low (<60)', value: low, color: '#ff6e84' },
    ];

    // 4. Missing Skills Aggregation
    const skillCounts: { [key: string]: number } = {};
    applications.forEach(app => {
      if (app.missingSkills) {
        app.missingSkills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      }
    });

    const skillData = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    return {
      total: applications.length,
      offers: statusCounts['Offer'],
      interviews: statusCounts['Interview'],
      funnelData,
      activityData,
      matchData,
      skillData
    };
  }, [applications]);

  // Chart styling constants
  const chartTextStyle = { fontSize: 12, fill: '#8b95a5', fontFamily: 'Inter' };
  
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#060e20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#dee5ff' }}>Loading analytics...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060e20', position: 'relative' }}>
      {/* Navbar */}
      <nav style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', backgroundColor: 'rgba(9,19,40,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(64,72,93,0.12)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 20px rgba(16,185,129,0.25)' }}>
            <BarChart3 size={18} />
          </div>
          <span className="gradient-text" style={{ fontSize: 18, fontWeight: 700 }}>Analytics</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} style={{ marginRight: 6 }} />
          Back to Board
        </Button>
      </nav>

      <main style={{ padding: '32px 48px', maxWidth: 1400, margin: '0 auto' }}>
        {!metrics ? (
          <div style={{ textAlign: 'center', marginTop: 100, color: '#8b95a5' }}>
            <p>No applications found.</p>
            <Button onClick={() => navigate('/')} style={{ marginTop: 16 }}>Go apply for jobs!</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
              <StatCard title="Total Applications" value={metrics.total} icon={<TrendingUp size={20} color="#a3a6ff" />} />
              <StatCard title="Active Interviews" value={metrics.interviews} icon={<Target size={20} color="#f59e0b" />} />
              <StatCard title="Offers Extended" value={metrics.offers} icon={<BarChart3 size={20} color="#10b981" />} />
            </div>

            {/* Main Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
              
              {/* Funnel */}
              <ChartCard title="Application Funnel">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={chartTextStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={chartTextStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                      contentStyle={{ backgroundColor: '#0f1930', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Match Score Distribution */}
              <ChartCard title="Match Score Distribution">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={metrics.matchData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {metrics.matchData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f1930', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                  {metrics.matchData.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#8b95a5' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color, marginRight: 6 }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </ChartCard>

            </div>

            {/* Secondary Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
              
              {/* Activity Timeline */}
              <ChartCard title="Application Activity (Last 28 Days)">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics.activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={chartTextStyle} axisLine={false} tickLine={false} minTickGap={30} />
                    <YAxis tick={chartTextStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f1930', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#a3a6ff" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Missing Skills */}
              <ChartCard title="Your Top Missing Skills (Global)">
                {metrics.skillData.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 250, justifyContent: 'center' }}>
                    {metrics.skillData.map((skill, index) => {
                      const max = metrics.skillData[0].count;
                      const pct = Math.max(10, (skill.count / max) * 100);
                      return (
                        <div key={index} style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#dee5ff' }}>
                            <span>{skill.skill}</span>
                            <span style={{ color: '#8b95a5' }}>Missing in {skill.count} jobs</span>
                          </div>
                          <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999 }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#ff6e84', borderRadius: 999 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250, color: '#8b95a5', flexDirection: 'column', gap: 12 }}>
                    <AlertCircle size={32} opacity={0.5} />
                    <span>No missing skills tracked yet!</span>
                  </div>
                )}
              </ChartCard>

            </div>

          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
  <div style={{ backgroundColor: 'rgba(20,31,56,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b95a5', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {icon}
      {title}
    </div>
    <div style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>
      {value}
    </div>
  </div>
);

const ChartCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div style={{ backgroundColor: 'rgba(20,31,56,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 24 }}>
    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#dee5ff', marginBottom: 24 }}>{title}</h3>
    {children}
  </div>
);
