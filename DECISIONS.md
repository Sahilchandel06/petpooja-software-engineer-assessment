# Design Decisions

This document records the decisions and limitations of the current TaskFlow assessment implementation. It describes what is in this repository today and separates that from changes I would make at higher scale.

The single selected wildcard is Option 3 (nested checklist and progress). The assessment explicitly permits additional features, so I added client-side debounced search and multi-select priority/column filters as a separate enhancement inspired by Option 1. I am not presenting it as a second wildcard selection. The filtered view keeps the columns, drag targets, and card move actions available; filters affect visibility only.

## 1. State architecture and library selection

I chose Zustand for the client board state. The board needs a small number of shared actions—fetch, create, edit, delete, and move—and it needs to update immediately when a user moves a card. Zustand lets the UI call those actions without threading callbacks through the component tree. I keep tasks normalized in `tasksById` and keep each column's order in a separate ID list. Components select only the data they need, which helps avoid rerendering every card when an unrelated task changes.

I considered Redux Toolkit. It provides a more prescribed structure, reducer conventions, middleware, and a well-defined place for larger teams to coordinate complex state transitions. For this assessment it would add setup and action/reducer ceremony around a board whose state and transitions are already localized in one store. I would reconsider it if the application gained multiple domains, many contributors, or extensive cross-cutting middleware needs.

I also considered React Context with `useReducer`. It is built into React and is a reasonable choice for modest state. Here, the board has frequent, targeted updates. A context value containing the whole board can make many consumers render when that value changes; splitting contexts and selectors can reduce this, but then the application needs to manage that structure itself. Zustand selectors provide the needed subscriptions with less plumbing.

Zustand has limitations. It does not impose a domain architecture, so a store can turn into an unstructured collection of actions if it grows. Selectors must be used consistently to retain narrow subscriptions. The store is client state, not a server cache or cross-user synchronization system; it does not provide persistence, conflict resolution, or collaboration by itself. This project implements those concerns explicitly around move requests, but it does not make every task edit a collaborative real-time operation.

## 2. Race-condition defense: five drags in one second on 3G

The board separates what the user sees from when the network writes happen:

1. **Each drag updates the visible board immediately.** The drag handler determines the destination column and target position. The Zustand `moveTask` action changes the task's `columnId` and `orderIndex` and updates the ordered ID lists before awaiting the API. The UI does not wait for a slow mobile connection.
2. **Each operation gets a UUID and is put in a FIFO queue.** If a user drags five cards within one second, all five optimistic moves appear immediately, while only one move request is in flight from that browser at a time. The queue sends requests in the order they were enqueued.
3. **The queued move resolves its location against the latest visible neighbors when it reaches the front.** It uses neighboring task IDs as anchors and computes an `orderIndex` between the current neighboring positions, or at a column edge. This avoids sending five network writes that all depend on the same stale ordering snapshot.
4. **Each request uses the latest confirmed version for that task.** A successful response updates the confirmed task record and version. The next queued operation then uses the version that the server just returned. Later optimistic locations remain visible while earlier writes are being confirmed.
5. **An uncertain network response is retried with the same request body and UUID.** The server stores operation results in `MoveOperation`, keyed by a unique operation ID and with a TTL. An exact retry returns its stored result instead of applying the move a second time.
6. **A hard failure rolls back the failed card and drops dependent queued moves for that same card.** The store reconciles that card to its last confirmed record (or the current task returned by a 409) and rebuilds column order. Further queued moves for that task are dropped because their intended position may depend on the failed move. Operations for other cards remain queued. The UI shows an error toast.
7. **The API independently guards against other clients and stale state.** The server validates the body and IDs, then performs the move inside a MongoDB transaction. It checks the operation ID, loads the current task, and compares the submitted `version`. The final task write is a conditional `findOneAndUpdate` filtered by `{ _id, version }`, with `$set` for `columnId` and `orderIndex` and `$inc` for `version`. If the version is stale, the write does not match and the API returns `409` with the current task for client reconciliation.
8. **Fractional positions avoid rewriting a whole column for ordinary moves.** The client sends a position between neighboring numeric indexes (or before/after the edge). If the available gap is at or below the epsilon threshold, the server rebalances destination positions in the same transaction. The `{ columnId, orderIndex }` index supports ordered task lookup.

The FIFO queue prevents this browser's rapid move writes from racing each other; version checks and transactions protect against competing clients. Transactions require a replica set, so the move path works with Atlas and with local MongoDB configured as a replica set. A standalone server returns `503` rather than attempting an unsafe partial write.

There are limits. The queue is per browser and only serializes moves, not edits or deletes. Ordinary task edits increment `version`, but they do not submit an expected version filter, so simultaneous edits can still be last-write-wins. The board also has no push channel for changes made in another browser; a remote move becomes visible to this client when a version conflict is encountered or the board is fetched again.

## 3. AI debugging retrospective

I used AI assistance to draft and revise code, and I recorded the following actual mistakes in `CONTEXT.md`'s AI MISTAKES LOG. These are my generated-code errors, not examples attributed to an external tool or another person.

- **Wrong `useDroppable` import.** An early DnD draft imported `useDroppable` from `@dnd-kit/sortable` instead of `@dnd-kit/core`. I corrected the import before the successful client build. The underlying issue was selecting the wrong package for a hook whose API belongs to the core DnD context.
- **Duplicate error toasts.** An optimistic mutation draft reported an error in both the store and its component. That could show two notifications for one failed request. I moved failure toasts into the store, so the state action owns rollback and its single error notification.
- **Malformed dependency key.** An early client package manifest used `" postcss"` with a leading space. Review caught the invalid key; I corrected it to `"postcss"` before dependency installation and the client build.
- **Test setup started too early.** The first Step 9 API test setup used a suite hook while MongoDB Memory Server was still downloading its binary, and requests overlapped database startup. I changed setup to top-level `await` so the replica set and indexes are ready before those API tests execute.

The log also records other real issues, including a missing object-literal brace caught before verification and an unused caught-error binding found by ESLint. I am keeping this retrospective to recorded incidents rather than inventing a more dramatic failure. The practical lesson is to inspect generated imports and manifests, run the build and lint checks, and exercise startup-dependent code with the same lifecycle the tests need.

## 4. High-scale failure analysis: 50,000 tasks and 100 concurrent users

The first performance bottleneck I expect is the unpaginated board read. `GET /api/tasks` loads every task, then the server sorts the results into display-column order and sends the full collection to every browser. The client then builds the entire board and renders all cards. At 50,000 tasks this creates a large database result, network payload, client state object, and DOM/rendering workload before the user can work comfortably. The existing `{ columnId, orderIndex }` index helps the database sort, but it does not reduce the number of returned documents.

I would change the read API to fetch one column at a time using cursor pagination. The cursor should include `orderIndex` and `_id` as a deterministic tie-breaker, backed by a matching compound index such as `{ columnId: 1, orderIndex: 1, _id: 1 }`. The client would load additional pages as needed. I would window the rendered cards so only the visible range is mounted. That reduces response size, client memory, and DOM work without changing the current task model's basic shape.

The move path also needs attention at this scale. It currently loads the destination column's tasks to find neighboring positions, and a rebalance can update many documents in one transaction. I would use bounded indexed queries to find only the immediate neighbors for normal moves, then design and load-test a bounded rebalancing strategy for dense gaps. The existing index and version filter are useful foundations, but they do not make an unbounded neighbor scan cheap.

For 100 editors, the next major product limitation is the absence of live synchronization. Version checks prevent a stale move from silently overwriting the same task, but clients do not receive changes made elsewhere until they fetch again or hit a conflict. I would publish granular task events through Server-Sent Events (or WebSockets if bidirectional presence becomes necessary), have clients apply those events to their normalized store, and use a shared message broker if the API runs in multiple processes. I would include the task version in each event and continue using conditional writes so event delivery is not treated as the source of truth.

I would also add expected-version checks to ordinary edit/delete operations and define conflict handling for them. The current implementation's optimistic and version-conflict protections are strongest for moves; it should not be presented as full multi-user collaboration. These changes would need load tests and careful operational design before adoption; they are a re-architecture proposal, not features claimed by this submission.
