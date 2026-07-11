# PULSE: A Rust-Powered Conversation Engine for AI Apps

Pulse is a proposed performance engine for AI chat and agent applications, built around a Rust core compiled to WebAssembly behind a simple JavaScript API. Its first target is one concrete, growing pain point: long AI conversations are slow to reopen, search, and assemble into model context. Pulse aims to make conversation state hydrate, search, and render fast on web and mobile clients.

The broader ambition — a general Rust-powered transport and decode layer for large structured payloads — remains on the map, but as an expansion path to be earned through real usage rather than the starting point. Pulse's goal is not to replace React, Next.js, or the DOM. It is to remove client-side CPU cost in one narrow, painful scenario first.

## The Thesis
An honest accounting of where query latency lives shapes the whole project:

1. For a typical API response of a few kilobytes, network round-trips and server work dominate. JavaScript's built-in JSON parsing is heavily optimized, and there is nothing meaningful for a client library to speed up.
2. The client-side opportunity only opens when payloads are large or the CPU work is heavy: parsing megabytes of structured data, materializing enormous numbers of JavaScript objects, building large DOM trees, or scanning long histories.
3. Reopening a long AI conversation is exactly that case — and it is becoming a daily experience for millions of users. The full history is fetched, parsed, converted to JavaScript objects, and rendered before the interface feels usable.

Pulse targets that gap: the time between conversation data arriving and the interface becoming usable. The wins come less from raw parsing speed and more from avoiding work entirely — keeping data in compact binary form, materializing only what is visible, and moving heavy operations off the main thread.

## Why This Is Worthwhile
This is a niche, but it is a real one.

1. JSON is atomic: nothing renders until the whole payload is parsed, and parsing a large history materializes every message at once, creating main-thread blocking and garbage-collection pressure.
2. Most chat interfaces build state and DOM for messages the user will never scroll to.
3. Searching, token counting, and context assembly across long histories are genuinely CPU-bound in JavaScript.
4. The building blocks (binary formats, workers, WebAssembly, virtualization) are individually proven but not packaged together with a developer experience ordinary product teams can adopt.
5. Every AI chat product faces this problem, and conversations only get longer.

## What Pulse Is
Pulse is best thought of as a performance layer that owns conversation state between a data source and a modern frontend.

In plain terms: Pulse is a Rust-powered engine for storing, hydrating, searching, and assembling AI conversation state in web and mobile apps.

The likely shape of the system is:

### 1. Client Engine (Rust compiled to WebAssembly)
* **Role:** Own conversation state on the device — compact binary storage persisted locally (for example in IndexedDB), with decoding kept off the main thread.
* **Job:** Hydrate instantly on load, hand the UI only the visible window of messages, and run full-text search and token counting inside the Rust core.

### 2. React/Next Integration Layer
* **Role:** Expose the engine through a small, familiar API such as a `useConversation()` hook.
* **Job:** Let application teams adopt the engine without touching Rust or WebAssembly, feeding chat panels and virtualized lists progressively.

### 3. Server Encoder (future scope)
* **Role:** The same Rust core running server-side, storing and streaming histories in the engine's binary format.
* **Job:** Complete the end-to-end path once the client engine has proven its value — see The Expansion Path below.

## What Pulse Is Not
Pulse is not currently framed as:

* a new frontend framework
* a replacement for React or Next.js
* a fix for network latency or server and database time, which no client library can touch
* a general replacement for JSON — for small payloads, built-in JSON parsing is already fast and Pulse would add overhead, not remove it
* a faster way to process the model's context window — that happens server-side at the AI provider (the client-side analogs Pulse does address are described below)
* a system that bypasses the DOM for normal app development
* a guarantee that all application latency disappears

Database performance, cache strategy, network conditions, and UI complexity still matter. Pulse only aims to improve one expensive part of the stack: getting conversation state into a usable client-side form faster and with less overhead.

## Early Use Cases
The strongest first targets are cases where client-side processing of conversation state is already painful:

* reopening long AI conversations without blocking the interface
* AI chat side panels that stream structured citations, search hits, or tool output
* agent builders assembling and trimming model context from history (token counting, truncation, relevance filtering)
* fast local search across full conversation history
* mobile or low-powered devices where parsing and state updates visibly block the UI

Larger structured workloads — admin tables, analytics dashboards, big API result sets — are deliberately out of scope for now. They live in The Expansion Path, to be revisited only if the first product earns adoption.

## Why Rust
Rust is interesting here because it is close to the hardware while still being deployable across multiple environments.

* On the server, Rust can handle encoding, compression, and streaming with predictable performance.
* In the browser, Rust can compile to WebAssembly and handle hot-path parsing or decoding work more efficiently than a JavaScript-only implementation in some workloads.
* In both cases, Rust offers a path toward one shared core for performance-critical logic.

That does not mean Rust automatically makes every app faster. Two honest caveats guide the design. First, built-in JSON parsing is fast, so raw parse speed is not the pitch. Second, crossing the WebAssembly-to-JavaScript boundary is expensive, so the engine only wins if data stays in binary form and JavaScript objects are materialized solely for what is on screen. The value has to be proven against realistic workloads and measured end to end.

## Initial Product Direction
The most credible version of Pulse is not a universal platform on day one. It is a focused developer tool with a narrow promise: make long AI conversations hydrate, search, and assemble into model context fast, through one simple integration point.

That product is specified in the next section. The build order is specified in the Development Roadmap: plain TypeScript first to establish the product skeleton and an honest baseline, then Rust/WebAssembly introduced one measured hot path at a time.

## The First Product: A Conversation-History Engine for AI Chat

Pulse's first product focuses on a single painful scenario: reopening a long AI conversation. As chats grow to thousands of messages, applications pay a heavy price to reload them — the full history is fetched, parsed, turned into JavaScript objects, and rendered before the user can scroll or search.

It is worth being precise about where the cost lives. The model's own context window is processed server-side by the AI provider — when an assistant "re-reads" a long conversation, that work happens in the provider's datacenter and no client library can touch it. But the same intuition has two real client-side analogs:

1. **Re-hydrating the conversation UI** when a user reopens a long chat — fetching, decoding, and rendering thousands of messages before the interface feels usable.
2. **Assembling and trimming the context before sending it** — token counting, truncation, and relevance filtering over history, which is genuinely CPU-bound in JavaScript and where Rust/Wasm tokenizers have already proven their value.

In other words, "parse the context window faster" becomes "hydrate and assemble conversation state faster" — a version of the problem a client library can actually solve.

The engine is built around a Rust core compiled to WebAssembly, with these capabilities:

* **Compact binary storage.** Messages are kept in a compact binary form, persisted locally (for example in IndexedDB), instead of re-parsed JSON blobs.
* **Instant hydration.** On load, the engine makes the conversation usable immediately rather than blocking on a full parse of the entire history.
* **Windowed delivery.** The UI is handed only the visible slice of messages; nothing is materialized into JavaScript objects until it is actually needed on screen.
* **Fast local search.** Full-text search across the entire history runs in the Rust core, off the main thread.
* **Token counting and context assembly.** For agent builders, the engine can count tokens and assemble trimmed context windows from history — a genuinely CPU-bound task in JavaScript that Rust/Wasm tokenizers already handle well.
* **One simple integration point.** All of it exposed through a small React hook such as `useConversation()`, so application teams adopt it without touching Rust or Wasm directly.

This bundles the legitimate CPU-bound wins — binary decode, search, token counting — behind a developer experience that ordinary product teams can pick up in an afternoon. It is narrow enough for a small team to ship, testable against a plain-JSON baseline, and directly relevant to a class of applications that is growing quickly.

### The Expansion Path

Starting narrow does not mean staying narrow. The same Rust core that decodes conversation history on the client can later run on the server as the encoder — the shared-core advantage described in "Why Rust" above. If the client engine earns adoption, natural next steps include a server-side companion that stores and streams histories in the same binary format, and eventually broader caching or aggregation layers for other kinds of large structured data. Those later steps enter more crowded territory with established incumbents, which is exactly why they should be expansions justified by real usage rather than the starting point.

## Development Roadmap

### First Milestone: TypeScript Before Rust

The first buildable milestone deliberately skips Rust. Build the `useConversation()` hook in plain TypeScript — windowed rendering over an IndexedDB-backed message store — and benchmark it against the naive fetch-parse-render-everything path using the measurement experiment in this repository.

This produces three things at once:

1. a working product skeleton (the hook, the store, the windowing logic)
2. an honest baseline to beat
3. direct evidence of exactly where a Rust/Wasm core earns its place (binary decode, full-text search, token counting)

Only then introduce Rust, one hot path at a time. This inverts the common failure mode of starting with the hardest technology first and burning out before anything works end to end.

### Overall Sequence
1. Start with one narrow pain point.
2. Build one clear integration path.
3. Measure the gain against plain JSON.
4. See what users actually care about.
5. Expand only after real feedback.

## Adjacent Technologies
Pulse would enter a space that already has useful building blocks. That is good news, because it means the problem is real and there are proven ideas to learn from.

### Apache Arrow and Arrow Flight
These are columnar data tools designed for efficient in-memory analytics and transport. They are not required for the conversation-history engine, but they become highly relevant if Pulse later expands toward large tabular datasets (see The Expansion Path).

### Protocol Buffers and FlatBuffers
These are binary serialization formats. They reduce payload overhead compared with JSON, but they are general-purpose building blocks rather than a full React-oriented streaming UX layer.

### MessagePack
This is a compact binary alternative to JSON. It is simpler than some other options, but it does not by itself solve incremental rendering or frontend integration.

### DuckDB-Wasm
This shows that serious data processing in the browser via WebAssembly is practical. It is adjacent proof that heavy client-side data work can be moved into a high-performance runtime.

### Web Workers plus Wasm
This is likely part of the implementation approach rather than a competing product. Workers help move decode work off the main thread, and Wasm can accelerate the hot path.

### Virtualized Rendering in React
Libraries for virtualization already solve an important part of the rendering problem by only drawing visible rows. Pulse would likely complement this by making the data delivery path faster and more incremental.

## Open Question — Now Resolved
The key strategic question was whether Pulse should invent a new binary protocol or become a developer-friendly integration layer on top of proven standards. The second path won: the originality lives in the engine, the developer experience, and the benchmarks — not in a new format.

The remaining format decision (MessagePack, FlatBuffers, Arrow IPC, or a minimal custom layout) should be settled by measurement during the Rust milestone, not by up-front architecture debate. The measurement experiment in this repository's `experiment/` folder is the starting point for that evidence.
