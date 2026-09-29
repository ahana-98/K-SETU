# Offline-First Support

## Overview

K-SETU includes offline-first support for selected collector workflows. It uses browser `localStorage` to cache reference data and temporarily queue new lots when the network is unavailable.

The goal is to help collectors continue recording e-waste lots during intermittent connectivity and synchronize them with the server when a connection becomes available.

## Supported behavior

* **Cached reference data:** Material prices and recycler information are cached in `localStorage` for access during temporary network interruptions.
* **Offline lot creation:** Newly created lots can be placed in a local queue when the server cannot be reached.
* **Connection status:** The application displays `Offline`, `Syncing`, or `Synced` states in the top bar.
* **Automatic synchronization:** The application attempts to flush queued lots to `POST /api/sync` when connectivity returns and through a periodic 20-second interval.
* **Queue persistence:** Queued lots remain stored locally until the server acknowledges them.

## Typical workflow

1. Open the collector application while connected so reference data can be loaded and cached.
2. If connectivity is lost, continue using supported lot-creation features.
3. Newly created lots are saved to the local queue rather than being discarded because of a temporary network failure.
4. When connectivity returns, the application attempts to send queued lots to `POST /api/sync`.
5. The interface reflects the synchronization state. Queued items remain available until the server acknowledges them.

## Data storage

Offline data is stored in the browser's `localStorage` on the device and browser used by the collector.

This means that offline data is not automatically shared across devices or browsers. Clearing browser storage, using private browsing, or losing access to the device may result in locally queued data becoming unavailable.

## Limitations

* Offline support depends on previously cached reference data and the browser's local storage.
* Server-dependent operations may require an active network connection.
* Cached prices and recycler information may become outdated while offline.
* A visible `Synced` state indicates synchronization status in the application; users should verify that records appear in the server-backed workflow when necessary.
* Offline support is intended for the prototype's supported collector workflows, not as a guarantee that every application feature works without connectivity.

## Important note

The offline queue improves resilience during temporary network interruptions, but browser storage is not a substitute for a server-side backup. Collectors should reconnect and allow synchronization to complete before clearing browser data or changing devices.

## Related documentation

* [Architecture](./ARCHITECTURE.md)
* [API Reference](./API.md)
* [Database](./DATABASE.md)
* [Demo Guide](./DEMO.md)