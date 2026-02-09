import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Shield,
  Trash2,
  Crown,
  RefreshCw,
  Download,
  Plus,
  Edit2,
  Check,
  X,
  Music,
  Activity,
  Clock,
  Zap,
  TrendingUp,
  Globe,
  Skull,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RequestLog, TrafficStats, TrafficTrend } from '../types';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FreeDownload {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  fileSize: string;
  filename: string;
  platform: string[];
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
  };
  recentOrders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    userName: string;
    userEmail: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }>;
  userGrowth: Array<{ date: string; count: number }>;
  orderGrowth: Array<{ date: string; count: number; revenue: number }>;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  shipping: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: Array<{
    productName: string;
    productIcon: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface DownloadLog {
  id: string;
  timestamp: string;
  filename: string;
  productName: string;
  downloadType: 'free_vst' | 'steal_it';
  ipAddress: string;
  fullIpAddress: string;
  browser: string;
  userName: string | null;
  userEmail: string | null;
  isGuest: boolean;
  isBot: boolean;
}

interface DownloadCount {
  filename: string;
  productName: string;
  downloadType: 'free_vst' | 'steal_it';
  totalDownloads: number;
  guestDownloads: number;
  uniqueIPs: number;
  uniquePirateIPs: number;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export const Admin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [downloads, setDownloads] = useState<FreeDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'downloads' | 'piracy' | 'traffic' | 'security'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [downloadCounts, setDownloadCounts] = useState<DownloadCount[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showAddDownload, setShowAddDownload] = useState(false);
  const [editingDownload, setEditingDownload] = useState<FreeDownload | null>(null);
  const [downloadForm, setDownloadForm] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    fileSize: '',
    filename: '',
  });

  // Traffic monitoring state
  const [trafficStats, setTrafficStats] = useState<TrafficStats | null>(null);
  const [trafficLogs, setTrafficLogs] = useState<RequestLog[]>([]);
  const [trafficTrends, setTrafficTrends] = useState<TrafficTrend[]>([]);
  const [trendInterval, setTrendInterval] = useState<'hourly' | 'daily'>('hourly');

  // Security state
  const [blacklistData, setBlacklistData] = useState<any>(null);
  const [trappedRequests, setTrappedRequests] = useState<any[]>([]);
  const [banIpInput, setBanIpInput] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      toast.error('Please login to access admin panel');
      navigate('/');
      return;
    }

    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      if (tokenData.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }
    } catch (error) {
      toast.error('Invalid session. Please login again.');
      navigate('/');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const [usersRes, statsRes, downloadsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/downloads`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const downloadsData = await downloadsRes.json();

      if (usersData.success) {
        setUsers(usersData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
      if (downloadsData.success) {
        setDownloads(downloadsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrafficData = async () => {
    const token = localStorage.getItem('token');

    try {
      const [statsRes, logsRes, trendsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/traffic/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/traffic/logs?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/traffic/trends?interval=${trendInterval}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const logsData = await logsRes.json();
      const trendsData = await trendsRes.json();

      if (statsData.success) {
        setTrafficStats(statsData.data);
      }
      if (logsData.success) {
        setTrafficLogs(logsData.data);
      }
      if (trendsData.success) {
        setTrafficTrends(trendsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch traffic data:', error);
      toast.error('Failed to load traffic data');
    }
  };

  // Fetch traffic data when traffic tab is active
  useEffect(() => {
    if (activeTab === 'traffic') {
      fetchTrafficData();
    }
  }, [activeTab, trendInterval]);

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  // Fetch download logs when piracy tab is active
  useEffect(() => {
    if (activeTab === 'piracy') {
      fetchDownloadLogs();
    }
  }, [activeTab]);

  // Fetch security data when security tab is active
  useEffect(() => {
    if (activeTab === 'security') {
      fetchSecurityData();
    }
  }, [activeTab]);

  const fetchSecurityData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [blacklistRes, trappedRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/security/blacklist`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/security/trapped`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const blacklistJson = await blacklistRes.json();
      const trappedJson = await trappedRes.json();
      if (blacklistJson.success) setBlacklistData(blacklistJson.data);
      if (trappedJson.success) setTrappedRequests(trappedJson.data);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      toast.error('Failed to load security data');
    }
  };

  const handleBanIp = async () => {
    if (!banIpInput.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/security/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ip: banIpInput.trim(), reason: banReasonInput.trim() || 'Manual admin ban' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setBanIpInput('');
        setBanReasonInput('');
        fetchSecurityData();
      } else {
        toast.error(data.error);
      }
    } catch { toast.error('Failed to ban IP'); }
  };

  const handleUnbanIp = async (ip: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/security/ban/${encodeURIComponent(ip)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchSecurityData();
      } else {
        toast.error(data.error);
      }
    } catch { toast.error('Failed to unban IP'); }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    }
  };

  const fetchDownloadLogs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/download-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDownloadLogs(data.data.logs);
        setDownloadCounts(data.data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch download logs:', error);
      toast.error('Failed to load download logs');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
        toast.success('Order status updated');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
    }
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isAdmin: !isAdmin })
      });

      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: !isAdmin } : u));
        toast.success(`User ${!isAdmin ? 'promoted to' : 'removed from'} admin`);
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== userId));
        toast.success('User deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Free Downloads Management
  const createDownload = async () => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/admin/downloads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(downloadForm)
      });

      const data = await res.json();
      if (data.success) {
        setDownloads([data.data, ...downloads]);
        setShowAddDownload(false);
        setDownloadForm({ name: '', description: '', version: '1.0.0', fileSize: '', filename: '' });
        toast.success('Download created successfully');
      } else {
        toast.error(data.error || 'Failed to create download');
      }
    } catch (error) {
      console.error('Failed to create download:', error);
      toast.error('Failed to create download');
    }
  };

  const updateDownload = async () => {
    if (!editingDownload) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/admin/downloads/${editingDownload.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(downloadForm)
      });

      const data = await res.json();
      if (data.success) {
        setDownloads(downloads.map(d => d.id === editingDownload.id ? data.data : d));
        setEditingDownload(null);
        setDownloadForm({ name: '', description: '', version: '1.0.0', fileSize: '', filename: '' });
        toast.success('Download updated successfully');
      } else {
        toast.error(data.error || 'Failed to update download');
      }
    } catch (error) {
      console.error('Failed to update download:', error);
      toast.error('Failed to update download');
    }
  };

  const toggleDownloadActive = async (download: FreeDownload) => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/admin/downloads/${download.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !download.isActive })
      });

      const data = await res.json();
      if (data.success) {
        setDownloads(downloads.map(d => d.id === download.id ? { ...d, isActive: !d.isActive } : d));
        toast.success(`Download ${!download.isActive ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      console.error('Failed to toggle download:', error);
      toast.error('Failed to update download');
    }
  };

  const deleteDownload = async (downloadId: string, downloadName: string) => {
    if (!confirm(`Are you sure you want to delete "${downloadName}"?`)) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/admin/downloads/${downloadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setDownloads(downloads.filter(d => d.id !== downloadId));
        toast.success('Download deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete download');
      }
    } catch (error) {
      console.error('Failed to delete download:', error);
      toast.error('Failed to delete download');
    }
  };

  const startEditDownload = (download: FreeDownload) => {
    setEditingDownload(download);
    setDownloadForm({
      name: download.name,
      description: download.description,
      version: download.version,
      fileSize: download.fileSize,
      filename: download.filename,
    });
  };

  const cancelEdit = () => {
    setEditingDownload(null);
    setShowAddDownload(false);
    setDownloadForm({ name: '', description: '', version: '1.0.0', fileSize: '', filename: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-cyan-400 text-lg font-mono">[ LOADING_ADMIN_PANEL... ]</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
      {/* Header */}
      <div className="bg-dark-card border-b border-cyan-500/20">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 sm:gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-mono text-xs sm:text-sm">BACK</span>
          </Link>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/20 transition-colors font-mono text-xs sm:text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">REFRESH</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
          <Shield className="w-7 h-7 sm:w-10 sm:h-10 text-cyan-400" />
          <div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              ADMIN PANEL
            </h1>
            <p className="text-white/50 font-mono text-xs sm:text-sm">[ SYSTEM_CONTROL_CENTER ]</p>
          </div>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-8 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-mono text-xs sm:text-sm rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-white'
                : 'bg-dark-card border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
            }`}
          >
            OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-mono text-xs sm:text-sm rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'users'
                ? 'bg-cyan-500 text-white'
                : 'bg-dark-card border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
            }`}
          >
            USERS ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-mono text-xs sm:text-sm rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-white'
                : 'bg-dark-card border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
            }`}
          >
            ORDERS
          </button>
          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-mono text-xs sm:text-sm rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'downloads'
                ? 'bg-cyan-500 text-white'
                : 'bg-dark-card border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
            }`}
          >
            FREE DL
          </button>
          <button
            onClick={() => setActiveTab('piracy')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-mono text-xs sm:text-sm rounded-lg transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              activeTab === 'piracy'
                ? 'bg-red-500 text-white'
                : 'bg-dark-card border border-red-500/30 text-red-400 hover:bg-red-500/10'
            }`}
          >
            <Skull className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            PIRACY
          </button>
          <button
            onClick={() => setActiveTab('traffic')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-mono text-xs sm:text-sm rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'traffic'
                ? 'bg-cyan-500 text-white'
                : 'bg-dark-card border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            TRAFFIC
            {trafficStats && (
              <span className="bg-cyan-500/20 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">
                {trafficStats.totalRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-mono text-xs sm:text-sm rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'security'
                ? 'bg-orange-500 text-white'
                : 'bg-dark-card border border-orange-500/30 text-orange-400 hover:bg-orange-500/10'
            }`}
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            SECURITY
            {blacklistData && blacklistData.totalBanned > 0 && (
              <span className="bg-red-500/30 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">
                {blacklistData.totalBanned}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            {!stats ? (
              <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 sm:p-8 text-center">
                <p className="text-white/50 font-mono text-sm mb-4">Failed to load stats data</p>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors font-mono text-sm"
                >
                  Retry
                </button>
              </div>
            ) : (
            <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
              <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400" />
                  <span className="text-white/60 font-mono text-[10px] sm:text-sm">USERS</span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-white">{stats.overview.totalUsers}</div>
              </div>

              <div className="bg-dark-card border border-purple-500/20 rounded-lg p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <Package className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                  <span className="text-white/60 font-mono text-[10px] sm:text-sm">PRODUCTS</span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-white">{stats.overview.totalProducts}</div>
              </div>

              <div className="bg-dark-card border border-pink-500/20 rounded-lg p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-pink-400" />
                  <span className="text-white/60 font-mono text-[10px] sm:text-sm">ORDERS</span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-white">{stats.overview.totalOrders}</div>
                <div className="text-[10px] sm:text-xs text-white/40 font-mono mt-0.5 sm:mt-1">
                  {stats.overview.pendingOrders} pending
                </div>
              </div>

              <div className="bg-dark-card border border-green-500/20 rounded-lg p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                  <span className="text-white/60 font-mono text-[10px] sm:text-sm">REVENUE</span>
                </div>
                <div className="text-lg sm:text-3xl font-bold text-white">
                  {formatCurrency(stats.overview.totalRevenue)}
                </div>
              </div>
            </div>

            {/* Recent Orders & Low Stock */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Recent Orders */}
              <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-6">
                <h3 className="text-sm sm:text-lg font-bold text-cyan-400 mb-3 sm:mb-4 font-mono flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  RECENT_ORDERS
                </h3>
                {stats.recentOrders.length === 0 ? (
                  <p className="text-white/50 font-mono text-xs sm:text-sm">No orders yet</p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {stats.recentOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 bg-dark-bg/50 rounded border border-cyan-500/10">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="text-white text-xs sm:text-sm truncate">{order.userName || 'Guest'}</div>
                          <div className="text-white/40 text-[10px] sm:text-xs font-mono truncate">{order.userEmail}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-cyan-400 font-mono text-xs sm:text-base">{formatCurrency(order.totalAmount)}</div>
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Low Stock Alert */}
              <div className="bg-dark-card border border-orange-500/20 rounded-lg p-3 sm:p-6">
                <h3 className="text-sm sm:text-lg font-bold text-orange-400 mb-3 sm:mb-4 font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  LOW_STOCK_ALERT
                </h3>
                {stats.lowStockProducts.length === 0 ? (
                  <p className="text-white/50 font-mono text-xs sm:text-sm">All products well stocked</p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {stats.lowStockProducts.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 bg-dark-bg/50 rounded border border-orange-500/10">
                        <div className="text-white text-xs sm:text-sm truncate flex-1 mr-2">{product.name}</div>
                        <div className="text-right flex-shrink-0">
                          <span className={`font-mono text-xs sm:text-base ${
                            product.stockQuantity === 0 ? 'text-red-400' : 'text-orange-400'
                          }`}>
                            {product.stockQuantity} / {product.lowStockThreshold}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-dark-card border border-cyan-500/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-dark-bg/50">
                  <tr>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm">USER</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm hidden sm:table-cell">EMAIL</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm">ROLE</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm hidden md:table-cell">JOINED</th>
                    <th className="text-right px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t border-cyan-500/10 hover:bg-cyan-500/5">
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {user.isAdmin && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />}
                          <div className="min-w-0">
                            <span className="text-white text-xs sm:text-sm block truncate">{user.name}</span>
                            <span className="text-white/50 text-[10px] sm:hidden truncate block">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-white/70 font-mono text-xs sm:text-sm hidden sm:table-cell">
                        <span className="truncate block max-w-[150px] lg:max-w-none">{user.email}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-mono ${
                          user.isAdmin
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {user.isAdmin ? 'ADMIN' : 'USER'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-white/50 text-xs sm:text-sm hidden md:table-cell">{formatDate(user.createdAt)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => toggleAdmin(user.id, user.isAdmin)}
                            className={`p-1.5 sm:p-2 rounded transition-colors ${
                              user.isAdmin
                                ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                            }`}
                            title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                          >
                            <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            className="p-1.5 sm:p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Add/Edit Download Form */}
            {(showAddDownload || editingDownload) && (
              <div className="bg-dark-card border border-cyan-500/30 rounded-lg p-3 sm:p-6">
                <h3 className="text-sm sm:text-lg font-bold text-cyan-400 mb-3 sm:mb-4 font-mono">
                  {editingDownload ? '// EDIT_DOWNLOAD' : '// ADD_NEW_DOWNLOAD'}
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-white/60 text-xs sm:text-sm mb-1 font-mono">NAME</label>
                    <input
                      type="text"
                      value={downloadForm.name}
                      onChange={(e) => setDownloadForm({ ...downloadForm, name: e.target.value })}
                      placeholder="Tape Wobble VST3"
                      className="w-full px-3 sm:px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs sm:text-sm mb-1 font-mono">FILENAME</label>
                    <input
                      type="text"
                      value={downloadForm.filename}
                      onChange={(e) => setDownloadForm({ ...downloadForm, filename: e.target.value })}
                      placeholder="TapeWobble.zip"
                      className="w-full px-3 sm:px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs sm:text-sm mb-1 font-mono">VERSION</label>
                    <input
                      type="text"
                      value={downloadForm.version}
                      onChange={(e) => setDownloadForm({ ...downloadForm, version: e.target.value })}
                      placeholder="1.0.0"
                      className="w-full px-3 sm:px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs sm:text-sm mb-1 font-mono">FILE SIZE</label>
                    <input
                      type="text"
                      value={downloadForm.fileSize}
                      onChange={(e) => setDownloadForm({ ...downloadForm, fileSize: e.target.value })}
                      placeholder="1.9 MB"
                      className="w-full px-3 sm:px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-white/60 text-xs sm:text-sm mb-1 font-mono">DESCRIPTION</label>
                    <textarea
                      value={downloadForm.description}
                      onChange={(e) => setDownloadForm({ ...downloadForm, description: e.target.value })}
                      placeholder="A powerful audio plugin for..."
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2 bg-dark-bg border border-cyan-500/30 rounded text-white text-sm focus:border-cyan-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <button
                    onClick={editingDownload ? updateDownload : createDownload}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs sm:text-sm rounded hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                  >
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {editingDownload ? 'UPDATE' : 'CREATE'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-dark-bg border border-cyan-500/30 text-white text-xs sm:text-sm rounded hover:bg-cyan-500/10 transition-all"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {/* Add Button */}
            {!showAddDownload && !editingDownload && (
              <button
                onClick={() => setShowAddDownload(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs sm:text-sm rounded hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                ADD FREE DOWNLOAD
              </button>
            )}

            {/* Downloads List */}
            <div className="bg-dark-card border border-cyan-500/20 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="bg-dark-bg/50">
                    <tr>
                      <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm">PLUGIN</th>
                      <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm hidden md:table-cell">FILENAME</th>
                      <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm hidden sm:table-cell">VER</th>
                      <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm">DL</th>
                      <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm hidden sm:table-cell">STATUS</th>
                      <th className="text-right px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downloads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 sm:py-8 text-center text-white/50 font-mono text-xs sm:text-sm">
                          No free downloads yet. Add your first one!
                        </td>
                      </tr>
                    ) : (
                      downloads.map(download => (
                        <tr key={download.id} className="border-t border-cyan-500/10 hover:bg-cyan-500/5">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Music className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-white font-medium text-xs sm:text-sm truncate">{download.name}</div>
                                <div className="text-white/40 text-[10px] sm:text-xs">{download.fileSize}</div>
                                <div className="text-cyan-400 text-[10px] sm:hidden">v{download.version}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white/70 font-mono text-xs sm:text-sm hidden md:table-cell">
                            <span className="truncate block max-w-[120px]">{download.filename}</span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-cyan-400 font-mono text-xs sm:text-sm hidden sm:table-cell">v{download.version}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Download className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                              <span className="text-white text-xs sm:text-sm">{download.downloadCount}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-mono ${
                              download.isActive
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {download.isActive ? 'ACTIVE' : 'OFF'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button
                                onClick={() => toggleDownloadActive(download)}
                                className={`p-1.5 sm:p-2 rounded transition-colors ${
                                  download.isActive
                                    ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                }`}
                                title={download.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {download.isActive ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
                              </button>
                              <button
                                onClick={() => startEditDownload(download)}
                                className="p-1.5 sm:p-2 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => deleteDownload(download.id, download.name)}
                                className="p-1.5 sm:p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info */}
            <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-4">
              <p className="text-white/50 text-xs sm:text-sm font-mono">
                <span className="text-cyan-400">NOTE:</span> After adding a download here, make sure to upload the actual file
                to <code className="bg-dark-bg px-1.5 sm:px-2 py-0.5 rounded text-cyan-400 text-[10px] sm:text-xs break-all">/home/wes/voidvendor-downloads/</code> on the server.
              </p>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-2xl font-bold text-cyan-400 font-mono">ALL_ORDERS</h2>
              <button
                onClick={fetchOrders}
                className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/20 transition-colors font-mono text-xs flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                REFRESH
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-8 text-center">
                <p className="text-white/50 font-mono">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-dark-card border border-cyan-500/20 rounded-lg overflow-hidden">
                    {/* Order Header */}
                    <div
                      className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-cyan-500/5"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="hidden sm:block">
                          {expandedOrder === order.id ? (
                            <ChevronUp className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-white/50" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-mono text-xs sm:text-sm">{order.orderNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono ${
                              order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                              order.status === 'shipped' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-white/50 text-[10px] sm:text-xs truncate">
                            {order.user?.name || 'Guest'} • {order.user?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-cyan-400 font-bold text-sm sm:text-lg">{formatCurrency(order.totalAmount)}</div>
                        <div className="text-white/40 text-[10px] sm:text-xs">{formatDate(order.createdAt)}</div>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {expandedOrder === order.id && (
                      <div className="border-t border-cyan-500/20 p-3 sm:p-4 bg-dark-bg/30">
                        {/* Items */}
                        <div className="mb-4">
                          <h4 className="text-cyan-400 font-mono text-xs mb-2">ITEMS:</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-dark-card rounded">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{item.productIcon}</span>
                                  <div>
                                    <span className="text-white text-xs sm:text-sm">{item.productName}</span>
                                    <span className="text-white/50 text-xs ml-2">x{item.quantity}</span>
                                  </div>
                                </div>
                                <span className="text-cyan-400 font-mono text-xs sm:text-sm">{formatCurrency(item.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Info */}
                        {order.shipping?.address && (
                          <div className="mb-4">
                            <h4 className="text-cyan-400 font-mono text-xs mb-2">SHIPPING:</h4>
                            <div className="text-white/70 text-xs sm:text-sm p-2 bg-dark-card rounded">
                              <div>{order.shipping.fullName}</div>
                              <div>{order.shipping.address}</div>
                              <div>{order.shipping.city}, {order.shipping.state} {order.shipping.zipCode}</div>
                              <div>{order.shipping.country}</div>
                            </div>
                          </div>
                        )}

                        {/* Status Update */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white/60 font-mono text-xs">UPDATE STATUS:</span>
                          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                            <button
                              key={status}
                              onClick={() => updateOrderStatus(order.id, status)}
                              className={`px-2 py-1 rounded text-[10px] sm:text-xs font-mono transition-colors ${
                                order.status === status
                                  ? 'bg-cyan-500 text-white'
                                  : 'bg-white/10 text-white/60 hover:bg-white/20'
                              }`}
                            >
                              {status.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Piracy Tab - Download Tracking */}
        {activeTab === 'piracy' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-2xl font-bold text-red-400 font-mono flex items-center gap-2">
                <Skull className="w-5 h-5 sm:w-6 sm:h-6" />
                PIRACY_TRACKER
              </h2>
              <button
                onClick={fetchDownloadLogs}
                className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded text-red-400 hover:bg-red-500/20 transition-colors font-mono text-xs flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                REFRESH
              </button>
            </div>

            {/* Download Counts by File */}
            <div className="bg-dark-card border border-red-500/20 rounded-lg p-3 sm:p-6">
              <h3 className="text-sm sm:text-lg font-bold text-red-400 mb-3 sm:mb-4 font-mono">DOWNLOAD_STATS</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {downloadCounts.map((item, idx) => (
                  <div key={idx} className="p-3 bg-dark-bg rounded-lg border border-red-500/10 relative">
                    {/* Badge for download type */}
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold ${
                      item.downloadType === 'free_vst'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {item.downloadType === 'free_vst' ? 'FREE' : 'PIRATE'}
                    </div>
                    <div className="text-white font-medium text-xs sm:text-sm truncate mb-1 pr-12">{item.productName}</div>
                    <div className="text-white/40 text-[10px] mb-2 truncate">{item.filename}</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-red-400" />
                          <span className="text-white font-bold">{item.totalDownloads}</span>
                          <span className="text-white/40 text-xs">total</span>
                        </div>
                        <div className="text-white/50 text-xs">
                          <span className="text-red-400">{item.guestDownloads}</span> pirates
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">Unique IPs:</span>
                        <span className="text-cyan-400 font-mono">{item.uniqueIPs}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">Pirate IPs:</span>
                        <span className="text-red-400 font-mono">{item.uniquePirateIPs}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Download Logs */}
            <div className="bg-dark-card border border-red-500/20 rounded-lg p-3 sm:p-6">
              <h3 className="text-sm sm:text-lg font-bold text-red-400 mb-3 sm:mb-4 font-mono">RECENT_DOWNLOADS</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-red-500/20">
                      <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs">TIME</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs">FILE</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs">TYPE</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs">USER</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs">IP</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs hidden lg:table-cell">BROWSER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downloadLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-white/50 font-mono text-sm">
                          No downloads tracked yet
                        </td>
                      </tr>
                    ) : (
                      downloadLogs.map(log => (
                        <tr key={log.id} className={`border-b border-white/5 hover:bg-red-500/5 ${log.isBot ? 'opacity-50' : ''}`}>
                          <td className="px-2 sm:px-4 py-2 text-white/60 font-mono text-[10px] sm:text-xs whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-2 sm:px-4 py-2">
                            <div className="text-white font-mono text-[10px] sm:text-xs truncate max-w-[150px]">
                              {log.productName}
                            </div>
                            <div className="text-white/30 text-[8px] sm:text-[10px] truncate max-w-[150px]">
                              {log.filename}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold ${
                              log.downloadType === 'free_vst'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {log.downloadType === 'free_vst' ? 'FREE' : 'PIRATE'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2">
                            {log.isGuest ? (
                              <span className="flex items-center gap-1 text-red-400 text-[10px] sm:text-xs">
                                <Skull className="w-3 h-3" />
                                {log.isBot ? 'BOT' : 'GUEST'}
                              </span>
                            ) : (
                              <span className="text-cyan-400 text-[10px] sm:text-xs truncate block max-w-[100px]">
                                {log.userName || log.userEmail}
                              </span>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 py-2 text-white/50 font-mono text-[10px] sm:text-xs">
                            <div className="truncate max-w-[120px]" title={log.fullIpAddress}>
                              {log.fullIpAddress}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 text-white/40 text-[10px] sm:text-xs hidden lg:table-cell">
                            {log.browser}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Traffic Tab */}
        {activeTab === 'traffic' && trafficStats && (
          <div className="space-y-4 sm:space-y-8">
            {/* Header with Refresh */}
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-2xl font-bold text-cyan-400 font-mono truncate">TRAFFIC_MONITOR</h2>
              <button
                onClick={fetchTrafficData}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 sm:gap-2 font-mono text-xs sm:text-sm flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">REFRESH</span>
              </button>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
              <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-2.5 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                  <span className="text-white/60 font-mono text-[9px] sm:text-xs">REQUESTS</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white">{trafficStats.totalRequests.toLocaleString()}</div>
              </div>

              <div className="bg-dark-card border border-purple-500/20 rounded-lg p-2.5 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  <span className="text-white/60 font-mono text-[9px] sm:text-xs">UNIQUE_IPs</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white">{trafficStats.uniqueVisitors.toLocaleString()}</div>
              </div>

              <div className="bg-dark-card border border-pink-500/20 rounded-lg p-2.5 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                  <span className="text-white/60 font-mono text-[9px] sm:text-xs">LAST_HR</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white">{trafficStats.requestsLastHour.toLocaleString()}</div>
              </div>

              <div className="bg-dark-card border border-green-500/20 rounded-lg p-2.5 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <span className="text-white/60 font-mono text-[9px] sm:text-xs">AVG_MS</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white">{trafficStats.avgResponseTime}ms</div>
              </div>

              <div className="bg-dark-card border border-orange-500/20 rounded-lg p-2.5 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <span className="text-white/60 font-mono text-[9px] sm:text-xs">ERRORS</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white">
                  {(trafficStats.statusCounts['4xx'] || 0) + (trafficStats.statusCounts['5xx'] || 0)}
                </div>
              </div>

              <div className="bg-dark-card border border-blue-500/20 rounded-lg p-2.5 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  <span className="text-white/60 font-mono text-[9px] sm:text-xs">TODAY</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white">{trafficStats.requestsToday.toLocaleString()}</div>
              </div>
            </div>

            {/* Request Trends Chart */}
            <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <h3 className="text-sm sm:text-lg font-bold text-cyan-400 font-mono">REQUEST_TRENDS</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTrendInterval('hourly')}
                    className={`px-2 sm:px-3 py-1 rounded font-mono text-[10px] sm:text-xs ${
                      trendInterval === 'hourly'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                    }`}
                  >
                    HOURLY
                  </button>
                  <button
                    onClick={() => setTrendInterval('daily')}
                    className={`px-2 sm:px-3 py-1 rounded font-mono text-[10px] sm:text-xs ${
                      trendInterval === 'daily'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                    }`}
                  >
                    DAILY
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200} className="sm:!h-[300px]">
                <LineChart data={trafficTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#ffffff60"
                    tick={{ fill: '#ffffff60', fontSize: 10 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return trendInterval === 'hourly'
                        ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis stroke="#ffffff60" tick={{ fill: '#ffffff60', fontSize: 10 }} width={30} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #22d3ee40', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#22d3ee' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="requestCount" stroke="#22d3ee" name="Requests" strokeWidth={2} />
                  <Line type="monotone" dataKey="avgResponseTime" stroke="#a855f7" name="Avg (ms)" strokeWidth={2} />
                  <Line type="monotone" dataKey="errorCount" stroke="#ef4444" name="Errors" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Analytics Grid */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Top Paths */}
              <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-6">
                <h3 className="text-sm sm:text-lg font-bold text-cyan-400 mb-3 sm:mb-4 font-mono">TOP_PATHS</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {trafficStats.topPaths.slice(0, 8).map((path, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 sm:p-2 bg-dark-bg rounded">
                      <span className="text-white/70 font-mono text-[10px] sm:text-sm truncate flex-1 mr-2">{path.path}</span>
                      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                        <span className={`text-[10px] sm:text-xs font-mono ${
                          path.avgResponseTime < 100 ? 'text-green-400' :
                          path.avgResponseTime < 500 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {path.avgResponseTime}ms
                        </span>
                        <span className="bg-cyan-500/20 px-1.5 sm:px-2 py-0.5 rounded text-cyan-400 text-[10px] sm:text-xs font-mono">
                          {path.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Method Distribution */}
              <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-6">
                <h3 className="text-sm sm:text-lg font-bold text-cyan-400 mb-3 sm:mb-4 font-mono">HTTP_METHODS</h3>
                <ResponsiveContainer width="100%" height={180} className="sm:!h-[250px]">
                  <PieChart>
                    <Pie
                      data={Object.entries(trafficStats.methodCounts).map(([method, count]) => ({ name: method, value: count }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      labelLine={{ stroke: '#ffffff40' }}
                    >
                      {Object.keys(trafficStats.methodCounts).map((method, index) => {
                        const colors: Record<string, string> = {
                          GET: '#22d3ee',
                          POST: '#22c55e',
                          PUT: '#fb923c',
                          DELETE: '#ef4444',
                          PATCH: '#a855f7'
                        };
                        return <Cell key={`cell-${index}`} fill={colors[method] || '#64748b'} />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #22d3ee40', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Codes */}
              <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-6">
                <h3 className="text-sm sm:text-lg font-bold text-cyan-400 mb-3 sm:mb-4 font-mono">STATUS_CODES</h3>
                <ResponsiveContainer width="100%" height={180} className="sm:!h-[250px]">
                  <BarChart data={Object.entries(trafficStats.statusCounts).map(([status, count]) => ({ status, count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="status" stroke="#ffffff60" tick={{ fill: '#ffffff60', fontSize: 10 }} />
                    <YAxis stroke="#ffffff60" tick={{ fill: '#ffffff60', fontSize: 10 }} width={30} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #22d3ee40', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#22d3ee">
                      {Object.keys(trafficStats.statusCounts).map((status, index) => {
                        const colors: Record<string, string> = {
                          '2xx': '#22c55e',
                          '3xx': '#3b82f6',
                          '4xx': '#fb923c',
                          '5xx': '#ef4444'
                        };
                        return <Cell key={`cell-${index}`} fill={colors[status] || '#64748b'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Auth vs Guest */}
              <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-6">
                <h3 className="text-sm sm:text-lg font-bold text-cyan-400 mb-3 sm:mb-4 font-mono">AUTH_vs_GUEST</h3>
                <ResponsiveContainer width="100%" height={180} className="sm:!h-[250px]">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Auth', value: trafficStats.authenticatedVsGuest.authenticated },
                        { name: 'Guest', value: trafficStats.authenticatedVsGuest.guest }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      labelLine={{ stroke: '#ffffff40' }}
                    >
                      <Cell fill="#22d3ee" />
                      <Cell fill="#a855f7" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #22d3ee40', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Request Logs Table */}
            <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-6">
              <h3 className="text-sm sm:text-lg font-bold text-cyan-400 mb-3 sm:mb-4 font-mono">RECENT_LOGS</h3>
              <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-cyan-500/20">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-cyan-400 font-mono text-[10px] sm:text-sm">TIME</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-cyan-400 font-mono text-[10px] sm:text-sm">METHOD</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-cyan-400 font-mono text-[10px] sm:text-sm">PATH</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-cyan-400 font-mono text-[10px] sm:text-sm">STATUS</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-cyan-400 font-mono text-[10px] sm:text-sm hidden sm:table-cell">MS</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-cyan-400 font-mono text-[10px] sm:text-sm hidden md:table-cell">IP</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-cyan-400 font-mono text-[10px] sm:text-sm hidden lg:table-cell">USER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficLogs.slice(0, 15).map((log) => {
                      const getMethodColor = (method: string) => {
                        const colors: Record<string, string> = {
                          GET: 'text-cyan-400 bg-cyan-500/10',
                          POST: 'text-green-400 bg-green-500/10',
                          PUT: 'text-orange-400 bg-orange-500/10',
                          DELETE: 'text-red-400 bg-red-500/10',
                          PATCH: 'text-purple-400 bg-purple-500/10'
                        };
                        return colors[method] || 'text-gray-400 bg-gray-500/10';
                      };

                      const getStatusColor = (status: number) => {
                        if (status < 300) return 'text-green-400 bg-green-500/10';
                        if (status < 400) return 'text-blue-400 bg-blue-500/10';
                        if (status < 500) return 'text-orange-400 bg-orange-500/10';
                        return 'text-red-400 bg-red-500/10';
                      };

                      const getPerformanceColor = (ms: number) => {
                        if (ms < 100) return 'text-green-400';
                        if (ms < 500) return 'text-yellow-400';
                        return 'text-red-400';
                      };

                      return (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white/60 font-mono text-[10px] sm:text-xs">
                            {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-mono ${getMethodColor(log.method)}`}>
                              {log.method.slice(0, 3)}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white/70 font-mono text-[10px] sm:text-xs max-w-[100px] sm:max-w-xs truncate">
                            {log.path}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-mono ${getStatusColor(log.statusCode)}`}>
                              {log.statusCode}
                            </span>
                          </td>
                          <td className={`px-2 sm:px-4 py-2 sm:py-3 font-mono text-[10px] sm:text-xs hidden sm:table-cell ${getPerformanceColor(log.responseTime)}`}>
                            {log.responseTime}ms
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white/50 font-mono text-[10px] sm:text-xs hidden md:table-cell">
                            <div className="truncate max-w-[120px]" title={log.ipAddress}>
                              {log.ipAddress}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white/60 font-mono text-[10px] sm:text-xs hidden lg:table-cell">
                            <div className="truncate max-w-[100px]" title={log.userName || 'Guest'}>
                              {log.userName || log.userId ? (log.userName || 'User') : 'Guest'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-2xl font-bold text-orange-400 font-mono flex items-center gap-2">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                VOID_TRAP
              </h2>
              <button
                onClick={fetchSecurityData}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/20 transition-all flex items-center gap-1.5 sm:gap-2 font-mono text-xs sm:text-sm flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">REFRESH</span>
              </button>
            </div>

            {/* Stats Cards */}
            {blacklistData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-dark-card border border-red-500/20 rounded-lg p-3 sm:p-4">
                  <div className="text-white/60 font-mono text-[9px] sm:text-xs mb-1">BANNED_IPs</div>
                  <div className="text-lg sm:text-2xl font-bold text-red-400">{blacklistData.totalBanned}</div>
                </div>
                <div className="bg-dark-card border border-orange-500/20 rounded-lg p-3 sm:p-4">
                  <div className="text-white/60 font-mono text-[9px] sm:text-xs mb-1">TRACKED_IPs</div>
                  <div className="text-lg sm:text-2xl font-bold text-orange-400">{blacklistData.trackedIPs}</div>
                </div>
                <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-4">
                  <div className="text-white/60 font-mono text-[9px] sm:text-xs mb-1">BAN_DURATION</div>
                  <div className="text-lg sm:text-2xl font-bold text-cyan-400 text-sm sm:text-lg">{blacklistData.banDuration}</div>
                </div>
                <div className="bg-dark-card border border-purple-500/20 rounded-lg p-3 sm:p-4">
                  <div className="text-white/60 font-mono text-[9px] sm:text-xs mb-1">RATE_LIMIT</div>
                  <div className="text-sm sm:text-lg font-bold text-purple-400">{blacklistData.rateLimit}</div>
                </div>
              </div>
            )}

            {/* Manual Ban */}
            <div className="bg-dark-card border border-orange-500/20 rounded-lg p-3 sm:p-6">
              <h3 className="text-sm sm:text-lg font-bold text-orange-400 mb-3 sm:mb-4 font-mono">MANUAL_BAN</h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="text"
                  value={banIpInput}
                  onChange={(e) => setBanIpInput(e.target.value)}
                  placeholder="IP address (e.g. 192.168.1.100)"
                  className="flex-1 px-3 sm:px-4 py-2 bg-dark-bg border border-orange-500/30 rounded text-white text-sm focus:border-orange-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="Reason (optional)"
                  className="flex-1 px-3 sm:px-4 py-2 bg-dark-bg border border-orange-500/30 rounded text-white text-sm focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleBanIp}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded text-red-400 hover:bg-red-500/30 transition-colors font-mono text-sm flex-shrink-0"
                >
                  BAN IP
                </button>
              </div>
            </div>

            {/* Active Bans */}
            <div className="bg-dark-card border border-red-500/20 rounded-lg p-3 sm:p-6">
              <h3 className="text-sm sm:text-lg font-bold text-red-400 mb-3 sm:mb-4 font-mono">ACTIVE_BANS</h3>
              {blacklistData && blacklistData.entries.length === 0 ? (
                <p className="text-white/50 font-mono text-xs sm:text-sm">No IPs currently banned</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-red-500/20">
                        <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs">IP</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs">REASON</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs">HITS</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-red-400 font-mono text-[10px] sm:text-xs hidden sm:table-cell">EXPIRES</th>
                        <th className="px-2 sm:px-4 py-2 text-right text-red-400 font-mono text-[10px] sm:text-xs">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blacklistData?.entries.map((entry: any, idx: number) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-red-500/5">
                          <td className="px-2 sm:px-4 py-2 text-white font-mono text-[10px] sm:text-xs">{entry.ip}</td>
                          <td className="px-2 sm:px-4 py-2 text-white/70 text-[10px] sm:text-xs truncate max-w-[150px]">{entry.reason}</td>
                          <td className="px-2 sm:px-4 py-2 text-orange-400 font-mono text-[10px] sm:text-xs">{entry.hits}</td>
                          <td className="px-2 sm:px-4 py-2 text-white/50 font-mono text-[10px] sm:text-xs hidden sm:table-cell">{entry.expiresIn}</td>
                          <td className="px-2 sm:px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleUnbanIp(entry.ip)}
                              className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded text-green-400 hover:bg-green-500/30 transition-colors font-mono text-[10px] sm:text-xs"
                            >
                              UNBAN
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Honeypot Trap Log */}
            <div className="bg-dark-card border border-orange-500/20 rounded-lg p-3 sm:p-6">
              <h3 className="text-sm sm:text-lg font-bold text-orange-400 mb-3 sm:mb-4 font-mono">HONEYPOT_TRAP_LOG</h3>
              {trappedRequests.length === 0 ? (
                <p className="text-white/50 font-mono text-xs sm:text-sm">No trapped requests yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-orange-500/20">
                        <th className="px-2 sm:px-4 py-2 text-left text-orange-400 font-mono text-[10px] sm:text-xs">TIME</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-orange-400 font-mono text-[10px] sm:text-xs">IP</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-orange-400 font-mono text-[10px] sm:text-xs">PATH</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-orange-400 font-mono text-[10px] sm:text-xs hidden md:table-cell">USER_AGENT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trappedRequests.slice(0, 50).map((req: any, idx: number) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-orange-500/5">
                          <td className="px-2 sm:px-4 py-2 text-white/60 font-mono text-[10px] sm:text-xs whitespace-nowrap">
                            {new Date(req.timestamp).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-2 sm:px-4 py-2 text-red-400 font-mono text-[10px] sm:text-xs">{req.ip_address}</td>
                          <td className="px-2 sm:px-4 py-2 text-white font-mono text-[10px] sm:text-xs truncate max-w-[200px]">{req.path}</td>
                          <td className="px-2 sm:px-4 py-2 text-white/40 text-[10px] sm:text-xs truncate max-w-[200px] hidden md:table-cell">{req.user_agent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-3 sm:p-4">
              <p className="text-white/50 text-xs sm:text-sm font-mono">
                <span className="text-cyan-400">VOID_TRAP:</span> Honeypot paths (/wp-login.php, /.env, /phpmyadmin, etc.)
                auto-ban scanners for 30 minutes. Rate limit: 50 requests per 10 seconds per IP.
                Banned IPs get tarpitted (connections held open to waste attacker resources).
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-dark-card border-t border-cyan-500/20 py-4 sm:py-6 mt-auto">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <p className="text-white/40 text-[10px] sm:text-xs font-mono">&lt; VOID_VENDOR :: ADMIN /&gt;</p>
        </div>
      </footer>
    </div>
  );
};
