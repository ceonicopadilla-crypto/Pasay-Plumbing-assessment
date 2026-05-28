import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';

export default function ReportHistory({ userId }: { userId: string }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, 'reports'), where('userId', '==', userId));
        const res = await getDocs(q);
        setReports(res.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  if (loading) return <div>Loading history...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h3 className="text-xl font-bold text-slate-800">My Uploaded Reports</h3>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 text-slate-600 text-sm">
            <th className="p-4">Project Title</th>
            <th className="p-4">Date</th>
            <th className="p-4">Total Cost</th>
            <th className="p-4">Drive Link</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id} className="border-b border-slate-100">
              <td className="p-4 font-medium">{r.projectTitle || 'N/A'}</td>
              <td className="p-4 text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</td>
              <td className="p-4 text-slate-600">Php {r.totalCost?.toFixed(2)}</td>
              <td className="p-4">
                <a href={r.googleDriveLink} target="_blank" rel="noreferrer" className="text-blue-500 font-medium hover:underline">
                  View PDF
                </a>
              </td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-slate-500">No reports found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
