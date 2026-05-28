import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { createNewUser } from '../lib/auth';

export default function AdminDashboard({ userRole }: { userRole: string }) {
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reports'));
      const snapshot = await getDocs(q);
      setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      
      if (userRole === 'super_admin') {
        const uq = query(collection(db, 'users'));
        const usnap = await getDocs(uq);
        setUsers(usnap.docs.map(u => ({ id: u.id, ...u.data() })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (userRole !== 'super_admin') {
      alert('Only Super Admin can delete reports.');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to delete this report? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'reports', id));
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete report. Ensure you are a Super Admin.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      await createNewUser(newEmail, newPassword, newRole);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      alert('User created successfully!');
      fetchData(); // Refresh users
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to remove this user from the system access list?');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500 uppercase">Total Reports</p>
          <p className="text-3xl font-bold text-slate-800">{reports.length}</p>
        </div>
        {userRole === 'super_admin' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-sm font-semibold text-slate-500 uppercase">Total Users</p>
            <p className="text-3xl font-bold text-slate-800">{users.length}</p>
          </div>
        )}
      </div>

      {userRole === 'super_admin' && (
        <div className="flex gap-4 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setActiveTab('reports')} 
            className={`pb-2 px-2 font-semibold ${activeTab === 'reports' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          >
            Manage Reports
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`pb-2 px-2 font-semibold ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          >
            Manage Users
          </button>
        </div>
      )}
      
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600">Project Title</th>
                  <th className="p-4 font-semibold text-slate-600">BP Number</th>
                  <th className="p-4 font-semibold text-slate-600">Prepared By</th>
                  <th className="p-4 font-semibold text-slate-600">Date</th>
                  <th className="p-4 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium">{r.projectTitle}</td>
                    <td className="p-4 text-slate-600">{r.bpNumber}</td>
                    <td className="p-4 text-slate-600">{r.preparedBy}</td>
                    <td className="p-4 text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {r.googleDriveLink && (
                          <a href={r.googleDriveLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                            View PDF
                          </a>
                        )}
                        {userRole === 'super_admin' && (
                          <button onClick={() => handleDeleteReport(r.id)} className="text-red-600 hover:underline text-sm font-medium ml-4">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No reports found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && userRole === 'super_admin' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Add New User</h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Email</label>
                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Password</label>
                <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-4 py-2 border rounded-xl bg-white">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <button disabled={isCreatingUser} type="submit" className="w-full bg-blue-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 h-[42px]">
                {isCreatingUser ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-semibold text-slate-600">Email</th>
                    <th className="p-4 font-semibold text-slate-600">Name</th>
                    <th className="p-4 font-semibold text-slate-600">Role</th>
                    <th className="p-4 font-semibold text-slate-600">Created</th>
                    <th className="p-4 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium">{u.email}</td>
                      <td className="p-4 text-slate-600">{u.displayName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:underline text-sm font-medium">Remove Access</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
