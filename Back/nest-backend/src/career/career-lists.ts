// Сутунҳои simple-array рӯйхатро дар вергул нигоҳ медоранд, бинобар ин «Нерӯгоҳҳо (Норак, Роғун)»
// ё номи ихтисоси вергулдор ба чанд пора канда мешавад. Дар ин ҷо порчаҳо бармегарданд.
const LIST_COLUMNS = ['technologies', 'projectsExamples', 'careerOpportunities', 'relatedSpecializations', 'certification'] as const;

const openBrackets = (text: string) => (text.match(/[(«]/g)?.length ?? 0) - (text.match(/[)»]/g)?.length ?? 0);

export function joinBrokenList(items: string[]): string[] {
    const out: string[] = [];
    for (const raw of items) {
        const item = raw.trim();
        if (!item) continue;
        // Танҳо ҳарфи хурди кириллӣ: iOS, pandas ва git номи алоҳидаанд.
        const startsSmall = /^[а-яёӣӯқғҳҷ]/.test(item);
        const previous = out[out.length - 1];
        if (previous !== undefined && (startsSmall || openBrackets(previous) > 0)) {
            out[out.length - 1] = `${previous}, ${item}`;
        } else {
            out.push(item);
        }
    }
    return out;
}

export function joinBrokenLists<T extends object>(career: T): T {
    const out: any = { ...career };
    for (const column of LIST_COLUMNS) {
        if (Array.isArray(out[column])) out[column] = joinBrokenList(out[column]);
    }
    return out;
}
