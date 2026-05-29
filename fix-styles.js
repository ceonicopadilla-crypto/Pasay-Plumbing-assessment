const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStyle1 = `             body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; margin: 0; padding: 20mm; background: white; }
             @page { size: auto; margin: 0mm; }
             .header { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; text-align: left; }
             h1 { margin: 0; color: #0f172a; font-size: 28px; letter-spacing: -0.025em; }
             .subtitle { color: #64748b; margin-top: 4px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
             .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; background: #f8fafc; padding: 20px; border-radius: 12px; }
             .detail-item { font-size: 14px; }
             .detail-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 12px; margin-bottom: 4px; }
             .detail-value { color: #0f172a; font-weight: 500; font-size: 16px; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
             th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; }
             th { background-color: #f1f5f9; color: #475569; font-weight: 600; }
             .text-right { text-align: right; }
             .text-center { text-align: center; }
             .font-semibold { font-weight: 600; }
             .italic { font-style: italic; }
             .bg-slate-50 { background-color: #f8fafc; }
             .total-row td { font-weight: bold; font-size: 18px; color: #0f172a; background-color: #f1f5f9; border-top: 2px solid #cbd5e1; }`;

const replacementStyle1 = `             body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; margin: 0; padding: 10mm; background: white; }
             @page { size: auto; margin: 0mm; }
             .header { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; text-align: left; }
             h1 { margin: 0; color: #0f172a; font-size: 20px; letter-spacing: -0.025em; }
             .subtitle { color: #64748b; margin-top: 2px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
             .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 8px; }
             .detail-item { font-size: 12px; }
             .detail-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; margin-bottom: 2px; }
             .detail-value { color: #0f172a; font-weight: 500; font-size: 13px; }
             table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
             th, td { border-bottom: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; }
             th { background-color: #f1f5f9; color: #475569; font-weight: 600; }
             .text-right { text-align: right; }
             .text-center { text-align: center; }
             .font-semibold { font-weight: 600; }
             .italic { font-style: italic; }
             .bg-slate-50 { background-color: #f8fafc; }
             .total-row td { font-weight: bold; font-size: 14px; color: #0f172a; background-color: #f1f5f9; border-top: 2px solid #cbd5e1; }`;

const updatedContent = content.split(targetStyle1).join(replacementStyle1);
const finalContent = updatedContent.replace(/margin-top: 60px/g, 'margin-top: 20px');

fs.writeFileSync('src/App.tsx', finalContent);
