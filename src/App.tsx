/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Printer, CheckCircle, Droplet, LayoutDashboard, Calculator, Hash, MapPin, User, FileText, Lock, LogOut, Users, UserPlus, Trash2, ArrowLeft } from 'lucide-react';
import logo1 from './assets/images/regenerated_image_1779944737343.png';
import logo2 from './assets/images/regenerated_image_1779944738798.png';

const FIXTURES = [
  { id: 'water_closet', label: 'Water Closet', cost: 7 },
  { id: 'lavatory', label: 'Lavatory', cost: 7 },
  { id: 'urinal', label: 'Urinal', cost: 4 },
  { id: 'shower_head', label: 'Shower Head', cost: 2 },
  { id: 'floor_drain', label: 'Floor Drain', cost: 3 },
  { id: 'faucet', label: 'Faucet', cost: 2 },
  { id: 'kitchen_sink', label: 'Kitchen Sink', cost: 3 },
  { id: 'slop_sink', label: 'Slop Sink', cost: 7 },
  { id: 'grease_trap', label: 'Grease Trap', cost: 7 },
  { id: 'laundry_sink', label: 'Laundry Sink', cost: 4 },
  { id: 'water_heater', label: 'Water Heater', cost: 4 },
  { id: 'water_meter', label: 'Water Meter', cost: 2 },
];

const TANKS = [
  { id: 'septic_tank', label: 'Septic Tank' },
  { id: 'cistern_tank', label: 'Cistern Tank' },
  { id: 'sewer_treatment_plant', label: 'Sewer Treatment Plant' },
];

const formatPeso = (amount: number) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

export const sanitizeNumber = (val: string) => {
  if (val === '' || val === '-') return '';
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

const sanitizeFloat = (val: string) => {
  if (val === '' || val === '-') return '';
  if (val.replace(/[^.]/g, '').length > 1) return val.slice(0, -1);
  const parsed = parseFloat(val);
  if (parsed < 0) return 0;
  return val;
};

const computeCubicMeterCost = (cubicMeters: number) => {
  if (!cubicMeters || cubicMeters <= 0) return 0;
  
  let total = 0;
  if (cubicMeters <= 5) {
      total = cubicMeters * 24;
  } else {
      total = (5 * 24) + ((cubicMeters - 5) * 7);
  }
  
  return Math.max(total, 304);
};

export default function App() {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('plumbing_users');
    if (saved) {
        const parsed = JSON.parse(saved);
        const adminIndex = parsed.findIndex((u: any) => u.username === 'admin' && u.password === 'admin123');
        if (adminIndex !== -1) {
            parsed[adminIndex].password = 'Welcome@01';
            localStorage.setItem('plumbing_users', JSON.stringify(parsed));
        }
        return parsed;
    }
    return [{ id: '1', username: 'admin', password: 'Welcome@01', role: 'superadmin' }];
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeView, setActiveView] = useState('computation');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });

  // MODIFICATION START: State and Logic for Printable View
  const [selectedReportToPrint, setSelectedReportToPrint] = useState<any>(null);

  const handlePrintReport = (report: any) => {
    setSelectedReportToPrint(report);
    setTimeout(() => {
        window.print();
        setTimeout(() => setSelectedReportToPrint(null), 100);
    }, 100);
  };
  // MODIFICATION END

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    localStorage.setItem('plumbing_users', JSON.stringify(users));
  }, [users]);

  const [details, setDetails] = useState({
    name: '',
    location: '',
    bpNumber: '',
    projectTitle: '',
  });

  const [fixtureQuants, setFixtureQuants] = useState<Record<string, string>>({});
  const [tankQuants, setTankQuants] = useState<Record<string, string>>({});

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFixtureChange = (id: string, val: string) => {
      const sanitized = sanitizeNumber(val);
      setFixtureQuants(prev => ({ ...prev, [id]: sanitized === '' ? '' : sanitized.toString() }));
  }

  const handleTankChange = (id: string, val: string) => {
      const sanitized = sanitizeFloat(val);
      setTankQuants(prev => ({ ...prev, [id]: sanitized === '' ? '' : sanitized.toString() }));
  }

  const fixtureTotal = useMemo(() => {
    return FIXTURES.reduce((acc, f) => {
        const qtyStr = fixtureQuants[f.id];
        const qty = parseInt(qtyStr || '0', 10) || 0;
        return acc + (qty * f.cost);
    }, 0);
  }, [fixtureQuants]);

  const tankTotal = useMemo(() => {
     return TANKS.reduce((acc, t) => {
         const qtyStr = tankQuants[t.id];
         const qty = parseFloat(qtyStr || '0') || 0;
         return acc + computeCubicMeterCost(qty);
     }, 0);
  }, [tankQuants]);

  const grandTotal = fixtureTotal + tankTotal;

  const handleSubmit = () => {
    if (!details.name || !details.location || !details.bpNumber) {
        alert('Please fill out the applicant name, location, and BP number before submitting.');
        return;
    }
    
    if (grandTotal === 0) {
        alert('Please add at least one fixture or tank to compute.');
        return;
    }

    const reportData = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        computedBy: currentUser?.username || 'Unknown',
        details,
        fixtureQuants,
        tankQuants,
        fixtureTotal,
        tankTotal,
        grandTotal
    };

    const existingReports = JSON.parse(localStorage.getItem('plumbing_reports') || '[]');
    existingReports.push(reportData);
    localStorage.setItem('plumbing_reports', JSON.stringify(existingReports));
    
    alert('Computation successfully saved to local records!');
    
    // reset form
    setDetails({ name: '', location: '', bpNumber: '', projectTitle: '' });
    setFixtureQuants({});
    setTankQuants({});
  };

  const handlePrint = () => {
    if (grandTotal === 0) {
        alert('Please add at least one fixture or tank to compute.');
        return;
    }
    
    // Use the inline printable architecture
    const reportData = {
        id: 'DRAFT-' + Date.now().toString().slice(-4),
        date: new Date().toISOString(),
        computedBy: currentUser?.username || 'Unknown',
        details,
        fixtureQuants,
        tankQuants,
        grandTotal
    };
    handlePrintReport(reportData);
  };

  const hasItems = fixtureTotal > 0 || tankTotal > 0;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
         <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden ring-1 ring-slate-200">
             <div className="bg-[#e95191] p-8 md:p-10 text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                     <Lock size={80} />
                 </div>
                 <div className="relative z-10 flex flex-col items-center">
                     <img src={logo1} alt="City of Pasay Logo" className="h-20 w-20 object-contain mb-4 drop-shadow-md" />
                     <h2 className="text-3xl font-bold text-white tracking-tight">Admin Login</h2>
                     <p className="text-pink-100 mt-2 text-sm font-medium">Access local management system</p>
                 </div>
             </div>
             <form onSubmit={(e) => {
                 e.preventDefault();
                 const user = users.find((u: any) => u.username === loginForm.username && u.password === loginForm.password);
                 if (user) {
                     setCurrentUser(user);
                     setActiveView('computation');
                     setLoginError('');
                 } else {
                     setLoginError('Invalid credentials.');
                 }
             }} className="p-8 space-y-6">
                 {loginError && (
                     <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm font-medium border border-red-100">{loginError}</div>
                 )}
                 <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                     <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                             <User size={18} />
                         </div>
                         <input type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter username" />
                     </div>
                 </div>
                 <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                     <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                             <Lock size={18} />
                         </div>
                         <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter password" />
                     </div>
                 </div>
                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-2">
                     <Lock size={18} /> Login
                 </button>
             </form>
         </div>
      </div>
    );
  }

  if (activeView === 'assessments') {
     // AUTHENTICATION START (RBAC)
     if (currentUser?.role !== 'superadmin') {
         return (
             <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
                 <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-sm w-full border border-red-200">
                     <Lock className="text-red-500 mx-auto mb-4" size={48} />
                     <h2 className="text-2xl font-bold text-slate-800 mb-2">Unauthorized Access</h2>
                     <p className="text-slate-600 mb-6">This section is strictly restricted to Super Admin users.</p>
                     <button onClick={() => setActiveView('computation')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 w-full transition-colors">Return to Dashboard</button>
                 </div>
             </div>
         );
     }
     // AUTHENTICATION END

     const reports = JSON.parse(localStorage.getItem('plumbing_reports') || '[]');

     return (
        <>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            @page { size: letter; margin: 15mm; }
            body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media screen {
            .print-only { display: none !important; }
          }
        `}</style>
        
        {/* The normal UI that gets hidden on print */}
        <div className="min-h-screen bg-slate-100 py-6 md:py-12 px-4 selection:bg-blue-200 no-print">
          <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-slate-200">
              <div className="bg-[#e95191] p-8 text-white relative overflow-hidden">
                 <button onClick={() => setActiveView('computation')} className="absolute top-6 left-6 text-pink-100 hover:text-white flex items-center gap-2 transition-colors font-medium">
                    <ArrowLeft size={18} /> Back to Dashboard
                 </button>
                 <div className="text-center mt-6">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Submitted Assessments</h1>
                    <p className="text-pink-100 text-sm">Super Admin Tracking Portal</p>
                 </div>
              </div>
              
              <div className="p-8">
                 <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                             <th className="py-4 px-5 font-semibold text-slate-600 text-sm uppercase tracking-wider text-xs">Project Name</th>
                             <th className="py-4 px-5 font-semibold text-slate-600 text-sm uppercase tracking-wider text-xs">Date Submitted</th>
                             <th className="py-4 px-5 font-semibold text-slate-600 text-sm uppercase tracking-wider text-xs border-l border-slate-200">Applicant Name</th>
                             <th className="py-4 px-5 font-semibold text-slate-600 text-sm uppercase tracking-wider text-xs text-right border-l border-slate-200">Total Amount</th>
                             <th className="py-4 px-5 font-semibold text-slate-600 text-sm uppercase tracking-wider text-xs text-center border-l border-slate-200">Status</th>
                             <th className="py-4 px-5 font-semibold text-slate-600 text-sm uppercase tracking-wider text-xs text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {reports.length === 0 ? (
                             <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500 italic font-medium">No assessments submitted yet.</td>
                             </tr>
                          ) : (
                             reports.map((report: any) => (
                                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                   <td className="py-4 px-5 font-bold text-slate-800 text-sm">{report.details.projectTitle || 'Untitled Project'}</td>
                                   <td className="py-4 px-5 text-sm font-medium text-slate-700">{new Date(report.date).toLocaleDateString()}</td>
                                   <td className="py-4 px-5 text-sm font-medium text-slate-700 border-l border-slate-100">{report.details.name || 'N/A'}</td>
                                   <td className="py-4 px-5 font-bold text-emerald-600 text-right text-lg border-l border-slate-100">{formatPeso(report.grandTotal)}</td>
                                   <td className="py-4 px-5 text-center border-l border-slate-100">
                                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                                         Submitted
                                      </span>
                                   </td>
                                   <td className="py-4 px-5 text-right">
                                      {/* MODIFICATION START (PRINT BUTTON) */}
                                      <button 
                                         onClick={() => handlePrintReport(report)}
                                         className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-semibold text-sm border border-blue-200 shadow-sm"
                                      >
                                         <Printer size={14} /> View Printable
                                      </button>
                                      {/* MODIFICATION END */}
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
          </div>
        </div>

        {/* MODIFICATION START: PRINTABLE ARCHITECTURE */}
        {selectedReportToPrint && (
           <div className="print-only fixed inset-0 z-[100] text-slate-900 p-8 font-sans bg-white overflow-hidden">
              <div className="max-w-4xl mx-auto">
                 <div className="flex border-b-[3px] border-slate-300 pb-6 mb-6 items-center gap-6">
                    <img src={logo1} alt="Pasay Logo" className="w-24 h-24 object-contain" />
                    <div>
                       <h1 className="text-3xl font-bold uppercase tracking-tight text-slate-900">Official Plumbing Assessment</h1>
                       <p className="text-slate-600 font-bold uppercase tracking-widest text-sm mt-1">City of Pasay</p>
                       <p className="text-slate-500 text-sm mt-1 font-mono">Assessment ID: {selectedReportToPrint.id}</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Applicant Name</p>
                       <p className="font-semibold text-lg text-slate-900">{selectedReportToPrint.details.name || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Project Title</p>
                       <p className="font-semibold text-lg text-slate-900">{selectedReportToPrint.details.projectTitle || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Location</p>
                       <p className="font-semibold text-lg text-slate-900">{selectedReportToPrint.details.location || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">BP Number</p>
                       <p className="font-semibold text-lg text-slate-900 font-mono">{selectedReportToPrint.details.bpNumber || 'N/A'}</p>
                    </div>
                 </div>

                 <table className="w-full text-left border-collapse mb-8 border border-slate-200">
                    <thead className="bg-slate-100">
                       <tr>
                          <th className="py-3 px-4 font-bold text-xs text-slate-700 uppercase tracking-widest border-b border-slate-300">Description</th>
                          <th className="py-3 px-4 font-bold text-xs text-slate-700 uppercase tracking-widest border-b border-slate-300 text-center">Qty</th>
                          <th className="py-3 px-4 font-bold text-xs text-slate-700 uppercase tracking-widest border-b border-slate-300 text-right">Cost/Basis</th>
                          <th className="py-3 px-4 font-bold text-xs text-slate-700 uppercase tracking-widest border-b border-slate-300 text-right">Subtotal</th>
                       </tr>
                    </thead>
                    <tbody>
                       {FIXTURES.map(f => {
                           const qtyStr = selectedReportToPrint.fixtureQuants[f.id];
                           const qty = parseInt(qtyStr || '0', 10) || 0;
                           if (qty > 0) {
                              const sub = qty * f.cost;
                              return (
                                 <tr key={f.id}>
                                    <td className="py-2.5 px-4 border-b border-slate-200 text-sm font-medium text-slate-800">{f.label}</td>
                                    <td className="py-2.5 px-4 border-b border-slate-200 text-sm text-center font-medium text-slate-800">{qty}</td>
                                    <td className="py-2.5 px-4 border-b border-slate-200 text-sm text-right text-slate-600">{formatPeso(f.cost)}</td>
                                    <td className="py-2.5 px-4 border-b border-slate-200 text-sm text-right font-bold text-slate-800">{formatPeso(sub)}</td>
                                 </tr>
                              );
                           }
                           return null;
                       })}
                       {TANKS.map(t => {
                           const qtyStr = selectedReportToPrint.tankQuants[t.id];
                           const qty = parseFloat(qtyStr || '0') || 0;
                           if (qty > 0) {
                              const sub = computeCubicMeterCost(qty);
                              return (
                                 <tr key={t.id}>
                                    <td className="py-2.5 px-4 border-b border-slate-200 text-sm font-medium text-slate-800">{t.label} (Tank)</td>
                                    <td className="py-2.5 px-4 border-b border-slate-200 text-sm text-center font-medium text-slate-800">{qty} m³</td>
                                    <td className="py-2.5 px-4 border-b border-slate-200 text-sm text-right italic text-slate-500">Formula Base</td>
                                    <td className="py-2.5 px-4 border-b border-slate-200 text-sm text-right font-bold text-slate-800">{formatPeso(sub)}</td>
                                 </tr>
                              );
                           }
                           return null;
                       })}
                       <tr className="bg-slate-100">
                           <td colSpan={3} className="py-4 px-4 text-right font-bold uppercase tracking-widest text-slate-700 border-t-[3px] border-slate-300">Grand Total</td>
                           <td className="py-4 px-4 text-right font-bold text-slate-900 border-t-[3px] border-slate-300 text-lg">{formatPeso(selectedReportToPrint.grandTotal)}</td>
                       </tr>
                    </tbody>
                 </table>

                 <div className="mt-16 pt-8">
                    <div className="grid grid-cols-2 gap-16">
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-12">Computed By</p>
                          <div className="border-b-[2px] border-slate-900 w-64 mb-3"></div>
                          <p className="font-bold text-slate-900 text-lg">{selectedReportToPrint.computedBy}</p>
                          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Authorized Assessor</p>
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-12">Approved By</p>
                          <div className="border-b-[2px] border-slate-900 w-64 mb-3"></div>
                          <p className="font-bold text-slate-900 text-lg">&nbsp;</p>
                          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">City Engineering Office</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
        {/* MODIFICATION END */}
        </>
     );
  }

  if (activeView === 'accounts' && currentUser?.role === 'superadmin') {
     return (
       <div className="min-h-screen bg-slate-100 py-6 md:py-12 px-4 selection:bg-blue-200">
         <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-slate-200">
             <div className="bg-[#e95191] p-8 text-white relative overflow-hidden">
                <button onClick={() => setActiveView('computation')} className="absolute top-6 left-6 text-pink-100 hover:text-white flex items-center gap-2 transition-colors font-medium">
                   <ArrowLeft size={18} /> Back to App
                </button>
                <div className="text-center mt-6">
                   <h1 className="text-3xl font-bold tracking-tight mb-2">Account Management</h1>
                   <p className="text-pink-100 text-sm">Super Admin Dashboard</p>
                </div>
             </div>
             
             <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form to add user */}
                <div className="col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit shadow-sm">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><UserPlus size={18} className="text-blue-500" /> Add New User</h3>
                   <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!newUser.username || !newUser.password) return;
                      if (users.find((u:any) => u.username === newUser.username)) {
                         alert('Username already exists');
                         return;
                      }
                      setUsers([...users, { ...newUser, id: Date.now().toString() }]);
                      setNewUser({ username: '', password: '', role: 'user' });
                      alert('Account successfully saved.');
                   }} className="space-y-4">
                      <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Username</label>
                         <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 font-medium" placeholder="Ex: johndoe" required />
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
                         <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 font-medium" placeholder="••••••" required />
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Role</label>
                         <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium cursor-pointer">
                            <option value="user">Assessment User</option>
                            <option value="superadmin">Super Admin</option>
                         </select>
                      </div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-3 rounded-xl font-bold transition-all mt-4 flex items-center justify-center gap-2">
                          <UserPlus size={16} /> Create User
                      </button>
                   </form>
                </div>

                {/* List of users */}
                <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200">
                         <tr>
                            <th className="py-4 px-5 font-semibold text-slate-600 text-sm uppercase tracking-wider text-xs">Username</th>
                            <th className="py-4 px-5 font-semibold text-slate-600 text-sm uppercase tracking-wider text-xs">Role</th>
                            <th className="py-4 px-5 font-semibold text-slate-600 text-sm uppercase tracking-wider text-xs text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {users.map((u: any) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                               <td className="py-4 px-5 font-bold text-slate-800">{u.username}</td>
                               <td className="py-4 px-5">
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-200' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'}`}>
                                     {u.role === 'superadmin' ? 'Super Admin' : 'User'}
                                  </span>
                               </td>
                               <td className="py-4 px-5 text-right flex justify-end">
                                  <button 
                                     onClick={() => {
                                        if (u.role === 'superadmin' && users.filter((us:any) => us.role === 'superadmin').length === 1) {
                                           alert('Cannot delete the last super admin.');
                                           return;
                                        }
                                        if (u.id === currentUser.id) {
                                           alert('Cannot delete yourself while logged in.');
                                           return;
                                        }
                                        if (window.confirm('Are you sure you want to delete this user?')) {
                                           setUsers(users.filter((us:any) => us.id !== u.id));
                                           alert('User profile has been updated and saved.');
                                        }
                                     }}
                                     className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-lg"
                                     title="Delete User"
                                  >
                                     <Trash2 size={18} />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
         </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 md:py-12 px-4 selection:bg-pink-200">
      <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-slate-200">
        
        {/* Header Section */}
        <div className="bg-[#e95191] p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-6 right-6 flex gap-3 z-20">
             {currentUser?.role === 'superadmin' && (
                <>
                   <button 
                      onClick={() => setActiveView('assessments')}
                      className="bg-[#d8407f] hover:bg-[#c3336d] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-[#d8407f]"
                   >
                      <FileText size={16} /> Reports
                   </button>
                   <button 
                      onClick={() => setActiveView('accounts')}
                      className="bg-[#d8407f] hover:bg-[#c3336d] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-[#d8407f]"
                   >
                      <Users size={16} /> Accounts
                   </button>
                </>
             )}
             <button 
                onClick={() => {
                   setCurrentUser(null);
                   setLoginForm({ username: '', password: '' });
                }}
                className="bg-black/20 hover:bg-black/30 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-black/10"
             >
                <LogOut size={16} /> Logout
             </button>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <Droplet size={120} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
             <img src={logo2} alt="City of Pasay Logo" className="h-28 w-28 object-contain mb-5 drop-shadow-xl" />
             <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Plumbing Computation</h1>
             <p className="text-pink-100 mt-3 text-lg font-medium">Professional computation and assessment system</p>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-12">
          
          {/* Top Input Section */}
          <section>
             <div className="flex items-center gap-2 mb-6">
                <LayoutDashboard className="text-blue-500" />
                <h2 className="text-2xl font-bold text-slate-800">Project Details</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {[
                 { id: 'name', label: 'Name', icon: <User size={18} className="text-slate-400" /> },
                 { id: 'location', label: 'Location', icon: <MapPin size={18} className="text-slate-400" /> },
                 { id: 'bpNumber', label: 'BP Number', icon: <Hash size={18} className="text-slate-400" /> },
                 { id: 'projectTitle', label: 'Project Title', icon: <FileText size={18} className="text-slate-400" /> },
               ].map((field) => (
                 <div key={field.id} className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                      {field.icon}
                   </div>
                   <input 
                     type="text" 
                     name={field.id} 
                     value={details[field.id as keyof typeof details]} 
                     onChange={handleDetailChange}
                     placeholder={field.label}
                     className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                   />
                 </div>
               ))}
             </div>
          </section>

          {/* Table Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Fixtures Table */}
              <section>
                 <div className="flex items-center gap-2 mb-6">
                    <Droplet className="text-blue-500" />
                    <h2 className="text-2xl font-bold text-slate-800">Fixtures</h2>
                 </div>
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                           <th className="py-4 px-5 font-semibold">Fixture</th>
                           <th className="py-4 px-5 font-semibold text-right">Cost</th>
                           <th className="py-4 px-5 font-semibold text-center w-28">Qty</th>
                           <th className="py-4 px-5 font-semibold text-right">Subtotal</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {FIXTURES.map(f => {
                            const qtyStr = fixtureQuants[f.id] || '';
                            const qty = parseInt(qtyStr, 10) || 0;
                            const subtotal = qty * f.cost;
                            return (
                               <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                                 <td className="py-3 px-5 font-medium text-slate-800">{f.label}</td>
                                 <td className="py-3 px-5 text-right text-slate-500">{formatPeso(f.cost)}</td>
                                 <td className="py-3 px-5">
                                     <input 
                                       type="text" 
                                       inputMode="numeric"
                                       placeholder="0"
                                       value={qtyStr}
                                       onChange={e => handleFixtureChange(f.id, e.target.value)}
                                       className="w-full text-center px-2 py-1.5 border border-transparent bg-slate-100 rounded-lg group-hover:bg-white group-hover:border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800"
                                     />
                                 </td>
                                 <td className="py-3 px-5 text-right font-semibold text-slate-700">{qty > 0 ? formatPeso(subtotal) : '-'}</td>
                               </tr>
                            )
                         })}
                       </tbody>
                    </table>
                 </div>
              </section>

              {/* Tanks Table */}
              <section>
                 <div className="flex items-center gap-2 mb-6">
                    <Calculator className="text-blue-500" />
                    <h2 className="text-2xl font-bold text-slate-800">Tanks</h2>
                 </div>
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                           <th className="py-4 px-5 font-semibold">Tank Type</th>
                           <th className="py-4 px-5 font-semibold text-right">Basis</th>
                           <th className="py-4 px-5 font-semibold text-center w-32">Qty (m³)</th>
                           <th className="py-4 px-5 font-semibold text-right">Subtotal</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {TANKS.map(t => {
                            const qtyStr = tankQuants[t.id] || '';
                            const qty = parseFloat(qtyStr) || 0;
                            const subtotal = computeCubicMeterCost(qty);
                            return (
                               <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                 <td className="py-4 px-5 font-medium text-slate-800">{t.label}</td>
                                 <td className="py-4 px-5 text-right text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total m³</td>
                                 <td className="py-4 px-5">
                                     <input 
                                       type="text" 
                                       inputMode="decimal"
                                       placeholder="0"
                                       value={qtyStr}
                                       onChange={e => handleTankChange(t.id, e.target.value)}
                                       className="w-full text-center px-2 py-1.5 border border-transparent bg-slate-100 rounded-lg group-hover:bg-white group-hover:border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800"
                                     />
                                 </td>
                                 <td className="py-4 px-5 text-right font-semibold text-slate-700">{qty > 0 ? formatPeso(subtotal) : '-'}</td>
                               </tr>
                            )
                         })}
                       </tbody>
                    </table>
                 </div>
                 
                 {/* Computation Rules Helper */}
                 <div className="mt-4 p-5 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-blue-800 flex gap-4">
                    <div className="mt-1"><Droplet size={20} className="text-blue-500" /></div>
                    <div>
                       <p className="font-bold text-blue-900 mb-1">Cubic Meter Formula</p>
                       <ul className="list-disc list-inside space-y-1 text-blue-800 font-medium opacity-90 marker:text-blue-400">
                          <li>First 5 m³ @ ₱24.00 / m³</li>
                          <li>Succeeding m³ @ ₱7.00 / m³</li>
                          <li>Minimum flat charge = ₱304.00</li>
                       </ul>
                    </div>
                 </div>
              </section>
          </div>
        </div>

        {/* Summary Footer Area */}
        <div className="bg-slate-50 p-6 md:p-10 border-t border-slate-200">
           <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Project Summary Card */}
              <div className="flex-1 bg-white rounded-3xl p-7 shadow-lg shadow-slate-200/50 border-t-8 border-t-blue-500 relative flex flex-col">
                 <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileText className="text-blue-500" /> Project Summary
                 </h3>
                 
                 <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-x-4 gap-y-4 text-sm mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs self-center">Name</span>
                    <span className="text-slate-900 font-bold text-base truncate">{details.name || '—'}</span>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs self-center">Location</span>
                    <span className="text-slate-900 font-bold text-base truncate">{details.location || '—'}</span>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs self-center">BP No.</span>
                    <span className="text-slate-900 font-bold text-base truncate">{details.bpNumber || '—'}</span>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs self-center">Title</span>
                    <span className="text-slate-900 font-bold text-base truncate">{details.projectTitle || '—'}</span>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs self-center">Assessor</span>
                    <span className="text-slate-900 font-bold text-base truncate">{currentUser?.username || '—'}</span>
                 </div>
                 
                 <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Item Breakdown</h4>
                 <div className="space-y-2 text-sm overflow-y-auto pr-2 flex-1 min-h-[120px]">
                    {FIXTURES.map(f => {
                        const qty = parseInt(fixtureQuants[f.id] || '0', 10) || 0;
                        if (qty > 0) {
                           return (
                              <div key={f.id} className="flex justify-between items-center bg-slate-50/50 px-3 py-2 rounded-lg border border-slate-100">
                                 <span className="text-slate-700 font-medium">{f.label} <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs ml-1 font-bold">x{qty}</span></span>
                                 <span className="text-slate-900 font-bold">{formatPeso(qty * f.cost)}</span>
                              </div>
                           );
                        }
                        return null;
                    })}
                    {TANKS.map(t => {
                        const qty = parseFloat(tankQuants[t.id] || '0') || 0;
                        if (qty > 0) {
                           return (
                              <div key={t.id} className="flex justify-between items-center bg-slate-50/50 px-3 py-2 rounded-lg border border-slate-100">
                                 <span className="text-slate-700 font-medium">{t.label} <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs ml-1 font-bold">{qty}m³</span></span>
                                 <span className="text-slate-900 font-bold">{formatPeso(computeCubicMeterCost(qty))}</span>
                              </div>
                           );
                        }
                        return null;
                    })}
                    {!hasItems && (
                        <div className="h-full flex items-center justify-center text-slate-400 italic text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                           No computation items added yet.
                        </div>
                    )}
                 </div>
              </div>

              {/* Total Plumbing Cost Card */}
              <div className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 shadow-2xl shadow-emerald-500/30 flex flex-col justify-between text-white relative overflow-hidden">
                 <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
                    <CheckCircle size={240} />
                 </div>
                 
                 <div className="relative z-10 mb-10">
                    <div className="inline-flex items-center gap-2 bg-emerald-800/40 px-4 py-2 rounded-full mb-6 filter backdrop-blur-sm shadow-inner overflow-hidden">
                       <Calculator size={18} className="text-emerald-200 relative z-10" />
                       <span className="text-emerald-100 font-semibold tracking-wide text-sm uppercase relative z-10">Total Plumbing Cost</span>
                    </div>
                    <p className="text-5xl lg:text-6xl font-extrabold tracking-tighter drop-shadow-sm">{formatPeso(grandTotal)}</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                    <button onClick={handleSubmit} className="flex-1 bg-[#e95191] hover:bg-[#d8407f] text-white px-6 py-4 rounded-2xl font-extrabold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group ring-2 ring-transparent">
                       <CheckCircle size={22} className="group-hover:scale-110 transition-transform" /> 
                       Submit
                    </button>
                    <button onClick={handlePrint} className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-4 rounded-2xl font-extrabold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group ring-2 ring-transparent">
                       <Printer size={22} className="group-hover:scale-110 transition-transform" /> 
                       Print
                    </button>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}
