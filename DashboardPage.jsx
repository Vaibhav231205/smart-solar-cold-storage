import { useMemo } from 'react';
import { Activity, ShieldCheck, Snowflake, Target } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import TemperatureCard from '../components/dashboard/TemperatureCard';
import HumidityCard from '../components/dashboard/HumidityCard';
import BatteryCard from '../components/dashboard/BatteryCard';
import CoolingStatusCard from '../components/dashboard/CoolingStatusCard';
import TargetTemperatureControl from '../components/dashboard/TargetTemperatureControl';
import ProduceInfoCard from '../components/dashboard/ProduceInfoCard';
import TemperatureHumidityChart from '../components/charts/TemperatureHumidityChart';
import BatteryHistoryChart from '../components/charts/BatteryHistoryChart';
import AlertBanner from '../components/alerts/AlertBanner';
import AlertHistoryList from '../components/alerts/AlertHistoryList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { LeafSprig } from '../components/common/LeafDecorations';
import { useLatestReading } from '../hooks/useLatestReading';
import { useReadingHistory } from '../hooks/useReadingHistory';
import { useAlerts } from '../hooks/useAlerts';
import { useTargetTemperature } from '../hooks/useTargetTemperature';
import { useCoolingMode } from '../hooks/useCoolingMode';
import { useProduceInfo } from '../hooks/useProduceInfo';
import { deriveLiveAlerts, mergeAlerts } from '../utils/alerts';
import { isApiEnabled } from '../api/config';

function HeroStat({ icon: Icon, label, value, tone }) {
  return (
    <div className="fade-rise rounded-[1.35rem] bg-white/10 px-4 py-4 ring-1 ring-white/10 backdrop-blur-sm">
      <div className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] ${tone}`}>
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-cream">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const {
    reading,
    isOnline,
    loading: readingLoading,
    lastUpdated,
    previousPowerSource,
    wasOnline,
  } = useLatestReading();
  const {
    history,
    loading: historyLoading,
  } = useReadingHistory();
  const {
    alerts: backendAlerts,
    loading: alertsLoading,
  } = useAlerts();
  const {
    targetC,
    loading: targetLoading,
    saving: targetSaving,
    updateTarget,
  } = useTargetTemperature();
  const {
    produce,
    loading: produceLoading,
    saving: produceSaving,
    save: saveProduce,
  } = useProduceInfo();

  const liveCoolingState = reading?.coolingOn ?? null;
  const {
    override: coolingOverride,
    effectiveCoolingOn,
    saving: coolingSaving,
    forceOn,
    forceOff,
    clearOverride,
  } = useCoolingMode(liveCoolingState);

  const resolvedTarget = targetC ?? reading?.targetC ?? null;

  const liveAlerts = useMemo(
    () =>
      isApiEnabled
        ? deriveLiveAlerts({
            reading,
            isOnline,
            targetC: resolvedTarget,
            previousPowerSource,
            wasOnline,
          })
        : [],
    [reading, isOnline, resolvedTarget, previousPowerSource, wasOnline],
  );

  const alerts = useMemo(
    () => mergeAlerts(backendAlerts, liveAlerts),
    [backendAlerts, liveAlerts],
  );

  const activeAlerts = alerts.filter((alert) => !alert.resolved);
  const activeAlertCount = activeAlerts.length;

  const handleTargetChange = async (value) => {
    try {
      await updateTarget(value);
    } catch {
      // The hook already surfaces the error in the UI.
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(220,235,209,0.95),transparent_56%),radial-gradient(circle_at_78%_18%,rgba(251,235,209,0.82),transparent_30%)]" />
      <div className="pointer-events-none absolute left-[-5rem] top-56 h-44 w-44 rounded-full bg-leaf-100/70 blur-3xl float-slow" />
      <div className="pointer-events-none absolute right-[-4rem] top-72 h-56 w-56 rounded-full bg-sky-100/65 blur-3xl float-slow" style={{ animationDelay: '1.5s' }} />

      <Navbar
        isOnline={isOnline}
        apiEnabled={isApiEnabled}
        activeAlerts={activeAlertCount}
        lastUpdated={lastUpdated}
      />

      <main className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <section className="fade-rise rounded-[2rem] bg-leaf-900 px-5 py-6 text-cream shadow-[0_30px_70px_-42px_rgba(36,50,31,0.96)] sm:px-8 sm:py-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-cream/80 ring-1 ring-white/10">
                <ShieldCheck size={14} />
                Harvest watch
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.8rem]">
                Smart solar-powered cold storage
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-cream/75 sm:text-base">
                Live readings, quick target changes, and a cleaner control surface that
                works better on phones and larger screens.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <HeroStat
                icon={Activity}
                label="ESP32"
                value={isApiEnabled ? (isOnline ? 'Online' : 'Offline') : 'Standby'}
                tone={isApiEnabled ? (isOnline ? 'text-leaf-100' : 'text-clay-100') : 'text-cream/80'}
              />
              <HeroStat
                icon={Target}
                label="Target"
                value={resolvedTarget != null ? `${resolvedTarget} C` : targetLoading ? 'Loading' : 'Unset'}
                tone="text-gold-100"
              />
              <HeroStat
                icon={Snowflake}
                label="Cooling"
                value={effectiveCoolingOn ? 'ON' : 'OFF'}
                tone="text-sky-100"
              />
              <HeroStat
                icon={ShieldCheck}
                label="Alerts"
                value={`${activeAlertCount}`}
                tone="text-clay-100"
              />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="stagger-1 fade-rise">
            <TemperatureCard
              tempC={reading?.tempC}
              targetC={resolvedTarget}
              isOnline={isOnline}
              apiEnabled={isApiEnabled}
              lastSignalAt={lastUpdated}
              activeAlertCount={activeAlertCount}
              coolingOn={effectiveCoolingOn}
              loading={readingLoading && !reading}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <div className="stagger-2 fade-rise">
              <TargetTemperatureControl
                targetC={resolvedTarget}
                onChange={handleTargetChange}
                isLoading={targetLoading}
                isSaving={targetSaving}
              />
            </div>

            <div className="stagger-3 fade-rise">
              <CoolingStatusCard
                coolingOn={liveCoolingState}
                overrideMode={coolingOverride}
                isSaving={coolingSaving}
                onOverrideChange={(value) => (value ? forceOn() : forceOff())}
                onClearOverride={clearOverride}
              />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="stagger-1 fade-rise">
            <HumidityCard humidity={reading?.humidity} />
          </div>
          <div className="stagger-2 fade-rise">
            <BatteryCard
              battery={reading?.battery}
              batteryVoltage={reading?.batteryVoltage}
              powerSource={reading?.powerSource}
              current={reading?.current}
              power={reading?.power}
            />
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <div className="stagger-1 fade-rise">
            <TemperatureHumidityChart history={history} loading={historyLoading} />
          </div>
          <div className="stagger-2 fade-rise">
            <BatteryHistoryChart history={history} loading={historyLoading} />
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="fade-rise rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-45px_rgba(36,50,31,0.7)] ring-1 ring-white/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold text-bark-900">Active alerts</p>
                <p className="mt-1 text-sm text-bark-900/50">
                  High temperature, humidity, battery, power and connection warnings
                </p>
              </div>
              <div className="rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-400">
                {activeAlertCount}
              </div>
            </div>

            <div className="vine-divider my-4" />

            {alertsLoading && !activeAlertCount ? (
              <LoadingSpinner label="Checking current alerts..." />
            ) : activeAlertCount ? (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <AlertBanner key={alert.id ?? `${alert.type}-${alert.timestamp}`} alert={alert} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-[1.5rem] bg-leaf-50/70 py-10 text-center text-bark-900/40 ring-1 ring-leaf-100">
                <LeafSprig className="h-10 w-16 text-leaf-300" />
                <p className="text-sm">Everything looks calm right now.</p>
              </div>
            )}
          </div>

          <div className="stagger-3 fade-rise">
            <AlertHistoryList alerts={alerts} loading={alertsLoading} />
          </div>
        </section>

        <section className="mt-5">
          <ProduceInfoCard
            produce={produce}
            onSave={saveProduce}
            isLoading={produceLoading}
            isSaving={produceSaving}
          />
        </section>

        <footer className="mt-8 flex flex-col items-center gap-2 py-6 text-center text-xs text-bark-900/45">
          <LeafSprig className="h-6 w-10 text-leaf-300" />
          <p>Harvest Guard — SIH 2K26 Smart Solar-Powered IoT Mini Cold Storage</p>
        </footer>
      </main>
    </div>
  );
}
