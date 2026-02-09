import { useState, useEffect } from 'react';
import { MessageSquare, Heart, Send, Star, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  rating: number | null;
  isVerifiedDownload: boolean;
  likesCount: number;
  commentCount: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface ProductBlogProps {
  productId: string;
}

export const ProductBlog = ({ productId }: ProductBlogProps) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});

  // New post form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    rating: 5,
  });

  // Comment form
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  useEffect(() => {
    fetchPosts();
  }, [productId]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/blog/product/${productId}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
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
      const res = await fetch(`${API_URL}/api/blog/product/${productId}`, {
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
        setNewPost({ title: '', content: '', rating: 5 });
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg sm:text-2xl font-bold text-cyan-400 font-mono flex items-center gap-2">
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          COMMUNITY REVIEWS
        </h3>
        {isLoggedIn && (
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs sm:text-sm rounded hover:shadow-lg transition-all"
          >
            {showNewPost ? 'CANCEL' : 'WRITE REVIEW'}
          </button>
        )}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <form onSubmit={handleCreatePost} className="bg-dark-card border border-cyan-500/30 rounded-lg p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-2 font-mono">TITLE</label>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="Share your experience..."
              className="w-full px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2 font-mono">YOUR REVIEW</label>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="What do you think about this product?"
              rows={4}
              className="w-full px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white focus:border-cyan-500 focus:outline-none resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2 font-mono">RATING</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNewPost({ ...newPost, rating: num })}
                  className={`p-2 rounded transition-all ${
                    num <= newPost.rating
                      ? 'text-yellow-400'
                      : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  <Star className={`w-6 h-6 ${num <= newPost.rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            POST REVIEW
          </button>
        </form>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-8 text-center">
          <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 font-mono">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-dark-card border border-cyan-500/20 rounded-lg p-4 sm:p-6">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-white font-bold text-base sm:text-lg">{post.title}</h4>
                    {post.isVerifiedDownload && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded" title="Verified Download">
                        <Shield className="w-3 h-3" />
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-white/50">
                    <span>{post.authorName}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {post.rating && (
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < post.rating! ? 'text-yellow-400 fill-current' : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Post Content */}
              <p className="text-white/80 mb-4 whitespace-pre-wrap">{post.content}</p>

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

              {/* Comments Section */}
              {expandedPost === post.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  {/* Comment List */}
                  {comments[post.id]?.map(comment => (
                    <div key={comment.id} className="bg-dark-bg/50 rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
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

      {!isLoggedIn && posts.length > 0 && (
        <div className="bg-dark-card border border-yellow-500/30 rounded-lg p-4 text-center">
          <p className="text-yellow-400 text-sm font-mono">
            Log in to like posts, write reviews, and join the conversation!
          </p>
        </div>
      )}
    </div>
  );
};
