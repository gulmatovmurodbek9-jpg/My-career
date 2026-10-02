// Синфи хатмкарда: баъди синфи 9 танҳо коллеҷ, баъди синфи 11 — коллеҷ ва донишгоҳ.
// Дар база ҳар пешниҳоди ихтисос «basedOn» (9 ё 11) дорад — аз ҷадвали расмии ММТ.
export type Grade = 9 | 11;

export const parseGrade = (raw: unknown): Grade | null => {
    const value = Number(raw);
    return value === 9 || value === 11 ? value : null;
};

// Ихтисос барои ин синф пешниҳод дорад. Параметри :grade бояд дода шавад.
export const offeredForGrade = (careerAlias: string) =>
    `EXISTS (SELECT 1 FROM career_offerings grade_offer WHERE grade_offer."careerId" = ${careerAlias}.id AND grade_offer."basedOn" = :grade)`;
