import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchApi } from '../api/client';
import { Button } from '../components/Button';
import { HardDrive, GitBranch, File, Folder, ArrowLeft, Code, BookOpen, Clock } from 'lucide-react';

export function RepoView() {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentBranch = searchParams.get('branch') || 'main';

  const [repoData, setRepoData] = useState(null);
  const [tree, setTree] = useState([]);
  const [refs, setRefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBlob, setSelectedBlob] = useState(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [readme, setReadme] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const repoInfo = await fetchApi(`/repos/${owner}/${repo}`);
        setRepoData(repoInfo);
        const refsData = await fetchApi(`/api/repos/${owner}/${repo}/refs`);
        setRefs(refsData.refs || {});
        const treeData = await fetchApi(`/repos/${owner}/${repo}/tree?branch=${currentBranch}`);
        const treeArray = Array.isArray(treeData) ? treeData : [];
        setTree(treeArray);
        const readmeNode = treeArray.find(item => item.name.toLowerCase() === 'readme.md');
        if (readmeNode && !selectedBlob) {
          try {
            const text = await fetchApi(`/repos/${owner}/${repo}/blob/${readmeNode.hash}`);
            setReadme(text);
          } catch (e) { setReadme(null); }
        } else { setReadme(null); }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    loadData();
  }, [owner, repo, currentBranch]);

  async function handleItemClick(item) {
    if (item.type === 'blob') {
      setBlobLoading(true);
      setSelectedBlob({ name: item.name, hash: item.hash, content: '' });
      try {
        const text = await fetchApi(`/repos/${owner}/${repo}/blob/${item.hash}`);
        setSelectedBlob({ name: item.name, hash: item.hash, content: text });
      } catch (err) {
        setSelectedBlob({ name: item.name, hash: item.hash, content: 'Failed to load content.' });
      } finally { setBlobLoading(false); }
    }
  }

  const branches = Object.keys(refs).filter(r => r.startsWith('refs/heads/')).map(r => r.replace('refs/heads/', ''));

  if (loading && !repoData) {
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
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">

      {/* Repo Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#8b949e]" />
          <select
            value={currentBranch}
            onChange={(e) => { setSearchParams({ branch: e.target.value }); setSelectedBlob(null); }}
            className="bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-sm rounded-md px-3 py-1 focus:outline-none focus:border-[#58a6ff]"
          >
            {branches.length === 0 && <option value="main">main</option>}
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <Button onClick={() => navigate(`/${owner}/${repo}/commits?branch=${currentBranch}`)}>
          <Clock className="w-4 h-4" /> Commit History
        </Button>
      </div>

      {/* File Viewer or File Browser */}
      {selectedBlob ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
            <button onClick={() => setSelectedBlob(null)} className="text-[#58a6ff] hover:underline text-sm">← Back</button>
            <span className="text-[#8b949e]">/</span>
            <span className="font-mono text-sm text-[#c9d1d9]">{selectedBlob.name}</span>
          </div>
          {blobLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-6 h-6 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <pre className="p-4 text-sm font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed whitespace-pre-wrap">
              <code>{selectedBlob.content}</code>
            </pre>
          )}
        </div>
      ) : (
        <>
          {/* File List */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden mb-4">
            <div className="flex items-center px-4 py-2 bg-[#161b22] border-b border-[#30363d] text-xs text-[#8b949e]">
              <span className="font-semibold text-[#c9d1d9] mr-2">main</span>
              <span className="text-[#8b949e]">branch</span>
            </div>
            {tree.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Code className="w-8 h-8 text-[#8b949e] mx-auto mb-3" />
                <p className="text-[#8b949e] text-sm">This branch is empty. Push your first commit to get started.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#30363d]">
                {tree.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleItemClick(item)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-[#0d1117] cursor-pointer"
                  >
                    {item.type === 'tree'
                      ? <Folder className="w-4 h-4 text-[#58a6ff] shrink-0" />
                      : <File className="w-4 h-4 text-[#8b949e] shrink-0" />}
                    <span className={`text-sm font-mono ${item.type === 'tree' ? 'text-[#58a6ff] hover:underline' : 'text-[#c9d1d9] hover:text-[#58a6ff] hover:underline'}`}>
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* README */}
          {readme && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[#30363d]">
                <BookOpen className="w-4 h-4 text-[#8b949e]" />
                <span className="text-sm font-semibold text-[#c9d1d9]">README.md</span>
              </div>
              <div className="p-6 text-sm text-[#c9d1d9] leading-relaxed prose prose-invert max-w-none">
                <ReactMarkdown>{readme}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* About Card */}
          <div className="mt-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-md p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">About</h3>
              <p className="text-sm text-[#8b949e]">{repoData?.description || 'No description provided.'}</p>
              <hr className="my-3 border-[#30363d]" />
              <h4 className="text-xs font-semibold text-[#8b949e] uppercase mb-2">Clone</h4>
              <code className="block bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-xs font-mono text-[#c9d1d9] break-all">
                vlt clone {owner}/{repo}
              </code>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
