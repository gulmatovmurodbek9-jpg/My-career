/**
 * Hand-written editorial content for a specialty, keyed by its official NTC code.
 *
 * Every field maps onto a column of `Career`. Anything omitted here falls back
 * to the generated placeholder in `stub.ts`, so a batch can be written a field
 * at a time without breaking the seed.
 */
export interface CareerContent {
    /** Official NTC code, e.g. "131030408". Must match the parsed data. */
    code: string;

    description?: string;
    purpose?: string;

    skills?: {
        technical: string[];
        soft: string[];
    };

    technologies?: string[];
    roadmap?: string[];
    projectsExamples?: string[];

    learningResources?: {
        books: string[];
        courses: string[];
        blogs: string[];
    };

    careerOpportunities?: string[];

    /** Monthly salary in somoni, as a range per seniority. */
    salaryAndMarket?: {
        junior: string;
        mid: string;
        senior: string;
    };

    relatedSpecializations?: string[];
    advice?: string;
    certification?: string[];

    durationYears?: number;
    degreeType?: string;
}

/** One batch file exports an array of these. */
export type CareerContentBatch = CareerContent[];
