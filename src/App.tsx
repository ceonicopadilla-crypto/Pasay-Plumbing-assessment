import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PlumbingComputation from './components/PlumbingComputation';
import ReportHistory from './components/ReportHistory';
import { initAuth, logout } from './lib/auth';
import { User } from 'firebase/auth';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'compute' | 'history' | 'admin'>('compute');

  useEffect(() => {
    const unsubscribe = initAuth(
      async (u, token) => {
        setUser(u);
      try {
        const userDoc = await getDocFromServer(doc(db, 'users', u.uid));
        if (userDoc.exists()) setRole(userDoc.data().role);
      } catch (e: any) {
        if (!e.message?.includes('offline')) {
          console.error('Failed to get user role in App.tsx:', e);
        }
        setRole('user'); // fallback
      }
        setLoading(false);
      },
      () => {
        setUser(null);
        setRole('');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = (u: User, userRole: string) => {
    setUser(u);
    setRole(userRole);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRole('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex min-h-screen p-4">
        <div className="font-bold text-xl tracking-tight mb-10 px-2 py-4 border-b border-slate-800">
          Plumbing<br/><span className="text-blue-400">Compute Pro</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('compute')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'compute' ? 'bg-blue-600 font-semibold' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            New Computation
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'history' ? 'bg-blue-600 font-semibold' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            My History
          </button>
          
          {(role === 'admin' || role === 'super_admin') && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'admin' ? 'bg-blue-600 font-semibold' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              Admin Dashboard
            </button>
          )}
        </nav>

        <div className="pt-4 border-t border-slate-800 mt-auto">
          <div className="mb-4 px-2 text-sm text-slate-400">
            <p className="truncate font-medium text-slate-200">{user.displayName || user.email}</p>
            <p className="uppercase text-xs mt-1 font-bold text-blue-400">{role}</p>
          </div>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-colors font-medium">
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto p-4 md:p-8 overflow-auto h-screen">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h1 className="text-xl font-bold">Plumbing Compute Pro</h1>
          <button onClick={handleLogout} className="text-sm font-semibold text-red-500">Sign out</button>
        </div>
        
        {/* Mobile Navigation */}
        <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('compute')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'compute' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>Compute</button>
          <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>History</button>
          {(role === 'admin' || role === 'super_admin') && (
            <button onClick={() => setActiveTab('admin')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'admin' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>Admin</button>
          )}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'compute' && <PlumbingComputation user={user} role={role} />}
          {activeTab === 'history' && <ReportHistory userId={user.uid} />}
          {activeTab === 'admin' && <AdminDashboard userRole={role} />}
        </div>
      </main>
    </div>
  );
}
