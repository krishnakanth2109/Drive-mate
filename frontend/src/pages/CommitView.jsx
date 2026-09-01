import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { Button } from '../components/Button';
import { GitCommit, ArrowLeft, FilePlus, FileMinus, FileEdit } from 'lucide-react';

function DiffViewer({ owner, repo, file }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadContent() {
      if (file.status === 'added' || file.status === 'modified') {
        setLoading(true);
        try {
          const text = await fetchApi(`/repos/${owner}/${repo}/blob/${file.hash}`);
          setContent(text);
        } catch (e) { setContent('Failed to load file content.'); }
        finally { setLoading(false); }
      }
    }
    loadContent();
  }, [owner, repo, file]);

  const statusConfig = {
    added: { icon: FilePlus, color: 'text-[#3fb950]', bg: 'bg-[#3fb950]/10', border: 'border-[#3fb950]/30', badge: 'bg-[#3fb950]/20 text-[#3fb950]' },
    modified: { icon: FileEdit, color: 'text-[#58a6ff]', bg: 'bg-[#58a6ff]/10', border: 'border-[#58a6ff]/30', badge: 'bg-[#58a6ff]/20 text-[#58a6ff]' },
    deleted: { icon: FileMinus, color: 'text-[#f85149]', bg: 'bg-[#f85149]/10', border: 'border-[#f85149]/30', badge: 'bg-[#f85149]/20 text-[#f85149]' },
  };
  const cfg = statusConfig[file.status] || statusConfig.modified;
  const Icon = cfg.icon;

  return (
    <div className={`border rounded-md overflow-hidden mb-4 ${cfg.border} bg-[#161b22]`}>
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#30363d] bg-[#0d1117]">
        <Icon className={`w-4 h-4 ${cfg.color}`} />
        <span className={`font-mono text-sm font-semibold ${cfg.color}`}>{file.path}</span>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{file.status}</span>
      </div>
      {file.status === 'deleted' ? (
        <div className="px-4 py-3 text-[#8b949e] italic text-sm">File was deleted in this commit.</div>
      ) : loading ? (
        <div className="flex justify-center p-8">
          <div className="w-6 h-6 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <pre className="p-4 text-xs font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed whitespace-pre-wrap">
          <code>{content}</code>
        </pre>
      )}
    </div>
  );
}

export function CommitView() {
  const { owner, repo, hash } = useParams();
  const navigate = useNavigate();
  const [commit, setCommit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCommit() {
      try {
        const data = await fetchApi(`/repos/${owner}/${repo}/commits/${hash}`);
        setCommit(data);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    loadCommit();
  }, [owner, repo, hash]);

  if (loading) {
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
        <Button onClick={() => navigate(`/${owner}/${repo}/commits`)}>Back to Commits</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate(`/${owner}/${repo}/commits`)}>
          <ArrowLeft className="w-4 h-4" /> Back to commits
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => navigate('/dashboard')} className="text-[#58a6ff] hover:underline font-semibold">{owner}</button>
          <span className="text-[#8b949e]">/</span>
          <button onClick={() => navigate(`/${owner}/${repo}`)} className="text-[#58a6ff] hover:underline font-semibold">{repo}</button>
          <span className="text-[#8b949e]">/</span>
          <span className="text-[#c9d1d9] font-mono">{hash.substring(0, 7)}</span>
        </div>
      </div>

      {/* Commit Hero */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-md p-6 mb-6">
        <h1 className="text-xl font-semibold text-[#c9d1d9] mb-4">{commit.message || '(no message)'}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[#8b949e] border-t border-[#30363d] pt-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1f6feb] flex items-center justify-center text-white text-xs font-bold">
              {commit.author?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="font-semibold text-[#c9d1d9]">{commit.author}</span>
            <span>committed</span>
          </div>
          <span>{new Date(commit.timestamp * 1000).toLocaleString()}</span>
          <code className="ml-auto font-mono text-sm text-[#58a6ff] bg-[#1f6feb]/10 border border-[#1f6feb]/30 px-3 py-1 rounded">
            {commit.hash.substring(0, 12)}
          </code>
        </div>
      </div>

      {/* Diff Files */}
      <div className="flex items-center gap-2 mb-4">
        <GitCommit className="w-4 h-4 text-[#8b949e]" />
        <h2 className="text-sm font-semibold text-[#c9d1d9]">
          Showing <span className="text-[#58a6ff]">{commit.diff?.length || 0}</span> changed file{commit.diff?.length !== 1 ? 's' : ''}
        </h2>
      </div>
      {commit.diff?.length === 0 ? (
        <p className="text-[#8b949e] text-sm">No files were changed in this commit.</p>
      ) : (
        commit.diff?.map((file, idx) => (
          <DiffViewer key={idx} owner={owner} repo={repo} file={file} />
        ))
      )}
    </div>
  );
}
