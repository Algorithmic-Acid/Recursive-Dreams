import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Edit2, Check, X, Camera, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/Avatar';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AuthModal } from '../components/AuthModal';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Profile {
  id: string;
  name: string;
  bio: string;
  location: string;
  avatarUrl: string;
  createdAt: string;
}

interface ForumPost {
  id: string;
  userId: string;
  title: string;
  category: string;
  commentCount: number;
  likesCount: number;
  createdAt: string;
}

export const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const authUser = useAuthStore((state) => state.user);
  const authToken = useAuthStore((state) => state.token);
  const authLogout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userPosts, setUserPosts] = useState<ForumPost[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if viewing own profile
  const isOwnProfile = !userId || (authUser && userId === authUser.id);
  const targetUserId = userId || authUser?.id;

  const user = authUser ? { name: authUser.name, email: authUser.email } : null;
  const isAdmin = authUser?.role === 'admin';

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
      fetchUserPosts();
    } else {
      setLoading(false);
    }
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/profile/${targetUserId}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setEditForm({
          name: data.data.name,
          bio: data.data.bio,
          location: data.data.location,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/blog/forum?limit=50`);
      const data = await res.json();
      if (data.success) {
        setUserPosts(data.data.filter((p: ForumPost) => p.userId === targetUserId));
      }
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    }
  };

  const handleSave = async () => {
    if (!authToken) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => prev ? { ...prev, ...data.data } : prev);
        updateProfile({ name: data.data.name, avatarUrl: data.data.avatarUrl });
        // Update localStorage for backward compat
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = data.data.name;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
        setEditing(false);
        toast.success('Profile updated');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;

    if (file.size > 500 * 1024) {
      toast.error('Image must be under 500KB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const newUrl = data.data.avatarUrl + '?t=' + Date.now();
        setProfile((prev) => prev ? { ...prev, avatarUrl: newUrl } : prev);
        updateProfile({ avatarUrl: newUrl });
        toast.success('Avatar updated');
      } else {
        toast.error(data.error || 'Failed to upload avatar');
      }
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authLogout();
    toast.success('Logged out');
  };

  // Not logged in and no userId param
  if (!targetUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
        <Header
          onCategoryChange={() => {}} onSearch={() => {}} onCartClick={() => {}}
          user={null} isAdmin={false}
          onLogin={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
          onRegister={() => { setAuthModalMode('register'); setIsAuthModalOpen(true); }}
          onLogout={handleLogout}
        />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white/60 text-lg font-mono">[ LOGIN_REQUIRED ]</p>
          <button
            type="button"
            onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all"
          >
            LOGIN
          </button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authModalMode} onSuccess={() => setIsAuthModalOpen(false)} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
      <Header
        onCategoryChange={() => {}} onSearch={() => {}} onCartClick={() => {}}
        user={user} isAdmin={isAdmin}
        onLogin={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
        onRegister={() => { setAuthModalMode('register'); setIsAuthModalOpen(true); }}
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 max-w-3xl">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition mb-6 font-mono text-sm">
          <ArrowLeft className="w-4 h-4" /> BACK
        </Link>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-cyan-400 font-mono">[ LOADING_PROFILE... ]</div>
          </div>
        ) : !profile ? (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg font-mono">[ USER_NOT_FOUND ]</p>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 sm:p-8">
              {/* Avatar + Name row */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar src={profile.avatarUrl} name={profile.name} size="xl" />
                  {isOwnProfile && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-2xl font-bold bg-black/50 border border-cyan-500/30 rounded px-3 py-1 text-white w-full max-w-xs focus:outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{profile.name}</h1>
                  )}

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-white/50">
                    {(profile.location || editing) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {editing ? (
                          <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            placeholder="Your location"
                            className="bg-black/50 border border-cyan-500/30 rounded px-2 py-0.5 text-white text-sm w-32 focus:outline-none focus:border-cyan-500"
                          />
                        ) : (
                          <span>{profile.location}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Edit / Save buttons */}
                  {isOwnProfile && (
                    <div className="mt-3 flex gap-2 justify-center sm:justify-start">
                      {editing ? (
                        <>
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded text-green-400 hover:bg-green-500/30 transition text-sm font-mono"
                          >
                            <Check className="w-3.5 h-3.5" /> {saving ? 'SAVING...' : 'SAVE'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(false);
                              setEditForm({ name: profile.name, bio: profile.bio, location: profile.location });
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded text-red-400 hover:bg-red-500/30 transition text-sm font-mono"
                          >
                            <X className="w-3.5 h-3.5" /> CANCEL
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded text-cyan-400 hover:bg-cyan-500/30 transition text-sm font-mono"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> EDIT_PROFILE
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6">
                <h3 className="text-xs font-mono text-white/40 uppercase tracking-wider mb-2">Bio</h3>
                {editing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    maxLength={500}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                  />
                ) : (
                  <p className="text-white/70 text-sm whitespace-pre-wrap">
                    {profile.bio || (isOwnProfile ? 'No bio yet. Click edit to add one.' : 'No bio.')}
                  </p>
                )}
                {editing && (
                  <p className="text-white/30 text-xs mt-1 text-right">{editForm.bio.length}/500</p>
                )}
              </div>
            </div>

            {/* Forum Posts */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span className="font-mono text-sm text-white/60">FORUM_POSTS</span>
                <span className="text-xs text-white/30 font-mono">({userPosts.length})</span>
              </h2>

              {userPosts.length === 0 ? (
                <p className="text-white/40 text-sm font-mono py-4">[ NO_POSTS_YET ]</p>
              ) : (
                <div className="space-y-2">
                  {userPosts.map((post) => (
                    <Link
                      key={post.id}
                      to="/forum"
                      className="block bg-dark-card border border-cyan-500/10 hover:border-cyan-500/30 rounded-lg px-4 py-3 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white text-sm font-medium">{post.title}</span>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] uppercase">{post.category}</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            <span>{post.commentCount} comments</span>
                          </div>
                        </div>
                        <span className="text-pink-400 text-sm">{post.likesCount} likes</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authModalMode} onSuccess={() => setIsAuthModalOpen(false)} />
      <Footer />
    </div>
  );
};
