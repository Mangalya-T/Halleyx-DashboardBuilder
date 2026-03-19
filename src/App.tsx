import React from 'react';
import { useStore } from './store/useStore';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayoutDashboard, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Builder = React.lazy(() => import('./pages/Builder'));
const Orders = React.lazy(() => import('./pages/Orders'));

import { Toaster } from 'react-hot-toast';

export default function App() {
  const { setUser, fetchOrders, loadDashboard, login, signup, user, activeTab, setActiveTab } = useStore();
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [isAuthLoading, setIsAuthLoading] = React.useState(false);

  React.useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('halleyx-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('halleyx-user');
      }
    }
    setIsAuthReady(true);
    useStore.setState({ isLoading: false });
  }, []);

  React.useEffect(() => {
    if (user) {
      loadDashboard();
      fetchOrders();
    }
  }, [user]);

  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [role, setRole] = React.useState('admin');
  const [isSignup, setIsSignup] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState('');

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-100' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;

    const levels = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-emerald-500' },
      { label: 'Strong', color: 'bg-blue-500' }
    ];

    return { 
      score, 
      label: levels[Math.max(0, score - 1)].label, 
      color: levels[Math.max(0, score - 1)].color 
    };
  };

  const validatePassword = (pass: string) => {
    return getPasswordStrength(pass).score === 5;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthLoading(true);

    try {
      if (isSignup) {
        if (!validatePassword(password)) {
          setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
          setIsAuthLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsAuthLoading(false);
          return;
        }

        await signup({
          email,
          password,
          name: name || email.split('@')[0],
          role
        });
      } else {
        await login({ email, password });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Initializing Halleyx...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-blue-100 p-10 border border-slate-100"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200 rotate-3">
              <LayoutDashboard className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              {isSignup ? 'Create Account' : 'Welcome to Halleyx'}
            </h1>
            <p className="text-slate-500 text-sm">
              {isSignup ? 'Join our platform today' : 'Sign in to your account to continue'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignup && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 focus:bg-white transition-all font-medium text-sm"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@halleyx.com"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 focus:bg-white transition-all font-medium text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 focus:bg-white transition-all font-medium text-sm pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {isSignup && password.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strength</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getPasswordStrength(password).color.replace('bg-', 'text-')}`}>
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 px-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          getPasswordStrength(password).score >= i 
                            ? getPasswordStrength(password).color + ' shadow-[0_0_8px_rgba(0,0,0,0.1)]' 
                            : 'bg-slate-100'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isSignup && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative group">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 focus:bg-white transition-all font-medium text-sm pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                    role === 'admin' 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  Administrator
                </button>
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                    role === 'user' 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  Standard User
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className={`w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center space-x-3 shadow-lg mt-4 ${isAuthLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isAuthLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{isSignup ? 'Create Account' : 'Sign In to Dashboard'}</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-xs text-slate-400">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span 
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                }}
                className="text-blue-600 font-bold cursor-pointer hover:underline"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNav />
          <main className="flex-1 p-8 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }>
                {activeTab === 'dashboard' && (
                  <motion.div 
                    key="dashboard" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full"
                  >
                    <Dashboard />
                  </motion.div>
                )}
                {activeTab === 'builder' && (
                  <motion.div 
                    key="builder" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full"
                  >
                    <Builder />
                  </motion.div>
                )}
                {activeTab === 'orders' && (
                  <motion.div 
                    key="orders" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full"
                  >
                    <Orders />
                  </motion.div>
                )}
              </React.Suspense>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
