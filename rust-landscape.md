# The Rust-in-JavaScript Landscape

This document maps where Rust (and other compiled languages) have already been applied to the JavaScript ecosystem. The goal is to see which layers are crowded, which are proven but young, and which are still open — so Pulse can position itself where there is real room.

## The Pattern

Every successful project in this space follows the same recipe: find a CPU-bound hot loop that runs in or alongside JavaScript, rewrite that loop in a compiled language, and wrap it in an interface JavaScript developers can adopt without learning Rust. The interesting question is not "can Rust speed up JavaScript" but "which hot loops are still unclaimed."

## Layer 1: Build Tooling — Crowded

This is where the "rewrite it in Rust" wave started, because compiling and bundling source code is massively CPU-bound.

* **SWC** — Rust replacement for Babel (transpilation). Powers Next.js compilation.
* **Turbopack** — Rust bundler from Vercel, successor direction to Webpack.
* **Rolldown** — Rust bundler built to back Vite, replacing Rollup.
* **Rspack** — Rust rewrite of Webpack's core.
* **Lightning CSS** — Rust CSS parser, transformer, and minifier.
* **Biome** — Rust linter and formatter (Prettier + ESLint territory).
* **Oxc** — Rust toolchain (parser, linter, resolver) focused on raw speed.

Worth noting for accuracy: **esbuild** is Go and **Bun** is Zig — the pattern is "compiled language," not Rust specifically. **Deno**, however, is a JavaScript runtime built in Rust.

**Takeaway:** this layer is saturated. There is no room for a newcomer here, but it proves the commercial and community appetite for the pattern.

## Layer 2: Server-Side Rust — Mature and Growing

If most query latency lives on the server, this is where Rust attacks it directly.

* **axum / actix-web** — high-performance web frameworks; among the fastest HTTP servers in public benchmarks.
* **Tokio** — the async runtime underneath most Rust network services.
* **sqlx / SeaORM** — async database access.
* **ReadySet** — a Rust incremental query cache that sits in front of MySQL/Postgres and serves repeated queries in microseconds. Direct evidence of demand for "Rust layer in front of the database."
* **Tauri** — Rust shell for desktop (and increasingly mobile) apps with web frontends; replaces Electron's heavier runtime.

**Takeaway:** proven and active, but competitive and expert-oriented. A newcomer project here competes with well-funded infrastructure teams.

## Layer 3: Client-Side Rust via WebAssembly — Proven but Thin

This is the layer Pulse targets: Rust compiled to Wasm, running inside the browser or mobile webview at application runtime. There are successful projects, but far fewer than in tooling — which makes it the most interesting layer.

### Collaboration and local data

* **Automerge** — CRDT library for collaborative/local-first apps; its core is Rust compiled to Wasm. The clearest proof that a Rust core behind a friendly JS API can win adoption.
* **Yrs** — Rust port of Yjs, the other major CRDT engine.

### AI-adjacent

* **tiktoken (Wasm builds)** — OpenAI-compatible tokenizers running in the browser via Rust→Wasm. Token counting over long conversations is genuinely CPU-bound and increasingly common in AI frontends.
* **On-device vector search / embeddings math** — an emerging area for local AI features; several small Rust/Wasm efforts, no dominant player yet.

### Data processing

* **DuckDB-Wasm** — full analytical database in the browser (C++, not Rust, but the same thesis).
* **Apache Arrow (arrow-rs)** — the Rust implementation of the columnar format; Arrow's JS library consumes the same buffers, enabling zero-materialization data handoff.
* **Tantivy** — a Rust full-text search engine (the "Rust Lucene"); browser/Wasm experiments exist but no polished client search product has claimed the space.

### Media and text

* **Squoosh** — image compression codecs compiled to Wasm; the canonical demonstration that heavy transforms belong off the JS thread.
* **resvg / Wasm image tools** — SVG and raster processing in Rust.
* **Shiki + Oniguruma** — syntax highlighting backed by a Wasm regex engine.

**Takeaway:** the pattern is validated at runtime (Automerge is the model to study), but each niche has at most one or two serious occupants, and several — client search, conversation/history management, schema validation, incremental payload decode — have none with strong developer experience.

## Layer 4: Serialization Formats — Building Blocks, Not Products

* **prost / protobuf rust** — Protocol Buffers in Rust.
* **flatbuffers-rust** — zero-copy access patterns.
* **rmp (MessagePack)** — compact JSON-like encoding.
* **arrow-rs IPC** — streamable columnar format.

All of these have both Rust and JavaScript implementations because formats are language-neutral. None of them ship a frontend integration story; that gap is consistently left to application teams.

## What the Map Suggests

1. **Tooling is closed.** The Bun/Vite/SWC opportunity has been taken, several times over.
2. **Server-side is open but crowded and expert-level.**
3. **The client runtime layer is the thin one.** Automerge proves a Rust/Wasm core behind a simple JS API can become the default choice in its niche. The niches adjacent to Pulse's thesis — hydrating long AI conversations, local search over message history, token counting and context assembly, incremental decode of large payloads — have validated ingredients but no packaged, easy-to-adopt product.
4. **The winning shape is consistent everywhere:** Rust core, Wasm build, JavaScript-first API, and developer experience good enough that users never need to know Rust is inside.
