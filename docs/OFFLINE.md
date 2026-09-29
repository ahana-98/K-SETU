# Offline-first
Collector app caches prices/recyclers in localStorage, queues lots created while
offline, shows Offline/Syncing/Synced states in the top bar, and flushes the
queue to POST /api/sync on reconnect (event-driven + 20s interval). User-created
lots are never lost: they persist in the queue until the server acknowledges.
