'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  keywords: {
    total: number;
    byStatus: Record<string, number>;
  };
  content: {
    total: number;
    byStatus: Record<string, number>;
  };
  topContent: Array<any>;
  topKeywords: Array<any>;
  reviewQueue: Array<any>;
  aeoScorecard: Record<string, { mentioned: number; total: number; rate: number }>;
  engineStatus: Array<any>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Error fetching dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading"></div> Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Strip */}
      <div className="strip">
        <div>
          <h1>GENRAGE Content Engine</h1>
          <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.25rem' }}>
            Automated SEO + AEO content generation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="metric">
            <div className="metric-label">Keywords</div>
            <div className="metric-value">{stats?.keywords.total || 0}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Content</div>
            <div className="metric-value">{stats?.content.byStatus.published || 0}</div>
          </div>
          <div className="metric">
            <div className="metric-label">In Review</div>
            <div className="metric-value">{stats?.content.byStatus.review || 0}</div>
          </div>
          <div className="metric">
            <div className="metric-label">AEO Health</div>
            <div className="metric-value">
              {stats?.aeoScorecard && Object.values(stats.aeoScorecard).length > 0
                ? Math.round(
                    Object.values(stats.aeoScorecard).reduce((sum, s) => sum + s.rate, 0) /
                      Object.values(stats.aeoScorecard).length
                  )
                : 0}
              %
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              background: activeTab === 'overview' ? '#fff' : 'transparent',
              color: activeTab === 'overview' ? '#141414' : '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            style={{
              background: activeTab === 'keywords' ? '#fff' : 'transparent',
              color: activeTab === 'keywords' ? '#141414' : '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0'
            }}
          >
            Keywords
          </button>
          <button
            onClick={() => setActiveTab('content')}
            style={{
              background: activeTab === 'content' ? '#fff' : 'transparent',
              color: activeTab === 'content' ? '#141414' : '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0'
            }}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('aeo')}
            style={{
              background: activeTab === 'aeo' ? '#fff' : 'transparent',
              color: activeTab === 'aeo' ? '#141414' : '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0'
            }}
          >
            AEO
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2>Content Pipeline</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
              {['draft', 'review', 'approved', 'published', 'needs_refresh'].map((status) => (
                <div key={status} className="card">
                  <div className="metric-label">{status}</div>
                  <div className="metric-value">{stats?.content.byStatus[status] || 0}</div>
                </div>
              ))}
            </div>

            <h2>Top Performing Content</h2>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Sessions</th>
                  <th>Position</th>
                  <th>CTR</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topContent.map((content) => (
                  <tr key={content.id}>
                    <td>{content.title}</td>
                    <td>{content.organic_sessions_30d || 0}</td>
                    <td>{content.avg_position ? content.avg_position.toFixed(1) : 'N/A'}</td>
                    <td>
                      {content.impressions_30d && content.clicks_30d
                        ? ((content.clicks_30d / content.impressions_30d) * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 style={{ marginTop: '3rem' }}>Engine Status</h2>
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Last Run</th>
                </tr>
              </thead>
              <tbody>
                {stats?.engineStatus.map((log, i) => (
                  <tr key={i}>
                    <td>{log.jobType}</td>
                    <td>
                      <span
                        className={`status-badge ${log.status === 'COMPLETED' ? 'published' : log.status === 'FAILED' ? 'failed' : 'review'}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td>{log.itemsProcessed || 0}</td>
                    <td>{log.completedAt ? new Date(log.completedAt).toLocaleDateString() : 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div>
            <h2>Top Keyword Opportunities</h2>
            <table>
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Opportunity Score</th>
                  <th>Position</th>
                  <th>Impressions</th>
                  <th>Intent</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topKeywords.map((kw) => (
                  <tr key={kw.id}>
                    <td>
                      <strong>{kw.keyword}</strong>
                    </td>
                    <td>{kw.opportunity_score ? kw.opportunity_score.toFixed(0) : 0}</td>
                    <td>{kw.current_position ? kw.current_position.toFixed(1) : 'N/A'}</td>
                    <td>{kw.impressions || 0}</td>
                    <td>
                      <span className="status-badge" style={{ background: '#222', color: '#aaa' }}>
                        {kw.intent || 'unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 style={{ marginTop: '2rem' }}>Keyword Status Breakdown</h2>
            <div className="grid">
              {Object.entries(stats?.keywords.byStatus || {}).map(([status, count]) => (
                <div key={status} className="card">
                  <div className="metric-label">{status}</div>
                  <div className="metric-value">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div>
            <h2>Content Queue (Ready for Review)</h2>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.reviewQueue.map((content) => (
                  <tr key={content.id}>
                    <td>{content.title}</td>
                    <td>{new Date(content.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className="status-badge review">Review</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 style={{ marginTop: '2rem' }}>Content Status Breakdown</h2>
            <div className="grid">
              {Object.entries(stats?.content.byStatus || {}).map(([status, count]) => (
                <div key={status} className="card">
                  <div className="metric-label">{status}</div>
                  <div className="metric-value">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AEO Tab */}
        {activeTab === 'aeo' && (
          <div>
            <h2>AI Engine Optimization (AEO) Scorecard</h2>
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Mentions</th>
                  <th>Total Checks</th>
                  <th>Citation Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats?.aeoScorecard || {}).map(([platform, data]) => (
                  <tr key={platform}>
                    <td>
                      <strong>{platform}</strong>
                    </td>
                    <td>{data.mentioned}</td>
                    <td>{data.total}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '100px',
                            height: '8px',
                            background: '#333',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${data.rate}%`,
                              height: '100%',
                              background: data.rate > 50 ? '#90ee90' : '#ffff90'
                            }}
                          ></div>
                        </div>
                        <span>{data.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #333', color: '#666', fontSize: '0.9rem' }}>
          <p>
            Last updated: {new Date().toLocaleString()} • Content Engine v1.0 • GENRAGE
          </p>
        </div>
      </div>
    </div>
  );
}
