import os from 'os';
import { monitorEventLoopDelay } from 'perf_hooks';
import { getNotificationConnectionCount } from './notificationWebSocket';
import { getChatConnectionCount } from './chatWebSocket';

/**
 * Event-loop delay histogram: how late timers fire, i.e. how backed up the
 * event loop is. This is the single best "is Node keeping up with the load"
 * signal — better than raw CPU%. Enabled once at startup; we reset it after
 * every read so each poll reflects a fresh window since the last one.
 */
const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();

/**
 * CPU usage has no instantaneous value — it must be measured as a delta between
 * two samples — so we remember the previous CPU + wall-clock sample.
 */
let lastCpu = process.cpuUsage();
let lastHr = process.hrtime();

const toMB = (bytes: number): number => Math.round((bytes / 1024 / 1024) * 10) / 10;
const nsToMs = (ns: number): number => (Number.isFinite(ns) ? Math.round((ns / 1e6) * 10) / 10 : 0);

export interface SystemMetrics {
  uptimeSeconds: number;
  memory: { rssMB: number; heapUsedMB: number; heapTotalMB: number; externalMB: number };
  cpu: { processPercent: number; cores: number };
  /** Event-loop delay in ms — the higher, the more the server is struggling. */
  eventLoopLagMs: { mean: number; p99: number; max: number };
  ws: { notifications: number; chat: number; total: number };
  generatedAt: string;
}

/**
 * Point-in-time snapshot of backend load. Read by the admin dashboard so the
 * team can see whether the app is getting too heavy for the number of users
 * currently online. No DB access — all in-process counters.
 */
export const getSystemMetrics = (): SystemMetrics => {
  const mem = process.memoryUsage();

  // CPU% consumed by this process since the previous call, relative to one
  // core (can exceed 100 on multi-core when genuinely busy across cores).
  const cpuDelta = process.cpuUsage(lastCpu); // micros of user+system since lastCpu
  const hr = process.hrtime(lastHr); // [seconds, nanoseconds] since lastHr
  const elapsedMicros = hr[0] * 1e6 + hr[1] / 1e3;
  lastCpu = process.cpuUsage();
  lastHr = process.hrtime();
  const cpuPercent =
    elapsedMicros > 0
      ? Math.round(((cpuDelta.user + cpuDelta.system) / elapsedMicros) * 1000) / 10
      : 0;

  const eventLoopLagMs = {
    mean: nsToMs(loopDelay.mean),
    p99: nsToMs(loopDelay.percentile(99)),
    max: nsToMs(loopDelay.max),
  };
  loopDelay.reset();

  const notifications = getNotificationConnectionCount();
  const chat = getChatConnectionCount();

  return {
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rssMB: toMB(mem.rss),
      heapUsedMB: toMB(mem.heapUsed),
      heapTotalMB: toMB(mem.heapTotal),
      externalMB: toMB(mem.external),
    },
    cpu: { processPercent: cpuPercent, cores: os.cpus().length },
    eventLoopLagMs,
    ws: { notifications, chat, total: notifications + chat },
    generatedAt: new Date().toISOString(),
  };
};
