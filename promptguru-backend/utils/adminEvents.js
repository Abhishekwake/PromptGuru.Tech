import crypto from "crypto";

const MAX_EVENTS = 250;
const events = [];
let ioRef = null;

export function setAdminIo(io) {
  ioRef = io;
}

export function getRecentEvents(limit = 80) {
  return events.slice(0, Math.min(limit, events.length));
}

export function broadcastAdminEvent(event) {
  const full = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...event,
  };
  events.unshift(full);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;

  if (ioRef) {
    ioRef.to("admin:monitor").emit("admin:live_event", full);
  }
  return full;
}
