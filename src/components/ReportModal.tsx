import React, { useState } from 'react';
import { ReportReason } from '../types';
import { submitReport } from '../services/channelService';
import { X, Flag, AlertTriangle, Check, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'product' | 'channel';
  targetId: string;
  targetTitle: string;
  reporterId?: string;
  reporterEmail?: string;
}

const REPORT_REASONS: ReportReason[] = [
  'Spam',
  'Misleading information',
  'Copyright/IP concern',
  'Fraud / Scam',
  'Other'
];

export const ReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  reporterId,
  reporterEmail,
}) => {
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setError('Please provide a brief explanation of the issue.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await submitReport({
        reporterId,
        reporterEmail,
        targetType,
        targetId,
        targetTitle,
        reason,
        details: details.trim(),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 text-left">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Report {targetType === 'product' ? 'Product' : 'Channel'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Report Submitted</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Thank you for keeping Deal Sphere safe. Our moderation team will review this report shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
              <span className="text-slate-400 block text-[11px]">Reporting:</span>
              <strong className="text-slate-900 block truncate">{targetTitle}</strong>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Details & Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Please describe why this content violates community guidelines..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                required
              />
              <div className="text-right text-[10px] text-slate-400">{details.length}/500</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-full shadow-sm shadow-rose-100 transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
