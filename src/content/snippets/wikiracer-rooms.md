---
title: "Multiplayer rooms that cost nothing while idle"
project: wikiracer
language: ts
skill: "Real-time backend"
file: "worker/course.ts"
order: 4
---

```ts
// No timers: one alarm holds the next deadline, so the object can hibernate between messages
export class Course extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // … load the room from SQLite storage
    // The runtime answers heartbeats without waking the object
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  // … save(room) writes the room's row and calls setAlarm(nextAlarm(room))

  async alarm(): Promise<void> {
    const now = Date.now();
    const room = this.room;
    if (!room) return;
    if (expired(room, now)) {
      for (const ws of this.ctx.getWebSockets()) {
        this.send(ws, { t: 'error', code: 'expired' });
        ws.close(CLOSE_EXPIRED, 'expired');
      }
      this.room = null;
      this.results = [];
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.deleteAll();
      return;
    }
    if (phaseAt(room, now) === 'race') {
      const next = endRound(room, now);
      if (next.stage !== room.stage) {
        this.save(next);
        this.broadcast(room, next, now);
        return;
      }
    }
    await this.ctx.storage.setAlarm(nextAlarm(room));
  }
}

// The round's end while one runs, else expiry 30 days after the last activity
export const nextAlarm = (r: Room) => (r.stage === 'round' ? r.startAt! + limitMs(r) : r.lastActivity + EXPIRY_MS);
```

**The problem:** Friends race each other live in rooms, which needs a server holding open WebSockets, and the whole project has to stay on Cloudflare's free tier.

**Why this approach:** Each room is one Durable Object that hibernates between messages, so an idle room costs nothing, even with players connected. A `setTimeout` would keep it awake, so there are no timers: a single alarm holds whichever deadline is next, the round's end or the room's expiry.

**What to notice:** Heartbeat pings are answered by the runtime itself without waking the object, and the expiry alarm deletes all of the room's storage, so nothing is left behind.
