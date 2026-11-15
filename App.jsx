import { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import {
  Upload,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  MessageSquare,
  Trash2,
  Edit3,
  X,
  Send,
  Users,
  Mail,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [campaignContext, setCampaignContext] = useState(
    'Hiring Full-Stack & AI Developers at Zyqen Technology'
  );
  const [demoMode, setDemoMode] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);

  // Fetch candidates from backend
  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API_URL}/candidates`);
      setCandidates(res.data);
    } catch (err) {
      console.error('Error fetching candidates:', err);
    }
  };

  // Auto-refresh dashboard every 3 seconds to show live email sending updates
  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 3000);
    return () => clearInterval(interval);
  }, []);

  // Parse uploaded CSV file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvRows(results.data);
      },
    });
  };

  // Load 2 sample rows for quick testing (replace emails with your own test inbox!)
  const loadSampleData = () => {
    setFileName('sample_candidates.csv');
    setCsvRows([
      {
        Name: 'Aarav Sharma',
        Email: 'your_test_email@gmail.com',
        Role: 'Frontend Developer',
        Skills: 'React, Tailwind CSS, JavaScript',
      },
      {
        Name: 'Priya Verma',
        Email: 'your_second_email@gmail.com',
        Role: 'AI Engineer',
        Skills: 'Python, Machine Learning, LLMs',
      },
    ]);
  };

  // Send CSV rows to Gemini AI backend to generate personalized drafts
  const handleGenerateDrafts = async () => {
    if (!csvRows.length) return alert('Please upload a CSV file first!');
    setLoadingAI(true);
    try {
      await axios.post(`${API_URL}/generate-drafts`, {
        candidates: csvRows,
        campaignContext,
      });
      setCsvRows([]);
      setFileName('');
      await fetchCandidates();
    } catch (err) {
      alert('Failed to generate AI drafts. Check that your backend server is running.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Launch automated sequence for all Draft candidates
  const handleLaunch = async () => {
    try {
      await axios.post(`${API_URL}/launch`, { demoMode });
      await fetchCandidates();
    } catch (err) {
      alert('Error launching sequence');
    }
  };

  // Simulate candidate reply (Auto-pauses follow-up emails)
  const handleMarkReplied = async (id) => {
    try {
      await axios.post(`${API_URL}/candidates/${id}/reply`);
      await fetchCandidates();
    } catch (err) {
      alert('Error updating status');
    }
  };

  // Save edited email draft
  const handleSaveEdit = async () => {
    if (!editingCandidate) return;
    try {
      await axios.put(`${API_URL}/candidates/${editingCandidate._id}`, editingCandidate);
      setEditingCandidate(null);
      await fetchCandidates();
    } catch (err) {
      alert('Error saving draft');
    }
  };

  // Clear all candidates
  const handleClearAll = async () => {
    if (!window.confirm('Clear all candidates and reset dashboard?')) return;
    try {
      await axios.delete(`${API_URL}/candidates`);
      await fetchCandidates();
    } catch (err) {
      alert('Error clearing candidates');
    }
  };

  // Summary metrics
  const totalCount = candidates.length;
  const draftCount = candidates.filter((c) => c.status === 'Draft').length;
  const activeCount = candidates.filter((c) => c.status === 'Active').length;
  const completedOrReplied = candidates.filter(
    (c) => c.status === 'Completed' || c.status === 'Replied'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Zyqen Technology — AI Mail Automator
              </h1>
              <p className="text-xs text-slate-400">
                Intelligent Multi-Step Candidate Outreach Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Scheduler Active
            </span>
            {candidates.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-red-600 text-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Candidates"
            value={totalCount}
            icon={<Users className="w-5 h-5 text-blue-600" />}
          />
          <StatCard
            title="AI Drafts Ready"
            value={draftCount}
            icon={<Sparkles className="w-5 h-5 text-amber-500" />}
          />
          <StatCard
            title="Active Sequences"
            value={activeCount}
            icon={<Clock className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard
            title="Replied / Completed"
            value={completedOrReplied}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          />
        </div>

        {/* Step 1: CSV Ingestion & AI Prompt Panel */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1. Feed Candidate Data & Generate AI Sequence
              </h2>
              <p className="text-xs text-slate-500">
                Upload a CSV with columns: <code className="bg-slate-100 px-1 rounded">Name, Email, Role, Skills</code>
              </p>
            </div>
            <button
              onClick={loadSampleData}
              className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Load Sample Rows
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* CSV File Picker */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 cursor-pointer bg-slate-50/60 transition">
              <Upload className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">
                {fileName ? `${fileName} (${csvRows.length} candidates loaded)` : 'Click to upload Candidate CSV'}
              </span>
              <span className="text-xs text-slate-400 mt-1">Supports .csv files</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* AI Campaign Context */}
            <div className="flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outreach Context / AI Instructions
                </label>
                <textarea
                  rows={2}
                  value={campaignContext}
                  onChange={(e) => setCampaignContext(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the role or goal for Zyqen Technology..."
                />
              </div>

              <button
                onClick={handleGenerateDrafts}
                disabled={loadingAI || !csvRows.length}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {loadingAI
                  ? 'Generating Personalized AI Emails...'
                  : `Generate AI Drafts (${csvRows.length})`}
              </button>
            </div>
          </div>
        </section>

        {/* Step 2: Launch Controls & Live Sequence Tracker */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. Sequence Queue & Live Tracking
              </h2>
              <p className="text-xs text-slate-500">
                Preview AI drafts before launching, or simulate a reply to auto-pause follow-ups.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Demo Mode vs Real Mode Toggle */}
              <label className="inline-flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Demo Mode (30s Follow-up)
              </label>

              <button
                onClick={handleLaunch}
                disabled={draftCount === 0}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-sm px-4 py-2 rounded-lg transition cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Launch Sequence ({draftCount})
              </button>
            </div>
          </div>

          {/* Candidate Table */}
          {candidates.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Mail className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No candidates in queue yet</p>
              <p className="text-xs">Upload a CSV above and click "Generate AI Drafts" to begin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Role & Skills</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Live Activity Log</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {candidates.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{c.role}</div>
                        <div className="text-xs text-slate-500">{c.skills}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} step={c.currentStep} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{c.lastLog}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingCandidate(c)}
                          className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md font-medium cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Drafts
                        </button>

                        {c.status === 'Active' && (
                          <button
                            onClick={() => handleMarkReplied(c._id)}
                            className="inline-flex items-center gap-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1.5 rounded-md font-medium cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Mark Replied
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal to Preview / Edit AI-Generated Emails */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">
                  AI Sequence Drafts — {editingCandidate.name}
                </h3>
                <p className="text-xs text-slate-500">{editingCandidate.email}</p>
              </div>
              <button
                onClick={() => setEditingCandidate(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 space-y-2">
                <span className="text-xs font-bold text-blue-700 uppercase">
                  Step 1 — Initial Outreach
                </span>
                <input
                  type="text"
                  value={editingCandidate.step1Subject}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, step1Subject: e.target.value })
                  }
                  className="w-full text-sm font-medium bg-white border border-slate-300 rounded px-2.5 py-1.5"
                />
                <textarea
                  rows={4}
                  value={editingCandidate.step1Body}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, step1Body: e.target.value })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded p-2.5"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Step 2 — Automated Follow-Up (If No Reply)
                </span>
                <input
                  type="text"
                  value={editingCandidate.step2Subject}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, step2Subject: e.target.value })
                  }
                  className="w-full text-sm font-medium bg-white border border-slate-300 rounded px-2.5 py-1.5"
                />
                <textarea
                  rows={3}
                  value={editingCandidate.step2Body}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, step2Body: e.target.value })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded p-2.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">{icon}</div>
    </div>
  );
}

function StatusBadge({ status, step }) {
  const styles = {
    Draft: 'bg-slate-100 text-slate-700 border-slate-200',
    Active: 'bg-blue-50 text-blue-700 border-blue-200',
    Replied: 'bg-amber-50 text-amber-800 border-amber-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[status] || styles.Draft
      }`}
    >
      {status === 'Active' ? `Active (Step ${step})` : status}
    </span>
  );
}