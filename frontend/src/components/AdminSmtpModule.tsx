import { useState, useEffect } from 'react';
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  Trash2, 
  Server, 
  ShieldCheck, 
  Inbox, 
  Loader2,
  Lock,
  Globe,
  Radio
} from 'lucide-react';

interface AdminSmtpModuleProps {
  token: string;
  triggerToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface SmtpStatus {
  ok: boolean;
  configured: boolean;
  host?: string;
  port?: number;
  user?: string;
  secure?: boolean;
  fromAddress?: string;
  error?: string;
}

interface EmailLog {
  id: string;
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  request_id?: string;
  status: string;
  messageId?: string;
  error?: string;
  created_at: string;
}

export default function AdminSmtpModule({ token, triggerToast }: AdminSmtpModuleProps) {
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Fetch SMTP status and email dispatch logs
  const fetchSmtpData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logs/email', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setSmtpStatus(data.smtpStatus || null);
      } else {
        throw new Error(data.message || 'Failed to fetch email logs');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error loading SMTP diagnostics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmtpData();
  }, [token]);

  // Send test email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      triggerToast('Please enter a recipient email address.', 'error');
      return;
    }

    setTesting(true);
    try {
      const res = await fetch('/api/admin/logs/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ to: recipientEmail.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        triggerToast(`Test email successfully dispatched to ${recipientEmail}!`, 'success');
        setRecipientEmail('');
        fetchSmtpData();
      } else {
        throw new Error(data.message || 'Failed to send test email');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to send test email.', 'error');
    } finally {
      setTesting(false);
    }
  };

  // Clear email logs
  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all stored email logs?')) return;
    
    setClearing(true);
    try {
      const res = await fetch('/api/admin/logs/email', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        triggerToast('Email dispatch logs cleared successfully.', 'success');
        setLogs([]);
        setSelectedLog(null);
      } else {
        throw new Error(data.message || 'Failed to clear email logs');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error clearing logs.', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div id="admin_smtp_container" className="bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-[28px] shadow-2xl p-6 space-y-6 text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/15 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="bg-blue-500/20 border border-blue-400/30 text-blue-300 p-2 rounded-2xl">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight drop-shadow-sm">
              SMTP Connection & Email Diagnostics
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Monitor live Nodemailer SMTP health, test outbound email dispatches, and inspect dispatch logs.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          <button
            id="btn_refresh_smtp"
            onClick={fetchSmtpData}
            disabled={loading}
            className="flex items-center space-x-1.5 py-2.5 px-3.5 border border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition cursor-pointer backdrop-blur-md active:scale-95"
            title="Re-verify SMTP Connection"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Check Connection</span>
          </button>
        </div>
      </div>

      {/* Connection Diagnostics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Status Card */}
        <div className="bg-slate-950/60 border border-white/15 rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-blue-400 animate-pulse" /> Connection Status
            </span>
            <span className="text-[10px] font-mono text-slate-500">Live Check</span>
          </div>

          {smtpStatus?.ok ? (
            <div className="flex items-center space-x-3 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-emerald-300">SMTP Active & Verified</h4>
                <p className="text-[10px] text-emerald-200/80">Ready to dispatch outbound emails</p>
              </div>
            </div>
          ) : smtpStatus?.configured ? (
            <div className="flex items-center space-x-3 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
              <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-rose-300">Connection Error</h4>
                <p className="text-[10px] text-rose-200/80 line-clamp-1" title={smtpStatus.error}>
                  {smtpStatus.error || 'SMTP auth or port failure'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-amber-300">Virtual Outbox Fallback Mode</h4>
                <p className="text-[10px] text-amber-200/80">SMTP unconfigured — emails saved to DB outbox</p>
              </div>
            </div>
          )}

          {smtpStatus?.error && smtpStatus.configured && (
            <div className="text-[11px] text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20 font-mono">
              <strong>Error:</strong> {smtpStatus.error}
            </div>
          )}
        </div>

        {/* Server Config Card */}
        <div className="bg-slate-950/60 border border-white/15 rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="h-3 w-3 text-indigo-400" /> Host Configuration
            </span>
            <span className="text-[10px] font-mono text-slate-500">.env Sync</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
              <span className="text-slate-400 flex items-center gap-1"><Globe className="h-3 w-3" /> Host:</span>
              <span className="font-mono font-bold text-white">{smtpStatus?.host || 'sandbox.smtp.mailtrap.io'}</span>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
              <span className="text-slate-400 flex items-center gap-1"><Lock className="h-3 w-3" /> Port & Security:</span>
              <span className="font-mono font-bold text-white">
                {smtpStatus?.port || 2525} ({smtpStatus?.secure ? 'SSL 465' : 'STARTTLS / Plain'})
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Auth User:</span>
              <span className="font-mono font-bold text-blue-300">{smtpStatus?.user || '(not set)'}</span>
            </div>
          </div>
        </div>

        {/* Test Email Dispatch Card */}
        <div className="bg-slate-950/60 border border-white/15 rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Send className="h-3 w-3 text-emerald-400" /> Test Connection Dispatcher
          </span>

          <form onSubmit={handleSendTestEmail} className="space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                Recipient Email:
              </label>
              <input
                type="email"
                id="smtp_test_recipient"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full bg-slate-900 border border-white/20 rounded-xl text-xs py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              type="submit"
              id="btn_send_test_email"
              disabled={testing || !recipientEmail.trim()}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer active:scale-95"
            >
              {testing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Dispatching Test Mail...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Email Dispatch History Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Inbox className="h-4 w-4 text-blue-400" /> Outbound Dispatch Logs ({logs.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Live audit trail of all emails sent via Nodemailer SMTP or logged to Virtual Outbox.
            </p>
          </div>

          {logs.length > 0 && (
            <button
              id="btn_clear_email_logs"
              onClick={handleClearLogs}
              disabled={clearing}
              className="flex items-center space-x-1.5 py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 text-xs font-bold rounded-xl transition cursor-pointer active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Logs</span>
            </button>
          )}
        </div>

        <div className="border border-white/15 rounded-2xl overflow-hidden bg-slate-950/60 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-white/15 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Message ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No email dispatch logs recorded yet. Send a test email to verify logging.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      className={`hover:bg-white/5 transition cursor-pointer ${selectedLog?.id === log.id ? 'bg-blue-500/10' : ''}`}
                    >
                      <td className="py-3 px-4 font-semibold text-white">{log.to}</td>
                      <td className="py-3 px-4 text-slate-200 max-w-[240px] truncate" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          log.status.includes('Delivered')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-400">
                        {log.messageId || log.id}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
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
  );
}
