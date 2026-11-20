// Ticket-02/03 replace the old tuning, scoring and snapshot schema.
// Historical assertions are retained in verify-v1.0.mjs and at tag phase-1.
await import('../phase2/maps.mjs');
await import('../phase2/verify.mjs');
await import('../phase2/regression.mjs');
await import('../phase3/verify.mjs');
