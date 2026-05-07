import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  BellRing,
  Bug,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Power,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { usePushNotifications } from '../hooks/usePushNotifications';
import type { NotificationPreferences } from '../services/notificationService';

type BooleanPreferenceKey =
  | 'enabled'
  | 'irrigation_alerts'
  | 'disease_alerts'
  | 'drought_alerts'
  | 'flood_alerts'
  | 'resource_alerts'
  | 'system_alerts';

const preferenceToggles: Array<{ key: BooleanPreferenceKey; label: string; description: string }> = [
  { key: 'enabled', label: 'Master alerts', description: 'All push notifications' },
  { key: 'irrigation_alerts', label: 'Irrigation', description: 'Water and soil moisture' },
  { key: 'disease_alerts', label: 'Disease', description: 'Crop health warnings' },
  { key: 'drought_alerts', label: 'Drought', description: 'Heat and dryness risk' },
  { key: 'flood_alerts', label: 'Flood', description: 'Heavy rain and waterlogging' },
  { key: 'resource_alerts', label: 'Resources', description: 'Input and efficiency tips' },
  { key: 'system_alerts', label: 'System', description: 'Sensor and device status' },
];

const severityOptions = ['info', 'low', 'medium', 'high', 'critical'];

function StatusPill({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
      ok
        ? 'border-green-500/30 bg-green-500/10 text-green-300'
        : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
    }`}>
      {ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
      {text}
    </span>
  );
}

function ToggleRow({
  checked,
  label,
  description,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-4 border-b border-white/10 py-3 text-left last:border-b-0 disabled:opacity-50"
    >
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="block text-xs text-gray-400">{description}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
        checked ? 'border-green-500 bg-green-500/40' : 'border-white/15 bg-white/10'
      }`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </span>
    </button>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const push = usePushNotifications();
  const isStandalone = useMemo(
    () => window.matchMedia('(display-mode: standalone)').matches,
    [],
  );

  const activeDevices = push.status?.subscriptions.length ?? 0;
  const permissionOk = push.permission === 'granted';
  const readyForPush = push.support.supported && permissionOk && push.subscribed && activeDevices > 0;

  const updatePreference = (key: BooleanPreferenceKey) => {
    if (!push.preferences) return;
    void push.savePreferences({
      [key]: !push.preferences[key],
    } as Partial<NotificationPreferences>);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-[#07120b] to-black pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col pb-32">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-black/75 px-5 pb-4 pt-10 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Notifications</h1>
            <p className="text-xs text-gray-400">Push alerts and delivery health</p>
          </div>
          <button
            type="button"
            onClick={() => void push.refresh()}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white"
            aria-label="Refresh"
          >
            <RefreshCw size={17} className={push.loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-5 px-5 pt-5">
          <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/15 text-green-300">
                  {readyForPush ? <BellRing size={22} /> : <Bell size={22} />}
                </span>
                <div>
                  <h2 className="text-base font-semibold">Browser push</h2>
                  <p className="text-xs text-gray-400">
                    {readyForPush ? 'Active on this device' : `Permission: ${push.permission}`}
                  </p>
                </div>
              </div>
              <StatusPill ok={readyForPush} text={readyForPush ? 'Ready' : 'Needs setup'} />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <StatusPill ok={push.support.serviceWorker} text="Service worker" />
              <StatusPill ok={push.support.pushManager} text="PushManager" />
              <StatusPill ok={push.support.secureContext} text="Secure origin" />
              <StatusPill ok={isStandalone || push.support.supported} text={isStandalone ? 'Installed' : 'Browser'} />
            </div>

            {push.error && (
              <div className="mb-4 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                <XCircle size={17} className="mt-0.5 shrink-0" />
                <span>{push.error}</span>
              </div>
            )}

            {push.renewalRequired && (
              <div className="mb-4 flex gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <span>Subscription renewal is required on this browser.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void push.enable()}
                disabled={push.busy || !push.support.supported || push.permission === 'denied'}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {push.busy ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                Enable
              </button>
              <button
                type="button"
                onClick={() => void push.disable()}
                disabled={push.busy || !push.subscribed}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Disable
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-300" />
              <h2 className="text-base font-semibold">Alert preferences</h2>
            </div>
            {push.preferences ? (
              <div>
                {preferenceToggles.map((item) => (
                  <ToggleRow
                    key={item.key}
                    checked={Boolean(push.preferences?.[item.key])}
                    label={item.label}
                    description={item.description}
                    disabled={push.busy}
                    onChange={() => updatePreference(item.key)}
                  />
                ))}
                <label className="mt-4 block text-xs font-medium text-gray-400" htmlFor="min-severity">
                  Minimum severity
                </label>
                <select
                  id="min-severity"
                  value={push.preferences.min_severity}
                  disabled={push.busy}
                  onChange={(event) => void push.savePreferences({ min_severity: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#101510] px-4 py-3 text-sm text-white outline-none focus:border-green-500/50"
                >
                  {severityOptions.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                Loading preferences
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bug size={18} className="text-green-300" />
              <h2 className="text-base font-semibold">Delivery diagnostics</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">VAPID</span>
                <span className={push.diagnostics?.vapid_configured ? 'text-green-300' : 'text-yellow-200'}>
                  {push.diagnostics?.vapid_configured ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Active devices</span>
                <span>{push.diagnostics?.active_subscription_count ?? activeDevices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last delivery</span>
                <span className="capitalize">{push.diagnostics?.last_delivery_status ?? 'None'}</span>
              </div>
              {push.diagnostics?.last_delivery_error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-100">
                  {push.diagnostics.last_delivery_error}
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void push.sendLocalTest()}
                disabled={push.busy || !permissionOk}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Smartphone size={16} />
                Local test
              </button>
              <button
                type="button"
                onClick={() => void push.sendBackendTest()}
                disabled={push.busy || !readyForPush}
                className="flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/15 px-3 py-3 text-sm font-semibold text-green-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                Server test
              </button>
            </div>
          </section>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
