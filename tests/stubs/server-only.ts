/**
 * Test stub for the `server-only` marker.
 *
 * Next.js resolves "server-only" to a module that throws if it is ever bundled
 * into client code. Node-based unit tests run outside that pipeline, so the
 * marker is aliased to a no-op (see tests/tsconfig.json) — the import stays in
 * the source file where it belongs, guarding the real app.
 */
export {};
