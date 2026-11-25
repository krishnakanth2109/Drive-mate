import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { PostRideView } from '../components/dashboard/PostRideView';
import { RidesAvailableView } from '../components/dashboard/RidesAvailableView';
import { UserDetailsView } from '../components/dashboard/UserDetailsView';
import { SecuritySettingsView } from '../components/dashboard/SecuritySettingsView';
import { CommunityChatView } from '../components/dashboard/CommunityChatView';
import { WalletView } from '../components/dashboard/WalletView';

export function UserDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('dm_theme') || 'dark');
  const isDark = theme === 'dark';

  // Community Rides State
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [searchQuery, setSearchQuery] = useState('');

  // Connections & Chat State
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [activeChatPeer, setActiveChatPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  // 1. Session Auth Verification & Socket Init
  useEffect(() => {
    const token = sessionStorage.getItem('dm_user_token');
    const storedUser = sessionStorage.getItem('dm_user_profile');

    if (!token) {
      navigate('/login');
      return;
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserProfile(parsed);
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }

    // Connect Socket.io
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        socket.emit('join_room', user.id || user._id);
      } catch (e) {}
    }

    socket.on('community:message', (incomingMsg) => {
      setMessages((prev) => [...prev, incomingMsg]);
    });

    socket.on('community:new_post', (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  // Scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. Fetch Community Posts
  const fetchCommunityPosts = async () => {
    setPostsLoading(true);
    try {
      const params = {};
      if (selectedCity !== 'All Cities') {
        params.city = selectedCity;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await axios.get(`${API_URL}/community/posts`, { params });
      if (res.data?.data) {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching community posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  // 3. Fetch Connections
  const fetchConnections = async () => {
    const token = sessionStorage.getItem('dm_user_token');
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/community/connections`, {
        headers: { 'x-auth-token': token },
      });
      if (res.data?.data) {
        setConnectedUsers(res.data.data);
        if (res.data.data.length > 0 && !activeChatPeer) {
          setActiveChatPeer(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  useEffect(() => {
    fetchCommunityPosts();
    fetchConnections();
  }, [selectedCity]);

  // 4. Fetch Messages for Active Peer
  useEffect(() => {
    if (!activeChatPeer) return;

    const fetchMessages = async () => {
      const token = sessionStorage.getItem('dm_user_token');
      try {
        const res = await axios.get(
          `${API_URL}/community/messages/${activeChatPeer.id || activeChatPeer._id}`,
          {
            headers: token ? { 'x-auth-token': token } : {},
          }
        );
        if (res.data?.data) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, [activeChatPeer]);

  // 5. Send Direct Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessageText.trim() || !activeChatPeer) return;

    const token = sessionStorage.getItem('dm_user_token');
    const recipientId = activeChatPeer.id || activeChatPeer._id;
    const text = newMessageText.trim();

    setSendingMessage(true);
    try {
      const res = await axios.post(
        `${API_URL}/community/messages`,
        { recipientId, content: text },
        { headers: token ? { 'x-auth-token': token } : {} }
      );

      if (res.data?.data) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessageText('');
        if (socketRef.current) {
          socketRef.current.emit('community:send_message', {
            recipientId,
            message: res.data.data,
          });
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // 6. Handle New Post Callback
  const handlePostPublished = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setActiveTab('rides');
  };

  // 7. Handle Profile Update Callback
  const handleProfileUpdated = (updatedUser) => {
    setUserProfile(updatedUser);
  };

  // 8. Open Chat with Driver
  const handleOpenChatWithDriver = (driver) => {
    setActiveChatPeer(driver);
    setActiveTab('inbox');
  };

  // 9. Logout
  const handleLogout = () => {
    sessionStorage.removeItem('dm_user_token');
    sessionStorage.removeItem('dm_user_profile');
    navigate('/login');
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('dm_theme', nextTheme);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#070b14] text-white' : 'bg-[#f3f2ef] text-slate-900'} flex flex-col font-sans relative overflow-x-hidden transition-colors duration-200`}>
      {/* Background Neon Elements */}
      {isDark && (
        <>
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#38c6ec]/5 rounded-full blur-[180px] pointer-events-none" />
          <div className="fixed -bottom-20 right-10 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />
        </>
      )}

      {/* Top Header Navigation (Sidebar in Header - LinkedIn style) */}
      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        theme={theme}
        setTheme={setTheme}
        unreadCount={0}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Content Body */}
      <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto relative z-10">
          {activeTab === 'overview' && (
            <DashboardOverview
              userProfile={userProfile}
              posts={posts}
              setActiveTab={setActiveTab}
              connectedUsers={connectedUsers}
              theme={theme}
            />
          )}

          {activeTab === 'post-ride' && (
            <PostRideView
              userProfile={userProfile}
              onPostPublished={handlePostPublished}
              API_URL={API_URL}
              theme={theme}
            />
          )}

          {activeTab === 'rides' && (
            <RidesAvailableView
              posts={posts}
              loading={postsLoading}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onRefresh={fetchCommunityPosts}
              connectedDrivers={connectedUsers.map((u) => u.id || u._id)}
              onOpenChat={handleOpenChatWithDriver}
              theme={theme}
            />
          )}

          {activeTab === 'user-details' && (
            <UserDetailsView
              userProfile={userProfile}
              onProfileUpdated={handleProfileUpdated}
              API_URL={API_URL}
              theme={theme}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettingsView
              userProfile={userProfile}
              API_URL={API_URL}
              theme={theme}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletView
              userProfile={userProfile}
              API_URL={API_URL}
              theme={theme}
              socket={socketRef.current}
            />
          )}

          {activeTab === 'inbox' && (
            <CommunityChatView
              userProfile={userProfile}
              connectedUsers={connectedUsers}
              activeChatPeer={activeChatPeer}
              setActiveChatPeer={setActiveChatPeer}
              messages={messages}
              newMessageText={newMessageText}
              setNewMessageText={setNewMessageText}
              handleSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
              messagesEndRef={messagesEndRef}
              theme={theme}
            />
          )}
        </main>
    </div>
  );
}
export default UserDashboard;
