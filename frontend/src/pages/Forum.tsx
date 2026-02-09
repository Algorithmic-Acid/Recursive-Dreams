import { useState, useEffect } from 'react';
import { MessageSquare, Heart, Send, Pin, Eye, Plus, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AuthModal } from '../components/AuthModal';
import { Avatar } from '../components/Avatar';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '';

interface ForumPost {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  viewCount: number;
  likesCount: number;
  commentCount: number;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
}

export const Forum = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Use Zustand as single source of truth for auth
  const authUser = useAuthStore((state) => state.user);
  const authToken = useAuthStore((state) => state.token);
  const authLogout = useAuthStore((state) => state.logout);
  const authLoginFn = useAuthStore((state) => state.login);
  const user = authUser ? { name: authUser.name, email: authUser.email } : null;
  const isAdmin = authUser?.role === 'admin';

  // New post form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general',
  });

  // Comment form
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  // Edit post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  const token = authToken || localStorage.getItem('token');
  const isLoggedIn = !!token;

  // Get current user ID from Zustand or JWT fallback
  const currentUserId = authUser?.id || null;

  // On mount, sync localStorage -> Zustand if needed
  useEffect(() => {
    if (!authToken) {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const tokenData = JSON.parse(atob(storedToken.split('.')[1]));
          if (tokenData.exp * 1000 > Date.now()) {
            authLoginFn({ ...parsedUser, role: tokenData.role || (parsedUser.isAdmin ? 'admin' : 'user') }, storedToken);
          }
        } catch { /* ignore */ }
      }
    }
  }, [authToken, authLoginFn]);

  const categories = [
    { value: 'all', label: 'All Posts', icon: '🌐' },
    { value: 'general', label: 'General', icon: '💬' },
    { value: 'lore', label: 'Site Lore', icon: '📖' },
    { value: 'support', label: 'Support', icon: '🛠️' },
    { value: 'announcements', label: 'Announcements', icon: '📢' },
  ];

  const handleAuthSuccess = () => {
    // Zustand store is already updated by AuthModal's authLogin call
    setIsAuthModalOpen(false);
    fetchPosts();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    authLogout();
    toast.success('Logged out successfully');
  };

  const handleLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleRegister = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategory === 'all' ? '' : `?category=${selectedCategory}`;
      const res = await fetch(`${API_URL}/api/blog/forum${categoryParam}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch forum posts:', error);
      toast.error('Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/blog/${postId}/comments`);
      const data = await res.json();
      if (data.success) {
        setComments(prev => ({ ...prev, [postId]: data.data }));
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please log in to create a post');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/blog/forum`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPost),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Post created successfully!');
        setNewPost({ title: '', content: '', category: 'general' });
        setShowNewPost(false);
        fetchPosts();
      } else {
        toast.error(data.error || 'Failed to create post');
      }
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!isLoggedIn) {
      toast.error('Please log in to like posts');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/blog/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        fetchPosts();
      }
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!isLoggedIn) {
      toast.error('Please log in to comment');
      return;
    }

    const content = newComment[postId];
    if (!content?.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/blog/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (data.success) {
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        fetchComments(postId);
        fetchPosts();
      }
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const startEditing = (post: ForumPost) => {
    setEditingPostId(post.id);
    setEditForm({ title: post.title, content: post.content });
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditForm({ title: '', content: '' });
  };

  const handleEditPost = async (postId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/blog/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Post updated!');
        cancelEditing();
        fetchPosts();
      } else {
        toast.error(data.error || 'Failed to update post');
      }
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const toggleComments = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      lore: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      support: 'text-green-400 border-green-500/30 bg-green-500/10',
      announcements: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
      reviews: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Header
        onCategoryChange={() => navigate('/')}
        onSearch={() => {}}
        onCartClick={() => {}}
        user={user}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Forum Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">
            VOID FORUM
          </h1>
          <p className="text-white/60 text-sm sm:text-base font-mono">
            Discuss the void, share lore, and connect with the community
          </p>
        </div>

        {/* Category Filter & New Post Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 sm:px-4 py-2 rounded-lg border font-mono text-xs sm:text-sm transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-cyan-500/50'
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {isLoggedIn && (
            <button
              onClick={() => setShowNewPost(!showNewPost)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-sm rounded hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              NEW POST
            </button>
          )}
        </div>

        {/* New Post Form */}
        {showNewPost && (
          <form onSubmit={handleCreatePost} className="bg-dark-card border border-cyan-500/30 rounded-lg p-4 sm:p-6 space-y-4 mb-6">
            <div>
              <label className="block text-white/60 text-sm mb-2 font-mono">TITLE</label>
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="What's on your mind?"
                className="w-full px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2 font-mono">CATEGORY</label>
              <select
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="general">💬 General</option>
                <option value="lore">📖 Site Lore</option>
                <option value="support">🛠️ Support</option>
              </select>
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2 font-mono">CONTENT</label>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="Share your thoughts with the void..."
                rows={6}
                className="w-full px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white focus:border-cyan-500 focus:outline-none resize-none"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                POST
              </button>
              <button
                type="button"
                onClick={() => setShowNewPost(false)}
                className="px-4 py-2 bg-white/5 border border-white/20 text-white/60 rounded hover:bg-white/10 transition-all"
              >
                CANCEL
              </button>
            </div>
          </form>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-8 text-center">
            <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 font-mono">No posts yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-dark-card border border-cyan-500/20 rounded-lg p-4 sm:p-6 hover:border-cyan-500/40 transition-all">
                {editingPostId === post.id ? (
                  /* Inline Edit Form */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/60 text-xs mb-1 font-mono">TITLE</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Post title"
                        className="w-full px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1 font-mono">CONTENT</label>
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        placeholder="Post content"
                        rows={6}
                        className="w-full px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white focus:border-cyan-500 focus:outline-none resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditPost(post.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm rounded hover:shadow-lg transition-all"
                      >
                        <Check className="w-4 h-4" />
                        SAVE
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 text-white/60 text-sm rounded hover:bg-white/10 transition-all"
                      >
                        <X className="w-4 h-4" />
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {post.isPinned && (
                            <Pin className="w-4 h-4 text-yellow-400" />
                          )}
                          <h3 className="text-white font-bold text-lg sm:text-xl">{post.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-white/50 flex-wrap">
                          <span className={`px-2 py-1 rounded border text-xs ${getCategoryColor(post.category)}`}>
                            {post.category.toUpperCase()}
                          </span>
                          <Link to={`/profile/${post.userId}`} className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
                            <Avatar src={post.authorAvatar} name={post.authorName} size="sm" />
                            <span>{post.authorName}</span>
                          </Link>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.viewCount}
                          </span>
                        </div>
                      </div>

                      {/* Edit button - show for post owner or admin */}
                      {isLoggedIn && (post.userId === currentUserId || isAdmin) && (
                        <button
                          onClick={() => startEditing(post)}
                          className="p-2 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-all"
                          title="Edit post"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Post Content Preview */}
                    <p className="text-white/80 mb-4 whitespace-pre-wrap line-clamp-3">{post.content}</p>

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className="flex items-center gap-2 text-white/60 hover:text-pink-400 transition-colors"
                        disabled={!isLoggedIn}
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{post.likesCount}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-2 text-white/60 hover:text-cyan-400 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{post.commentCount}</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Comments Section */}
                {expandedPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    {/* Full Content */}
                    <p className="text-white/80 whitespace-pre-wrap mb-4">{post.content}</p>

                    {/* Comments List */}
                    {comments[post.id]?.map(comment => (
                      <div key={comment.id} className="bg-dark-bg/50 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar src={comment.authorAvatar} name={comment.authorName} size="sm" />
                          <span className="text-cyan-400 text-sm font-medium">{comment.authorName}</span>
                          <span className="text-white/30 text-xs">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm">{comment.content}</p>
                      </div>
                    ))}

                    {/* Add Comment */}
                    {isLoggedIn && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Write a comment..."
                          className="flex-1 px-3 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="px-3 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoggedIn && (
          <div className="mt-6 bg-dark-card border border-yellow-500/30 rounded-lg p-4 text-center">
            <p className="text-yellow-400 text-sm font-mono">
              Log in to create posts, like content, and join the conversation!
            </p>
          </div>
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
