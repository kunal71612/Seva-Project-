import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { api, setAuthToken, getCurrentUser, setCurrentUser } from './api';
import { savePendingResponse, getPendingResponses, removePendingResponse, type PendingResponse } from './indexedDb';
import './App.css';

// ----------------------------------------------------
// ROOT SHELL & NAVIGATION
// ----------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const [user, setUser] = useState<any>(getCurrentUser());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location.pathname]);

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUser(null);
    navigate('/');
  };

  return (
    <div className="app-container">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand-section">
            <span className="brand-badge">OM</span>
            <div>
              <div className="brand-title">OneMind</div>
              <div className="brand-sub">Offline-First Examination Continuity</div>
            </div>
          </Link>

          <nav className="nav-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Login
            </Link>
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              Admin Dashboard
            </Link>
            <Link to="/candidate" className={`nav-link ${location.pathname === '/candidate' ? 'active' : ''}`}>
              Candidate Exam
            </Link>
            <Link to="/monitor" className={`nav-link ${location.pathname === '/monitor' ? 'active' : ''}`}>
              System Monitor
            </Link>
            <Link to="/audit" className={`nav-link ${location.pathname === '/audit' ? 'active' : ''}`}>
              Audit Trail
            </Link>

            {user && (
              <div className="nav-user">
                <span className="pill pill-neutral">
                  <span className="pill-dot" />
                  {user.name || user.email || user.registrationId} ({user.role})
                </span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Sign out
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<LoginPage onLogin={(u) => setUser(u)} />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/candidate" element={<CandidateExamPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/audit" element={<AuditPage />} />
        </Routes>
      </main>
    </div>
  );
}

// ----------------------------------------------------
// FEATURE 1: LOGIN PAGE (ADMIN & CANDIDATE)
// ----------------------------------------------------

function LoginPage({ onLogin }: { onLogin: (u: any) => void }) {
  const [tab, setTab] = useState<'admin' | 'candidate'>('candidate');
  const [adminEmail, setAdminEmail] = useState('admin@onemind.local');
  const [adminPassword, setAdminPassword] = useState('Admin@123');
  const [candidateRegId, setCandidateRegId] = useState('CAND-101');
  const [candidatePassword, setCandidatePassword] = useState('Candidate@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminLogin(adminEmail, adminPassword);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      onLogin(res.user);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.candidateLogin(candidateRegId, candidatePassword);
      setAuthToken(res.token);
      const userObj = { ...res.candidate, role: 'CANDIDATE' };
      setCurrentUser(userObj);
      onLogin(userObj);
      navigate('/candidate');
    } catch (err: any) {
      setError(err.message || 'Candidate authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type: 'admin' | 'cand1' | 'cand2') => {
    setError(null);
    if (type === 'admin') {
      setTab('admin');
      setAdminEmail('admin@onemind.local');
      setAdminPassword('Admin@123');
    } else if (type === 'cand1') {
      setTab('candidate');
      setCandidateRegId('CAND-101');
      setCandidatePassword('Candidate@123');
    } else {
      setTab('candidate');
      setCandidateRegId('CAND-102');
      setCandidatePassword('Candidate@123');
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="brand-badge" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
            SEVA 2026 PROTOTYPE
          </div>
          <h2 className="card-title" style={{ fontSize: '1.4rem' }}>
            OneMind Authentication Gateway
          </h2>
          <p className="card-desc">
            Offline-first examination continuity demonstration. Select your role to sign in.
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="tab-list" style={{ justifyContent: 'center' }}>
          <button
            className={`tab-btn ${tab === 'candidate' ? 'active' : ''}`}
            onClick={() => { setTab('candidate'); setError(null); }}
          >
            Candidate Sign In
          </button>
          <button
            className={`tab-btn ${tab === 'admin' ? 'active' : ''}`}
            onClick={() => { setTab('admin'); setError(null); }}
          >
            Administrator Sign In
          </button>
        </div>

        {tab === 'candidate' ? (
          <form onSubmit={handleCandidateLogin}>
            <div className="form-group">
              <label className="form-label">Registration ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CAND-101"
                value={candidateRegId}
                onChange={(e) => setCandidateRegId(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password / Passcode</label>
              <input
                type="password"
                className="form-input"
                value={candidatePassword}
                onChange={(e) => setCandidatePassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Authenticating...' : 'Enter Examination Interface'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label className="form-label">Administrator Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@onemind.local"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Authenticating...' : 'Access Administration Panel'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Demo Quick-Fill Credentials
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => fillDemo('cand1')} className="btn btn-secondary btn-sm">
              Candidate 1 (CAND-101)
            </button>
            <button type="button" onClick={() => fillDemo('cand2')} className="btn btn-secondary btn-sm">
              Candidate 2 (CAND-102)
            </button>
            <button type="button" onClick={() => fillDemo('admin')} className="btn btn-secondary btn-sm">
              Admin (admin@onemind.local)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// FEATURE 2: ADMIN EXAMINATION MANAGEMENT
// ----------------------------------------------------

function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'candidates' | 'submissions'>('overview');
  const [notice, setNotice] = useState<string | null>(null);

  // New Exam Form State
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examDuration, setExamDuration] = useState(25);
  const [questions, setQuestions] = useState<Array<{ text: string; options: Array<{ text: string; isCorrect: boolean }> }>>([
    {
      text: 'What is the primary benefit of local response queueing during internet outages?',
      options: [
        { text: 'Candidates can continue uninterrupted without losing progress', isCorrect: true },
        { text: 'It completely deletes previous answers', isCorrect: false },
        { text: 'It forces immediate exam termination', isCorrect: false },
        { text: 'It slows down network traffic', isCorrect: false },
      ],
    },
  ]);

  // New Candidate Form State
  const [showAddCand, setShowAddCand] = useState(false);
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candRegId, setCandRegId] = useState('');
  const [candExamId, setCandExamId] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      setData(res);
      if (res.exams && res.exams.length > 0 && !candExamId) {
        setCandExamId(res.exams[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator dashboard. Please log in as admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleStatus = async (examId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await api.updateExamStatus(examId, nextStatus);
      setNotice(`Exam status updated to ${nextStatus}.`);
      loadDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExam({
        title: examTitle,
        description: examDesc,
        durationMinutes: examDuration,
        questions,
      });
      setNotice(`Examination "${examTitle}" created successfully.`);
      setShowCreateExam(false);
      setExamTitle('');
      setExamDesc('');
      loadDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to create examination.');
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      },
    ]);
  };

  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerCandidate({
        name: candName,
        email: candEmail,
        registrationId: candRegId,
        examId: candExamId,
      });
      setNotice(`Candidate ${candRegId} registered and assigned.`);
      setShowAddCand(false);
      setCandName('');
      setCandEmail('');
      setCandRegId('');
      loadDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to register candidate.');
    }
  };

  if (loading) {
    return <div className="card">Loading administrator dashboard...</div>;
  }

  if (error && !data) {
    return (
      <div className="card">
        <div className="alert alert-danger">{error}</div>
        <p>Please log in with the administrator account to access this page.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Go to Sign In
        </Link>
      </div>
    );
  }

  const { metrics, exams, candidates, systemState, auditEvents } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Administrator Examination Center</h1>
          <div className="page-desc">
            Operational control, examination scheduling, candidate assignment, and resilience monitoring.
          </div>
        </div>
        <button onClick={loadDashboard} className="btn btn-secondary btn-sm">
          Refresh Data
        </button>
      </div>

      {notice && (
        <div className="alert alert-success">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'none', border: 'none', fontWeight: 700 }}>
            ×
          </button>
        </div>
      )}

      {/* High-Level Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Examinations</div>
          <div className="stat-value">{metrics.totalExams}</div>
          <div className="stat-sub">Persisted in SQLite database</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Registered Candidates</div>
          <div className="stat-value">{metrics.registeredCandidates}</div>
          <div className="stat-sub">Assigned to active assessments</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed Submissions</div>
          <div className="stat-value">{metrics.totalSubmissions}</div>
          <div className="stat-sub">Locked and graded</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Cloud Sync</div>
          <div className="stat-value" style={{ color: metrics.pendingSyncCount > 0 ? '#d97706' : '#16a34a' }}>
            {metrics.pendingSyncCount}
          </div>
          <div className="stat-sub">{systemState.internetConnected ? 'Cloud Online' : 'Offline Buffer Active'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Node Redundancy Status</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', color: systemState.pauseActive ? '#dc2626' : '#16a34a' }}>
            {systemState.pauseActive ? 'PAUSED (STANDBY LOST)' : 'ACTIVE & PROTECTED'}
          </div>
          <div className="stat-sub">Node A (Primary) + Node B (Standby)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-list">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Node Topology
        </button>
        <button
          className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          Examinations ({exams?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveTab('candidates')}
        >
          Candidates ({candidates?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          Submissions ({metrics.totalSubmissions})
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="card">
            <h2 className="card-title">Live Multi-Node System Status</h2>
            <p className="card-desc">
              Demonstrates local multi-node topology running on this workstation for Seva Innovation evaluation.
            </p>

            <div className="topology-container">
              <div className={`topology-node ${systemState.internetConnected ? 'online' : 'offline'}`}>
                <div className="node-name">Central Cloud</div>
                <div className="node-role">Upstream Sync</div>
                <div className="node-status">
                  <span className={`pill ${systemState.internetConnected ? 'pill-success' : 'pill-danger'}`}>
                    <span className="pill-dot" />
                    {systemState.internetConnected ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <div className={`topology-node ${systemState.nodeA === 'ONLINE' ? 'online' : 'offline'}`}>
                <div className="node-name">Node A</div>
                <div className="node-role">Primary Local Node</div>
                <div className="node-status">
                  <span className={`pill ${systemState.nodeA === 'ONLINE' ? 'pill-success' : 'pill-danger'}`}>
                    <span className="pill-dot" />
                    {systemState.nodeA}
                  </span>
                </div>
              </div>

              <div className={`topology-node ${systemState.nodeB === 'ONLINE' ? 'online' : 'offline'}`}>
                <div className="node-name">Node B</div>
                <div className="node-role">Standby Replication</div>
                <div className="node-status">
                  <span className={`pill ${systemState.nodeB === 'ONLINE' ? 'pill-success' : 'pill-danger'}`}>
                    <span className="pill-dot" />
                    {systemState.nodeB}
                  </span>
                </div>
              </div>

              <div className={`topology-node ${systemState.nodeC === 'ONLINE' ? 'online' : 'offline'}`}>
                <div className="node-name">Node C</div>
                <div className="node-role">Witness & Quorum</div>
                <div className="node-status">
                  <span className={`pill ${systemState.nodeC === 'ONLINE' ? 'pill-success' : 'pill-warning'}`}>
                    <span className="pill-dot" />
                    {systemState.nodeC}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/monitor" className="btn btn-primary btn-sm">
                Open Failure Simulation Controls
              </Link>
              <Link to="/audit" className="btn btn-secondary btn-sm">
                Inspect SHA-256 Hash Chained Audit Log
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Recent Event Ledger</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents?.slice(0, 6).map((evt: any) => (
                    <tr key={evt.id}>
                      <td>
                        <span className="pill pill-neutral">{evt.type}</span>
                      </td>
                      <td>{evt.details}</td>
                      <td>{new Date(evt.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: EXAMS */}
      {activeTab === 'exams' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Configured Examinations</h2>
            <button
              onClick={() => setShowCreateExam(!showCreateExam)}
              className="btn btn-primary btn-sm"
            >
              {showCreateExam ? 'Cancel' : '+ Create New Examination'}
            </button>
          </div>

          {showCreateExam && (
            <div className="card" style={{ border: '2px solid #0f172a' }}>
              <h3 className="card-title">Create Examination</h3>
              <form onSubmit={handleCreateExam}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Examination Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Seva Entrance Aptitude Test 2026"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Minutes)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={examDuration}
                      onChange={(e) => setExamDuration(Number(e.target.value))}
                      required
                      min={1}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Instructions</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={examDesc}
                    onChange={(e) => setExamDesc(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Questions ({questions.length})</div>
                    <button type="button" onClick={handleAddQuestion} className="btn btn-secondary btn-sm">
                      + Add Question
                    </button>
                  </div>

                  {questions.map((q, qIndex) => (
                    <div key={qIndex} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                      <div className="form-group">
                        <label className="form-label">Question {qIndex + 1} Text</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter question prompt..."
                          value={q.text}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex].text = e.target.value;
                            setQuestions(updated);
                          }}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="radio"
                              name={`correct_${qIndex}`}
                              checked={opt.isCorrect}
                              onChange={() => {
                                const updated = [...questions];
                                updated[qIndex].options.forEach((o, idx) => {
                                  o.isCorrect = idx === optIndex;
                                });
                                setQuestions(updated);
                              }}
                            />
                            <input
                              type="text"
                              className="form-input"
                              placeholder={`Option ${optIndex + 1}`}
                              value={opt.text}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIndex].options[optIndex].text = e.target.value;
                                setQuestions(updated);
                              }}
                              required
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                        * Select the radio button corresponding to the correct answer.
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary">
                    Save Examination to SQLite
                  </button>
                  <button type="button" onClick={() => setShowCreateExam(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam: any) => (
                  <tr key={exam.id}>
                    <td style={{ fontWeight: 600 }}>{exam.title}</td>
                    <td>{exam.questions?.length || 0} MCQs</td>
                    <td>{exam.durationMinutes} min</td>
                    <td>
                      <span className={`pill ${exam.status === 'ACTIVE' ? 'pill-success' : 'pill-warning'}`}>
                        <span className="pill-dot" />
                        {exam.status}
                      </span>
                    </td>
                    <td>{new Date(exam.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(exam.id, exam.status)}
                        className="btn btn-secondary btn-sm"
                      >
                        {exam.status === 'ACTIVE' ? 'Pause Exam' : 'Start Exam'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CANDIDATES */}
      {activeTab === 'candidates' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Registered Candidates</h2>
            <button
              onClick={() => setShowAddCand(!showAddCand)}
              className="btn btn-primary btn-sm"
            >
              {showAddCand ? 'Cancel' : '+ Register Candidate'}
            </button>
          </div>

          {showAddCand && (
            <div className="card" style={{ border: '2px solid #0f172a' }}>
              <h3 className="card-title">Register & Assign Candidate</h3>
              <form onSubmit={handleRegisterCandidate}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ananya Rao"
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CAND-104"
                      value={candRegId}
                      onChange={(e) => setCandRegId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="candidate@demo.local"
                      value={candEmail}
                      onChange={(e) => setCandEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign to Examination</label>
                    <select
                      className="form-input"
                      value={candExamId}
                      onChange={(e) => setCandExamId(e.target.value)}
                      required
                    >
                      {exams.map((ex: any) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    Register Candidate
                  </button>
                  <button type="button" onClick={() => setShowAddCand(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Registration ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Assigned Examination</th>
                  <th>Submissions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand: any) => (
                  <tr key={cand.id}>
                    <td style={{ fontWeight: 700 }}>{cand.registrationId}</td>
                    <td>{cand.name}</td>
                    <td>{cand.email}</td>
                    <td>{cand.assignedExams?.join(', ') || 'None'}</td>
                    <td>
                      <span className={`pill ${cand.submittedCount > 0 ? 'pill-success' : 'pill-neutral'}`}>
                        {cand.submittedCount > 0 ? 'Submitted' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <SubmissionsTab />
      )}
    </div>
  );
}

function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSubmissions()
      .then((res) => setSubmissions(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading submissions...</div>;

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Submission ID</th>
            <th>Candidate</th>
            <th>Registration ID</th>
            <th>Examination</th>
            <th>Submitted At</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No completed submissions recorded yet.
              </td>
            </tr>
          ) : (
            submissions.map((sub) => (
              <tr key={sub.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{sub.submissionId}</td>
                <td>{sub.candidate?.user?.name || 'Candidate'}</td>
                <td style={{ fontWeight: 700 }}>{sub.candidate?.registrationId}</td>
                <td>{sub.exam?.title}</td>
                <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                <td>
                  <span className="pill pill-success">CONFIRMED</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------
// FEATURE 3: CANDIDATE EXAMINATION INTERFACE
// ----------------------------------------------------

function CandidateExamPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [responseStatuses, setResponseStatuses] = useState<Record<string, 'SAVED' | 'PENDING' | 'PAUSED'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);

  // Initialize or resume examination
  const initExam = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.startCandidateExam();
      setSessionData(res);

      // Pre-populate saved responses
      const answersMap: Record<string, string> = {};
      const statusMap: Record<string, 'SAVED' | 'PENDING' | 'PAUSED'> = {};
      if (res.responses) {
        res.responses.forEach((r: any) => {
          answersMap[r.questionId] = r.answer;
          statusMap[r.questionId] = 'SAVED';
        });
      }

      // Check IndexedDB for any un-synced pending items
      const pendingItems = await getPendingResponses(res.sessionId);
      pendingItems.forEach((p) => {
        answersMap[p.questionId] = p.answer;
        statusMap[p.questionId] = 'PENDING';
      });

      setSelectedAnswers(answersMap);
      setResponseStatuses(statusMap);

      // Calculate timer
      const elapsedSeconds = Math.floor((Date.now() - new Date(res.startedAt).getTime()) / 1000);
      const totalSec = (res.exam?.durationMinutes || 25) * 60;
      setSecondsRemaining(Math.max(0, totalSec - elapsedSeconds));
    } catch (err: any) {
      setError(err.message || 'Could not load examination. Ensure you are signed in as a candidate.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initExam();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!sessionData || sessionData.sessionStatus === 'SUBMITTED' || submitResult) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionData, submitResult]);

  // Format countdown mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Save selected answer with local IndexedDB & backend transaction
  const handleOptionSelect = async (questionId: string, answerText: string) => {
    if (submitResult || sessionData?.sessionStatus === 'SUBMITTED') return;

    // Update local UI immediately
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerText }));
    setResponseStatuses((prev) => ({ ...prev, [questionId]: 'PENDING' }));

    const clientEventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pendingItem: PendingResponse = {
      clientEventId,
      sessionId: sessionData.sessionId,
      questionId,
      answer: answerText,
      sequenceNumber: (sessionData.responses?.length || 0) + 1,
      timestamp: new Date().toISOString(),
    };

    // 1. Persist to browser IndexedDB so answer survives page refresh
    await savePendingResponse(pendingItem);

    // 2. Dispatch to backend API
    try {
      const res = await api.saveResponse(
        sessionData.sessionId,
        questionId,
        answerText,
        clientEventId,
        pendingItem.sequenceNumber
      );

      if (res.success) {
        // Confirmed by local examination server
        setResponseStatuses((prev) => ({ ...prev, [questionId]: 'SAVED' }));
        await removePendingResponse(clientEventId);
      }
    } catch (err: any) {
      if (err.status === 409) {
        // Redundancy paused!
        setResponseStatuses((prev) => ({ ...prev, [questionId]: 'PAUSED' }));
        setError('Standby node (Node B) is offline! Examination is safely paused to prevent un-replicated response loss.');
      } else {
        // Network or local offline: remains in IndexedDB as PENDING
        setResponseStatuses((prev) => ({ ...prev, [questionId]: 'PENDING' }));
      }
    }
  };

  // Submit Examination
  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    setShowSubmitModal(false);
    try {
      const res = await api.submitCandidateExam(sessionData.sessionId);
      setSubmitResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to submit examination.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card">Loading examination interface...</div>;
  }

  if (error && !sessionData) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="alert alert-danger">{error}</div>
        <p>Please sign in with your candidate registration ID to begin your assigned assessment.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Candidate Sign In
        </Link>
      </div>
    );
  }

  // Submitted view
  if (submitResult || sessionData?.sessionStatus === 'SUBMITTED') {
    const summary = submitResult?.summary;
    return (
      <div className="card" style={{ maxWidth: '680px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <div className="brand-badge" style={{ display: 'inline-block', marginBottom: '1rem', background: '#16a34a' }}>
          SUBMISSION SUCCESSFUL
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
          Examination Submitted & Verified
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          All your responses have been committed to the local audit ledger.
        </p>

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '1.5rem 0' }}>
            <div className="stat-card">
              <div className="stat-label">Total Questions</div>
              <div className="stat-value">{summary.totalQuestions}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Answered</div>
              <div className="stat-value">{summary.answeredCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Score</div>
              <div className="stat-value" style={{ color: '#16a34a' }}>{summary.score} / {summary.totalQuestions}</div>
            </div>
          </div>
        )}

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', textAlign: 'left', marginBottom: '1.5rem' }}>
          <div><strong>Candidate ID:</strong> {sessionData?.candidate?.registrationId || 'CAND-101'}</div>
          <div><strong>Session Reference:</strong> {sessionData?.sessionId}</div>
          <div><strong>Timestamp:</strong> {submitResult?.summary?.submittedAt ? new Date(submitResult.summary.submittedAt).toLocaleString() : 'Confirmed'}</div>
          <div><strong>Ledger Integrity:</strong> Cryptographically locked in SHA-256 event chain.</div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/audit" className="btn btn-secondary">
            Inspect Audit Ledger
          </Link>
          <Link to="/" className="btn btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const questions = sessionData.exam.questions || [];
  const activeQuestion = questions[currentIdx];
  const activeAnswer = activeQuestion ? selectedAnswers[activeQuestion.id] : undefined;
  const activeStatus = activeQuestion ? responseStatuses[activeQuestion.id] : undefined;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div>
      {/* Top Banner / Session Header */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="brand-sub">Official Assessment</div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.2rem 0' }}>
              {sessionData.exam.title}
            </h1>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Candidate: <strong>{sessionData.candidate?.name || 'Candidate'}</strong> ({sessionData.candidate?.registrationId || 'CAND-101'})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Time Remaining
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'monospace', color: secondsRemaining < 300 ? '#dc2626' : '#0f172a' }}>
                {formatTime(secondsRemaining)}
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn btn-primary"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* Persistence Notice & Standby Pause Warnings */}
      {sessionData.pauseActive ? (
        <div className="alert alert-danger">
          <strong>EXAMINATION PAUSED:</strong> Standby Node B is offline. To prevent un-replicated response loss, new answer submissions are currently halted. Answers are preserved in your browser and will confirm once Node B is restored.
        </div>
      ) : !sessionData.internetConnected ? (
        <div className="alert alert-warning">
          <strong>OFFLINE CONTINUITY MODE:</strong> Central cloud connection is offline. Local examination node is actively persisting and confirming your responses without interruption.
        </div>
      ) : null}

      {/* Main Examination Layout */}
      <div className="exam-layout">
        {/* Left: Active Question Sheet */}
        <div className="question-sheet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="question-meta">
              Question {currentIdx + 1} of {questions.length}
            </div>

            {/* Response Status Indicator */}
            <div>
              {activeStatus === 'SAVED' && (
                <span className="pill pill-success" title="Acknowledged by local server">
                  <span className="pill-dot" />
                  Response Saved
                </span>
              )}
              {activeStatus === 'PENDING' && (
                <span className="pill pill-warning" title="Saved in browser IndexedDB queue; awaiting server ack">
                  <span className="pill-dot" />
                  Pending Ack (IndexedDB)
                </span>
              )}
              {activeStatus === 'PAUSED' && (
                <span className="pill pill-danger" title="Standby redundancy unavailable; response halted">
                  <span className="pill-dot" />
                  Paused (Standby Lost)
                </span>
              )}
              {!activeStatus && (
                <span className="pill pill-neutral">
                  Unanswered
                </span>
              )}
            </div>
          </div>

          {activeQuestion && (
            <>
              <div className="question-text">{activeQuestion.text}</div>

              <div className="options-list">
                {activeQuestion.options?.map((opt: any) => {
                  const isChecked = activeAnswer === opt.text;
                  return (
                    <label
                      key={opt.id}
                      className={`option-item ${isChecked ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(activeQuestion.id, opt.text)}
                    >
                      <input
                        type="radio"
                        name={`question_${activeQuestion.id}`}
                        checked={isChecked}
                        onChange={() => {}}
                        className="option-radio"
                      />
                      <span className="option-label">{opt.text}</span>
                    </label>
                  );
                })}
              </div>

              <div className="exam-actions">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(currentIdx - 1)}
                  className="btn btn-secondary"
                >
                  ← Previous
                </button>

                <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                  Selection auto-saves to local database and browser IndexedDB queue.
                </div>

                <button
                  type="button"
                  disabled={currentIdx === questions.length - 1}
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="btn btn-primary"
                >
                  Next →
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem', color: '#64748b', border: '1px solid #e2e8f0' }}>
            <strong>Note on Reliability:</strong> Client-side IndexedDB pending storage safely preserves responses in your browser during transient disconnects, while durable local server acknowledgement guarantees tamper-evident transaction logging across redundant nodes.
          </div>
        </div>

        {/* Right: Question Palette */}
        <aside className="palette-box">
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
            Question Palette
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            Answered: {answeredCount} / {questions.length}
          </div>

          <div className="palette-grid">
            {questions.map((q: any, idx: number) => {
              const isCurrent = idx === currentIdx;
              const status = responseStatuses[q.id];
              let cellClass = 'palette-cell';
              if (status === 'SAVED') cellClass += ' answered';
              else if (status === 'PENDING') cellClass += ' pending';
              if (isCurrent) cellClass += ' current';

              return (
                <button
                  key={q.id}
                  className={cellClass}
                  onClick={() => setCurrentIdx(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', display: 'grid', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#16a34a', borderRadius: '2px' }} />
              <span>Saved Locally</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }} />
              <span>Pending Queue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px' }} />
              <span>Unanswered</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h3 className="card-title">Confirm Final Submission</h3>
            <p className="card-desc">
              You are about to complete and lock your examination. You will not be able to modify your answers after submitting.
            </p>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div>Questions Answered: <strong>{answeredCount}</strong> of {questions.length}</div>
              <div>Unanswered Questions: <strong>{questions.length - answeredCount}</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary"
              >
                Continue Exam
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitExam}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// FEATURE 4: OFFLINE CONTINUITY & FAILURE SIMULATION
// ----------------------------------------------------

function MonitorPage() {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.getSystemStatus();
      setStatusData(res);
    } catch (err: any) {
      console.error('Error fetching system status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const runSimulation = async (action: string) => {
    setIsProcessing(true);
    setActionNotice(null);
    try {
      const res = await api.simulate(action);
      setActionNotice(res.message);
      fetchStatus();
    } catch (err: any) {
      setActionNotice(`Simulation error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSync = async () => {
    setIsProcessing(true);
    setActionNotice(null);
    try {
      const res = await api.syncCloud();
      setActionNotice(res.message);
      fetchStatus();
    } catch (err: any) {
      setActionNotice(`Sync error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading && !statusData) {
    return <div className="card">Loading topology monitoring...</div>;
  }

  const { internetConnected, nodeA, nodeB, nodeC, pauseActive, pendingSyncCount, nodeHealth } = statusData;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fault-Tolerant Continuity Monitor</h1>
          <div className="page-desc">
            Primary Seva Innovation Challenge 2026 Demonstration: Simulating network cuts, standby server crashes, and controlled recovery.
          </div>
        </div>
        <button onClick={fetchStatus} className="btn btn-secondary btn-sm">
          Refresh Live State
        </button>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.85rem 1.1rem', borderRadius: '8px', fontSize: '0.8rem', color: '#1e40af', marginBottom: '1.25rem' }}>
        <strong>Important Hackathon Evaluation Notice:</strong> All node and network states are logically simulated on this single development instance. The simulation verifies real response state transitions, pause safeguards, local persistence, and idempotency without requiring multi-datacenter hardware.
      </div>

      {actionNotice && (
        <div className="alert alert-info">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} style={{ background: 'none', border: 'none', fontWeight: 700 }}>
            ×
          </button>
        </div>
      )}

      {/* Node Topology Cards */}
      <div className="topology-container">
        {/* Central Cloud */}
        <div className={`topology-node ${internetConnected ? 'online' : 'offline'}`}>
          <div className="node-name">Central Cloud</div>
          <div className="node-role">Remote Aggregator</div>
          <div className="node-status">
            <span className={`pill ${internetConnected ? 'pill-success' : 'pill-danger'}`}>
              <span className="pill-dot" />
              {internetConnected ? 'ONLINE' : 'DISCONNECTED'}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
            Pending Sync: <strong>{pendingSyncCount}</strong> records
          </div>
        </div>

        {/* Node A (Primary) */}
        <div className={`topology-node ${nodeA === 'ONLINE' ? 'online' : 'offline'}`}>
          <div className="node-name">Node A (Primary)</div>
          <div className="node-role">Local Exam Server</div>
          <div className="node-status">
            <span className={`pill ${nodeA === 'ONLINE' ? 'pill-success' : 'pill-danger'}`}>
              <span className="pill-dot" />
              {nodeA}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
            SQLite Transaction Store
          </div>
        </div>

        {/* Node B (Standby) */}
        <div className={`topology-node ${nodeB === 'ONLINE' ? 'online' : 'offline'}`}>
          <div className="node-name">Node B (Standby)</div>
          <div className="node-role">Redundancy Replica</div>
          <div className="node-status">
            <span className={`pill ${nodeB === 'ONLINE' ? 'pill-success' : 'pill-danger'}`}>
              <span className="pill-dot" />
              {nodeB}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
            {nodeB === 'ONLINE' ? 'Synchronized' : 'SAFE PAUSE TRIGGERED'}
          </div>
        </div>

        {/* Node C (Witness) */}
        <div className={`topology-node ${nodeC === 'ONLINE' ? 'online' : 'paused'}`}>
          <div className="node-name">Node C (Witness)</div>
          <div className="node-role">Quorum Arbitrator</div>
          <div className="node-status">
            <span className={`pill ${nodeC === 'ONLINE' ? 'pill-success' : 'pill-warning'}`}>
              <span className="pill-dot" />
              {nodeC}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
            Split-Brain Prevention
          </div>
        </div>

        {/* Candidate Device */}
        <div className="topology-node online">
          <div className="node-name">Candidate Clients</div>
          <div className="node-role">Browser Devices</div>
          <div className="node-status">
            <span className="pill pill-success">
              <span className="pill-dot" />
              ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
            IndexedDB Local Queue
          </div>
        </div>
      </div>

      {/* Failure Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">Live Demonstration Failure Controls</h2>
        <p className="card-desc">
          Trigger the three core Seva scenarios to test offline continuity, safe standby pause, and recovery.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Scenario A & B: Internet Disconnect / Reconnect */}
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
              Scenario 1: Internet Cut & Recovery
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Simulates wide-area network failure. Candidates continue answering locally; records sync when reconnected.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                disabled={isProcessing || !internetConnected}
                onClick={() => runSimulation('disconnect_internet')}
                className="btn btn-danger btn-sm"
              >
                Disconnect Internet
              </button>
              <button
                disabled={isProcessing || internetConnected}
                onClick={() => runSimulation('reconnect_internet')}
                className="btn btn-success btn-sm"
              >
                Reconnect Internet
              </button>
              <button
                disabled={isProcessing || !internetConnected || pendingSyncCount === 0}
                onClick={handleSync}
                className="btn btn-primary btn-sm"
              >
                Sync Records ({pendingSyncCount})
              </button>
            </div>
          </div>

          {/* Scenario C & D: Node B Standby Loss (SAFE PAUSE) */}
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: pauseActive ? '#dc2626' : '#0f172a' }}>
              Scenario 2: Standby Node B Loss (Safe Pause)
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
              When standby redundancy fails, system safely pauses rather than pretending single-node writes are protected.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                disabled={isProcessing || nodeB === 'OFFLINE'}
                onClick={() => runSimulation('fail_node_b')}
                className="btn btn-danger btn-sm"
              >
                Crash Node B (Pause Exam)
              </button>
              <button
                disabled={isProcessing || nodeB === 'ONLINE'}
                onClick={() => runSimulation('restore_node_b')}
                className="btn btn-success btn-sm"
              >
                Restore Node B (Resume)
              </button>
            </div>
          </div>

          {/* Scenario E & F: Primary & Witness Controls */}
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
              Scenario 3: Primary & Quorum Controls
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Simulates Primary Node A outage and Witness Node C quorum degradation warnings.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                disabled={isProcessing}
                onClick={() => runSimulation(nodeA === 'ONLINE' ? 'fail_node_a' : 'restore_node_a')}
                className="btn btn-secondary btn-sm"
              >
                {nodeA === 'ONLINE' ? 'Fail Node A' : 'Recover Node A'}
              </button>
              <button
                disabled={isProcessing}
                onClick={() => runSimulation(nodeC === 'ONLINE' ? 'fail_node_c' : 'restore_node_c')}
                className="btn btn-secondary btn-sm"
              >
                {nodeC === 'ONLINE' ? 'Fail Witness C' : 'Recover Witness C'}
              </button>
              <button
                disabled={isProcessing}
                onClick={() => runSimulation('reset')}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700 }}
              >
                Reset All Healthy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Node Health Detail Table */}
      <div className="card">
        <h2 className="card-title">Node Health Log</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Status</th>
                <th>Health Message</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {nodeHealth?.map((node: any) => (
                <tr key={node.id}>
                  <td style={{ fontWeight: 700 }}>{node.nodeName}</td>
                  <td>
                    <span className={`pill ${node.status === 'ONLINE' ? 'pill-success' : 'pill-danger'}`}>
                      <span className="pill-dot" />
                      {node.status}
                    </span>
                  </td>
                  <td>{node.message}</td>
                  <td>{new Date(node.lastUpdated).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// FEATURE 5: AUDIT LOG & SHA-256 HASH VERIFICATION
// ----------------------------------------------------

function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAudit = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLog(100);
      setEvents(data);
    } catch (err: any) {
      console.error('Audit load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAuditLog();
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({ verified: false, status: 'VERIFICATION_ERROR', error: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.eventId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tamper-Evident Audit Trail</h1>
          <div className="page-desc">
            Append-only examination event ledger. Every event is cryptographically bound using deterministic SHA-256 hash chaining.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="btn btn-primary btn-sm"
          >
            {verifying ? 'Recalculating Hashes...' : 'Verify SHA-256 Hash Chain'}
          </button>
          <button onClick={loadAudit} className="btn btn-secondary btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {verificationResult && (
        <div
          className={`alert ${verificationResult.verified ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: '1.25rem' }}
        >
          <div>
            <strong>Chain Verification Result: </strong>
            {verificationResult.verified ? (
              <span>INTEGRITY VERIFIED (TAMPER-FREE). All {verificationResult.totalEvents} events match deterministic SHA-256 digests from GENESIS.</span>
            ) : (
              <span>INTEGRITY VIOLATION DETECTED. An event hash mismatch was discovered at index {verificationResult.corruptedIndex}.</span>
            )}
          </div>
          <button onClick={() => setVerificationResult(null)} style={{ background: 'none', border: 'none', fontWeight: 700 }}>
            ×
          </button>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Event Records ({filteredEvents.length})</h2>
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: '300px' }}
            placeholder="Search by event type, details, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div>Loading audit trail...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Previous Hash (SHA-256)</th>
                  <th>Current Hash (SHA-256)</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                      {e.eventId.substring(0, 8)}...
                    </td>
                    <td>
                      <span className="pill pill-neutral">{e.type}</span>
                    </td>
                    <td style={{ maxWidth: '340px' }}>{e.details}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748b' }}>
                      {e.previousHash === 'GENESIS' ? 'GENESIS' : `${e.previousHash?.substring(0, 10)}...`}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#0f172a', fontWeight: 600 }}>
                      {e.currentHash ? `${e.currentHash.substring(0, 10)}...` : 'N/A'}
                    </td>
                    <td>{new Date(e.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
