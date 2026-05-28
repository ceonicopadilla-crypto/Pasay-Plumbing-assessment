import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getOrCreateFolder, uploadPdf } from '../lib/drive';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

const FIXTURES = [
  { id: 'water_closet', name: 'Water Closet', cost: 7 },
  { id: 'lavatory', name: 'Lavatory', cost: 7 },
  { id: 'urinal', name: 'Urinal', cost: 4 },
  { id: 'shower_head', name: 'Shower Head', cost: 2 },
  { id: 'floor_drain', name: 'Floor Drain', cost: 3 },
  { id: 'faucet', name: 'Faucet', cost: 2 },
  { id: 'kitchen_sink', name: 'Kitchen Sink', cost: 3 },
  { id: 'slop_sink', name: 'Slop Sink', cost: 7 },
  { id: 'grease_trap', name: 'Grease Trap', cost: 7 },
  { id: 'laundry_sink', name: 'Laundry Sink', cost: 4 },
  { id: 'water_heater', name: 'Water Heater', cost: 4 },
  { id: 'water_meter', name: 'Water Meter', cost: 2 },
];

const TANKS = [
  { id: 'septic_tank', name: 'Septic Tank' },
  { id: 'cistern_tank', name: 'Cistern Tank' },
  { id: 'sewer_treatment', name: 'Sewer Treatment Plant' },
];

export default function PlumbingComputation({ user, role }: { user: User; role: string }) {
  const [projectDetails, setProjectDetails] = useState({ name: '', location: '', bpNumber: '', projectTitle: '' });
  const [fixtureQuantities, setFixtureQuantities] = useState<Record<string, number>>({});
  const [tankVolumes, setTankVolumes] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sanitizeNumber = (val: string) => {
    const num = parseInt(val, 10);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  const computeCubicMeterCost = (cubicMeters: number) => {
    if (!cubicMeters || cubicMeters <= 0) return 0;
    const first5 = Math.min(cubicMeters, 5);
    const remaining = Math.max(0, cubicMeters - 5);
    const computedTotal = first5 * 24 + remaining * 7;
    return Math.max(computedTotal, 304);
  };

  const fixtureTotal = useMemo(() => FIXTURES.reduce((acc, fix) => acc + (fixtureQuantities[fix.id] || 0) * fix.cost, 0), [fixtureQuantities]);
  const tankTotal = useMemo(() => TANKS.reduce((acc, tank) => acc + computeCubicMeterCost(tankVolumes[tank.id] || 0), 0), [tankVolumes]);
  const grandTotal = fixtureTotal + tankTotal;

  const generatePDFBlob = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Plumbing Computation Report', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Project Title: ${projectDetails.projectTitle}`, 14, 30);
    doc.text(`BP Number: ${projectDetails.bpNumber}`, 14, 35);
    doc.text(`Location: ${projectDetails.location}`, 14, 40);
    doc.text(`Name: ${projectDetails.name}`, 14, 45);
    doc.text(`Prepared By: ${user.displayName || user.email}`, 14, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 55);

    const tableData: any[] = [];
    
    FIXTURES.forEach(f => {
      const q = fixtureQuantities[f.id] || 0;
      if (q > 0) tableData.push([f.name, q, `Php ${f.cost.toFixed(2)}`, `Php ${(q * f.cost).toFixed(2)}`]);
    });

    TANKS.forEach(t => {
      const v = tankVolumes[t.id] || 0;
      if (v > 0) tableData.push([t.name, `${v} m3`, 'Total Cubic Meter', `Php ${computeCubicMeterCost(v).toFixed(2)}`]);
    });

    autoTable(doc, {
      startY: 65,
      head: [['Item', 'Quantity/Vol', 'Basis Cost', 'Subtotal']],
      body: tableData,
      foot: [['', '', 'Grand Total', `Php ${grandTotal.toFixed(2)}`]],
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80] },
      footStyles: { fillColor: [240, 253, 244], textColor: [22, 101, 52] }
    });

    return doc.output('blob');
  };

  const handleDriveUpload = async () => {
    setIsSubmitting(true);
    try {
      // 1. Ensure Drive Token is available
      const token = await import('../lib/auth').then(m => m.getAccessToken());
      if (!token) {
        await import('../lib/auth').then(m => m.connectGoogleDrive());
      }
      
      // 2. Generate PDF
      const pdfBlob = generatePDFBlob();
      
      // 3. Folder Structure: Plumbing_Computation_Reports / Year / Month / Project_Name
      const rootFolderId = await getOrCreateFolder('Plumbing_Computation_Reports');
      const yearFolderId = await getOrCreateFolder(new Date().getFullYear().toString(), rootFolderId);
      const monthStr = new Date().toLocaleString('default', { month: 'long' });
      const monthFolderId = await getOrCreateFolder(monthStr, yearFolderId);
      
      const projectName = projectDetails.projectTitle || 'Untitled_Project';
      const projectFolderId = await getOrCreateFolder(projectName, monthFolderId);

      // 4. Upload File
      const dateStr = new Date().toLocaleDateString().replace(/\//g, '');
      const fileName = `${projectName}_${projectDetails.bpNumber}_${dateStr}.pdf`;
      
      const uploadRes = await uploadPdf(pdfBlob, fileName, projectFolderId);
      
      // 5. Save to Firestore
      await addDoc(collection(db, 'reports'), {
        projectTitle: projectDetails.projectTitle,
        bpNumber: projectDetails.bpNumber,
        preparedBy: user.displayName || user.email,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        googleDriveFileId: uploadRes.id,
        googleDriveLink: uploadRes.webViewLink,
        totalCost: grandTotal
      });

      alert('Successfully uploaded to Google Drive and saved to Firestore!');
      
      // Basic reset
      setProjectDetails({ name: '', location: '', bpNumber: '', projectTitle: '' });
      setFixtureQuantities({});
      setTankVolumes({});
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 outline outline-1 outline-slate-200 rounded-2xl shadow-sm space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">New Computation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['name', 'location', 'bpNumber', 'projectTitle'].map(field => (
          <div key={field}>
            <label className="block text-sm font-semibold text-slate-600 mb-2 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-xl"
              value={(projectDetails as any)[field]}
              onChange={(e) => setProjectDetails({ ...projectDetails, [field]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-700">Fixtures</h3>
        {FIXTURES.map(f => (
          <div key={f.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="w-1/3">{f.name}</span>
            <span className="w-1/3 text-slate-500">Php {f.cost}</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              className="w-24 px-3 py-1 border rounded-lg"
              value={fixtureQuantities[f.id] || ''}
              onChange={(e) => setFixtureQuantities({ ...fixtureQuantities, [f.id]: sanitizeNumber(e.target.value) })}
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-700">Tanks & Treatment (Cubic Meters)</h3>
        {TANKS.map(t => (
          <div key={t.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="w-1/3">{t.name}</span>
            <input
              type="number"
              min="0"
              placeholder="0 m3"
              className="w-32 px-3 py-1 border rounded-lg"
              value={tankVolumes[t.id] || ''}
              onChange={(e) => setTankVolumes({ ...tankVolumes, [t.id]: sanitizeNumber(e.target.value) })}
            />
          </div>
        ))}
      </div>

      <div className="bg-green-600 text-white p-6 rounded-2xl flex justify-between items-center">
        <span className="text-xl font-bold">Grand Total</span>
        <span className="text-4xl font-black">Php {grandTotal.toFixed(2)}</span>
      </div>

      <button
        onClick={handleDriveUpload}
        disabled={isSubmitting || grandTotal === 0}
        className="w-full py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Uploading to Google Drive...' : 'Submit Computation & Save to Drive'}
      </button>
    </div>
  );
}
