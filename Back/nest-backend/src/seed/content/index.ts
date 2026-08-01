/**
 * Registry of hand-written specialty content.
 *
 * Each batch file exports `CareerContentBatch` (an array keyed by NTC code).
 * Add the import and spread it into `BATCHES` — the seeder picks it up on the
 * next run and flips those careers to `contentWritten: true`.
 */
import { CareerContent, CareerContentBatch } from './types';

import { cluster1Batch01 } from './cluster1-01';
import { cluster1Batch02 } from './cluster1-02';

const BATCHES: CareerContentBatch[] = [
    cluster1Batch01,
    cluster1Batch02,
];

/** code → content. A later batch overrides an earlier one with the same code. */
export const CAREER_CONTENT: Map<string, CareerContent> = (() => {
    const byCode = new Map<string, CareerContent>();
    for (const batch of BATCHES) {
        for (const entry of batch) {
            byCode.set(entry.code, entry);
        }
    }
    return byCode;
})();

export { CareerContent, CareerContentBatch } from './types';
export { buildStubContent } from './stub';
