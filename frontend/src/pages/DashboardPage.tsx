import React, { useMemo } from 'react';
import { useApplications } from '../hooks/useApplications';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AppBar } from '../components/layout/AppBar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList,
  LineChart, Line,
} from 'recharts';

// Chart colours are the world's own: carbon ink on docket stock.
const INK = '#1a1d21';
const INK_2 = '#464c55';
const HAIR = '#bebbae';
const axisText = { fontSize: 13, fill: INK_2, fontFamily: 'Sofia Sans, system-ui, sans-serif' };
const tooltipStyle = { backgroundColor: '#faf9f4', border: `1px solid ${INK}`, borderRadius: 0, color: INK, fontSize: 14 };

export const DashboardPage: React.FC = () => {
  const { data: applications, isLoading } = useApplications();
  const navigate = useNavigate();

  // Metrics Calculation
  const metrics = useMemo(() => {
    if (!applications || applications.length === 0) return null;

    // 1. Funnel Data
    const statusCounts = {
      Applied: 0,
      'Phone Screen': 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };
    applications.forEach((app) => {
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

    applications.forEach((app) => {
      const d = new Date(app.dateApplied).toISOString().split('T')[0];
      if (weeksData[d] !== undefined) weeksData[d]++;
    });

    const activityData = Object.entries(weeksData).map(([date, count]) => ({
      date: date.substring(5), // MM-DD
      count,
    }));

    // 3. Match Score Distribution
    let high = 0,
      medium = 0,
      low = 0;
    applications.forEach((app) => {
      if (app.matchScore != null) {
        if (app.matchScore >= 80) high++;
        else if (app.matchScore >= 60) medium++;
        else low++;
      }
    });
    const matchData = [
      { name: 'High (80-100)', count: high },
      { name: 'Medium (60-79)', count: medium },
      { name: 'Low (under 60)', count: low },
    ];

    // 4. Missing Skills Aggregation
    const skillCounts: { [key: string]: number } = {};
    applications.forEach((app) => {
      if (app.missingSkills) {
        app.missingSkills.forEach((skill) => {
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
      skillData,
    };
  }, [applications]);

  if (isLoading) {
    return (
      <>
        <AppBar />
        <main className="page">
          <h1 className="page-title">Analytics</h1>
          <p className="lede" role="status">Loading analytics…</p>
        </main>
      </>
    );
  }

  const summary = (rows: { name: string; count: number }[]) => rows.map((r) => `${r.name}: ${r.count}`).join('. ');

  return (
    <>
      <AppBar />
      <main className="page">
        <h1 className="page-title">Analytics</h1>
        <p className="lede">Counts come from the applications on your board.</p>

        {!metrics ? (
          <div style={{ marginTop: 32 }}>
            <p>No applications found.</p>
            <Button onClick={() => navigate('/')} style={{ marginTop: 16 }}>Go to the board</Button>
          </div>
        ) : (
          <div className="stack-24" style={{ marginTop: 24 }}>
            <section className="panel">
              <h2>Tally</h2>
              <dl className="tally">
                <div><dt>Total applications</dt><dd>{metrics.total}</dd></div>
                <div><dt>In interview</dt><dd>{metrics.interviews}</dd></div>
                <div><dt>Offers</dt><dd>{metrics.offers}</dd></div>
              </dl>
            </section>

            <div className="grid-2">
              <section className="panel">
                <h2>Application funnel</h2>
                <div className="panel-body" role="img" aria-label={`Funnel. ${summary(metrics.funnelData)}`}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metrics.funnelData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={HAIR} />
                      <XAxis dataKey="name" tick={axisText} axisLine={{ stroke: INK }} tickLine={false} />
                      <YAxis tick={axisText} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: 'rgba(26,29,33,0.06)' }} contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill={INK} barSize={44} isAnimationActive={false}>
                        <LabelList dataKey="count" position="top" style={axisText} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="panel">
                <h2>Match score distribution</h2>
                <div className="panel-body" role="img" aria-label={`Match scores. ${summary(metrics.matchData)}`}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metrics.matchData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={HAIR} />
                      <XAxis dataKey="name" tick={axisText} axisLine={{ stroke: INK }} tickLine={false} />
                      <YAxis tick={axisText} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: 'rgba(26,29,33,0.06)' }} contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill={INK} barSize={44} isAnimationActive={false}>
                        <LabelList dataKey="count" position="top" style={axisText} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <div className="grid-2">
              <section className="panel">
                <h2>Application activity, last 28 days</h2>
                <div className="panel-body" role="img" aria-label="Applications added per day over the last 28 days">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={metrics.activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={HAIR} />
                      <XAxis dataKey="date" tick={axisText} axisLine={{ stroke: INK }} tickLine={false} minTickGap={30} />
                      <YAxis tick={axisText} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Line type="linear" dataKey="count" stroke={INK} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: INK }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="panel">
                <h2>Skills missing most often</h2>
                <div className="panel-body">
                  {metrics.skillData.length > 0 ? (
                    <div>
                      {metrics.skillData.map((skill) => {
                        const max = metrics.skillData[0].count;
                        const pct = Math.max(10, (skill.count / max) * 100);
                        return (
                          <div key={skill.skill} className="skill-row">
                            <div className="meta">
                              <span>{skill.skill}</span>
                              <span>Missing in {skill.count} {skill.count === 1 ? 'job' : 'jobs'}</span>
                            </div>
                            <div className="hbar" aria-hidden="true">
                              <i style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="field-note">No missing skills tracked yet.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </>
  );
};
