export interface CareerContent {
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

export type CareerContentBatch = CareerContent[];
