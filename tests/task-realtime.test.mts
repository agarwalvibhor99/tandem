import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';
import { subscribeToTasks } from '../lib/tasks/realtime.ts';
import type { Database } from '../types/database.ts';

type Frame = [string | null, string | null, string, string, Record<string, unknown>];
/** In-memory WebSocket transport; the real Supabase/Phoenix client handles the protocol. */
class TestSocket extends EventTarget {
  static sockets: TestSocket[] = [];
  readonly CONNECTING = 0; readonly OPEN = 1; readonly CLOSING = 2; readonly CLOSED = 3;
  readyState = 0; protocol = ''; binaryType = 'arraybuffer'; bufferedAmount = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  joins: Frame[] = [];
  readonly url: string;
  constructor(address: string | URL) {
    super(); this.url = String(address); TestSocket.sockets.push(this);
    queueMicrotask(() => { this.readyState = 1; const event = new Event('open'); this.onopen?.(event); this.dispatchEvent(event); });
  }
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (typeof data !== 'string') return;
    const frame = JSON.parse(data) as Frame;
    const [joinRef, ref, topic, event] = frame;
    if (event === 'phx_join') this.joins.push(frame);
    if (['phx_join', 'phx_leave', 'heartbeat'].includes(event)) queueMicrotask(() => this.receive([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: [] } }]));
  }
  receive(frame: Frame) { const event = new MessageEvent('message', { data: JSON.stringify(frame) }); this.onmessage?.(event); this.dispatchEvent(event); }
  broadcast(topic: string, event = 'tasks_changed') { this.receive([null, null, `realtime:${topic}`, 'broadcast', { event, payload: {} }]); }
  close() { this.readyState = 3; }
}

test('real Realtime SDK: private scoped subscriptions, signal refresh, reconnection and cleanup', async () => {
  TestSocket.sockets = [];
  const client = createClient<Database>('https://tasks.example.test', 'test-public-key', { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: TestSocket, reconnectAfterMs: () => 20, timeout: 500 } });
  let refreshes = 0;
  let healthy = false;
  const stop = subscribeToTasks(client, 'alex-id', 'couple-id', () => { refreshes++; }, (value) => { healthy = value; });
  try {
    await delay(150);
    const socket = TestSocket.sockets[0]!;
    assert.ok(socket);
    assert.equal(healthy, true);
    assert.deepEqual(socket.joins.map((frame) => frame[2]).sort(), ['realtime:tasks:couple:couple-id', 'realtime:tasks:user:alex-id']);
    for (const frame of socket.joins) assert.equal((frame[4].config as { private: boolean }).private, true);
    const before = refreshes;
    socket.broadcast('tasks:couple:couple-id');
    socket.broadcast('tasks:user:alex-id');
    await delay(130);
    assert.equal(refreshes, before + 1, 'duplicate notifications are batched');
    socket.broadcast('tasks:couple:unrelated');
    socket.broadcast('tasks:user:alex-id', 'unrelated_event');
    await delay(130);
    assert.equal(refreshes, before + 1, 'other topics/events cannot refresh this subscription');
    const joined = socket.joins.find((frame) => frame[2] === 'realtime:tasks:couple:couple-id')!;
    socket.receive([joined[0], null, joined[2], 'phx_error', {}]);
    assert.equal(healthy, false);
    // Channel rejoin uses Phoenix’s separate 1-second backoff.
    await delay(1250);
    assert.equal(healthy, true, 'channel automatically rejoins after an error');
    assert.ok(socket.joins.length >= 3);
    stop();
    const stopped = refreshes;
    socket.broadcast('tasks:user:alex-id');
    await delay(130);
    assert.equal(refreshes, stopped);
    assert.equal(client.getChannels().length, 0);
  } finally { stop(); await client.removeAllChannels(); client.realtime.disconnect(); }
});
