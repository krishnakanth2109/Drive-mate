import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { Button } from '../components/Button';
import { GitCommit, GitBranch, ArrowLeft } from 'lucide-react';

export function CommitLog() {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentBranch = searchParams.get('branch') || 'main';
  const [commits, setCommits] = useState([]);
  const [refs, setRefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const refsData = await fetchApi(`/api/repos/${owner}/${repo}/refs`);
        setRefs(refsData.refs || {});
        const data = await fetchApi(`/repos/${owner}/${repo}/commits?branch=${currentBranch}`);
        setCommits(data);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    loadData();
  }, [owner, repo, currentBranch]);

  const branches = Object.keys(refs).filter(r => r.startsWith('refs/heads/')).map(r => r.replace('refs/heads/', ''));

  if (loading && commits.length === 0) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-[#0d1117] border border-[#da3633] text-[#f85149] rounded-md px-4 py-3 mb-4 text-sm">{error}</div>
        <Button onClick={() => navigate(`/${owner}/${repo}?branch=${currentBranch}`)}>Back to Repo</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate(`/${owner}/${repo}?branch=${currentBranch}`)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => navigate('/dashboard')} className="text-[#58a6ff] hover:underline font-semibold">{owner}</button>
          <span className="text-[#8b949e]">/</span>
          <button onClick={() => navigate(`/${owner}/${repo}`)} className="text-[#58a6ff] hover:underline font-semibold">{repo}</button>
          <span className="text-[#8b949e]">/</span>
          <span className="text-[#c9d1d9] font-semibold">commits</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#8b949e]" />
          <select
            value={currentBranch}
            onChange={(e) => setSearchParams({ branch: e.target.value })}
            className="bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-sm rounded-md px-3 py-1 focus:outline-none focus:border-[#58a6ff]"
          >
            {branches.length === 0 && <option value="main">main</option>}
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Commit List */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#30363d]">
          <GitCommit className="w-4 h-4 text-[#8b949e]" />
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Commits on {currentBranch}</h2>
          <span className="ml-auto bg-[#30363d] text-[#c9d1d9] text-xs font-semibold px-2 py-0.5 rounded-full">{commits.length}</span>
        </div>
        {commits.length === 0 ? (
          <div className="px-6 py-10 text-center text-[#8b949e] text-sm">No commits found on this branch.</div>
        ) : (
          <ul className="divide-y divide-[#30363d]">
            {commits.map((commit, idx) => (
              <li key={idx} className="px-4 py-4 flex items-start justify-between gap-4 hover:bg-[#0d1117]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1f6feb] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {commit.author?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <Link
                      to={`/${owner}/${repo}/commit/${commit.hash}`}
                      className="text-sm text-[#c9d1d9] font-semibold hover:text-[#58a6ff] hover:underline block mb-1"
                    >
                      {commit.message || '(no message)'}
                    </Link>
                    <p className="text-xs text-[#8b949e]">
                      <span className="font-semibold text-[#c9d1d9]">{commit.author}</span> committed on{' '}
                      {new Date(commit.timestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/${owner}/${repo}/commit/${commit.hash}`}
                  className="font-mono text-xs text-[#58a6ff] bg-[#1f6feb]/10 border border-[#1f6feb]/30 px-2 py-1 rounded hover:border-[#58a6ff] shrink-0"
                >
                  {commit.hash.substring(0, 7)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
