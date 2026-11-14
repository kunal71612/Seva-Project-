import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';

const demoCredentials = {
  admin: { email: 'admin@onemind.local', password: 'Admin@123' },
  candidate: { registrationId: 'CAND-101' },
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">OneMind Labs</div>
            <h1>OneMind</h1>
          </div>
          <nav className="nav">
            <Link to="/">Login</Link>
            <Link to="/admin">Admin</Link>
            <Link to="/candidate">Candidate</Link>
            <Link to="/monitor">Monitor</Link>
          </nav>
        </header>

        <main className="content-panel">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/candidate" element={<CandidatePage />} />
            <Route path="/monitor" element={<MonitorPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function HomePage() {
  return (
    <div className="stack">
      <section className="card">
        <div className="eyebrow">Secure examination continuity</div>
        <h2>Offline-first infrastructure for reliable exams</h2>
        <p>
          OneMind keeps local candidate responses protected during outages and makes the synchronization process explicit for administrators and judges.
        </p>
        <div className="grid two-col">
          <div className="mini-panel">
            <div className="small-label">Administrator login</div>
            <p>{demoCredentials.admin.email}</p>
            <code>{demoCredentials.admin.password}</code>
          </div>
          <div className="mini-panel">
            <div className="small-label">Candidate login</div>
            <p>{demoCredentials.candidate.registrationId}</p>
            <code>Candidate@123</code>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="eyebrow">Prototype status</div>
        <div className="status-list">
          <div className="status-item ok"><span className="dot" /> Cloud connectivity: Online</div>
          <div className="status-item ok"><span className="dot" /> Node A: Primary server active</div>
          <div className="status-item ok"><span className="dot" /> Node B: Standby healthy</div>
          <div className="status-item ok"><span className="dot" /> Node C: Witness quorum available</div>
        </div>
      </section>
    </div>
  );
}

function AdminPage() {
  return (
    <div className="stack">
      <section className="card">
        <div className="eyebrow">Administration dashboard</div>
        <h2>Examination operations</h2>
        <form className="form-grid">
          <input defaultValue="Seva Aptitude Demo" />
          <input defaultValue="Demonstration exam for offline-first reliability" />
          <input defaultValue="25" />
          <textarea defaultValue="Q1: Which number comes next in the sequence?\nQ2: Logical reasoning\nQ3: Time and work" />
          <button type="button">Create examination</button>
        </form>
      </section>

      <section className="card">
        <div className="eyebrow">Registered candidates</div>
        <div className="table">
          <div className="row header">
            <span>Name</span>
            <span>Registration ID</span>
            <span>Status</span>
          </div>
          <div className="row">
            <span>Aisha Rahman</span>
            <span>CAND-101</span>
            <span className="pill ok">Submitted</span>
          </div>
          <div className="row">
            <span>Mehul Nair</span>
            <span>CAND-102</span>
            <span className="pill warning">In progress</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function CandidatePage() {
  const questions = [
    { id: 'q1', text: 'Which number comes next in the sequence: 2, 6, 12, 20, ?', options: ['28', '30', '32', '36'] },
    { id: 'q2', text: 'If all roses are flowers and some flowers fade quickly, which statement is valid?', options: ['All roses fade quickly.', 'Some roses fade quickly.', 'Some flowers are roses.', 'No flowers are roses.'] },
    { id: 'q3', text: 'A candidate completes 3 tasks in 4 hours. At the same pace, how long will 5 tasks take?', options: ['6 hours 40 minutes', '7 hours', '5 hours 30 minutes', '8 hours'] },
  ];

  return (
    <div className="stack">
      <section className="card exam-header">
        <div>
          <div className="eyebrow">Candidate examination</div>
          <h2>Seva Aptitude Demo</h2>
        </div>
        <div className="timer">24:58</div>
      </section>

      <section className="card exam-layout">
        <aside className="palette">
          <div className="palette-header">Question palette</div>
          {questions.map((question, index) => (
            <button key={question.id} className={index === 0 ? 'palette-btn active' : 'palette-btn'}>
              {index + 1}
            </button>
          ))}
        </aside>

        <div className="exam-sheet">
          <div className="question-meta">Question 1 of 3</div>
          <h3>{questions[0].text}</h3>
          <div className="option-list">
            {questions[0].options.map((option) => (
              <label key={option} className="option-row">
                <input type="radio" name="q1" />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <div className="action-row">
            <button type="button" className="secondary">Previous</button>
            <button type="button" className="secondary">Save answer</button>
            <button type="button">Next</button>
          </div>
          <div className="status-banner success">Response status: saved locally, awaiting acknowledgement.</div>
        </div>
      </section>
    </div>
  );
}

function MonitorPage() {
  return (
    <div className="stack">
      <section className="card">
        <div className="eyebrow">System monitoring dashboard</div>
        <h2>Fault-tolerant continuity simulation</h2>
        <div className="topology">
          <div className="node cloud">Cloud</div>
          <div className="node primary">Node A <small>Primary</small></div>
          <div className="node standby">Node B <small>Standby</small></div>
          <div className="node witness">Node C <small>Witness</small></div>
          <div className="node candidate-device">Candidate Device</div>
        </div>
        <div className="controls">
          <button type="button">Internet disconnect</button>
          <button type="button">Internet reconnect</button>
          <button type="button">Node B failure</button>
          <button type="button">Node A recovery</button>
          <button type="button">Node C warning</button>
        </div>
      </section>

      <section className="card">
        <div className="eyebrow">Audit log</div>
        <div className="audit-list">
          <div className="audit-item"><span className="tag">LOGIN</span> Candidate CAND-101 logged in.</div>
          <div className="audit-item"><span className="tag">SAVE</span> Response event ev-101 saved with version 1.</div>
          <div className="audit-item"><span className="tag">PAUSE</span> Node B failed; new response processing paused.</div>
          <div className="audit-item"><span className="tag">SYNC</span> Internet restored; pending responses synchronized.</div>
        </div>
      </section>
    </div>
  );
}

export default App;
