// «Як рӯз дар ихтисос»: сенарияи кӯтоҳи кори воқеӣ (3 вазифа, ~10 дақиқа).
// Матн барои се забон; ҷавобҳои дуруст ва шарҳҳо танҳо дар сервер — браузер онҳоро
// фақат баъди ҷавоб додан мегирад (ниг. TrialService.check).

export type Lang = 'tj' | 'ru' | 'en';
export type TaskId = 't1' | 't2' | 't3';
export type TaskKind = 'choice' | 'order' | 'multi' | 'number';

export interface OptionText {
    id: string;
    text: string;
    // Шарҳ: мутахассиси воқеӣ чӣ мекард ва чаро. Баъди санҷиш нишон дода мешавад.
    feedback?: string;
}

export interface TaskText {
    title: string;
    prompt: string;
    quote?: string;
    code?: string;
    table?: { head: string[]; rows: string[][] };
    question: string;
    options?: OptionText[];
    unit?: string;
    // Баъди санҷиш, бо забони содда: малакае, ки хонанда санҷид; 3 қадами фикри
    // мутахассис; як ҷумла дар бораи кори воқеӣ.
    skillName: string;
    steps: string[];
    realLife: string;
    // Ихтиёрӣ: чӣ тавр ин малакаро аз ҳозир инкишоф диҳед (сенарияҳои ихтисос).
    tip?: string;
    // Барои вазифаи рақамӣ: шарҳи ҷавобҳои хатои маъмул.
    wrongNumbers?: Record<string, string>;
}

export interface ScenarioText {
    role: string;
    place: string;
    intro: string;
    disclaimer?: string;
    tasks: TaskText[];
    reality: string[];
}

export interface TaskKey {
    id: TaskId;
    kind: TaskKind;
    skill: 'hard' | 'soft';
    // choice: id; multi: id[] (маҷмӯъ); order: id[] (тартиби пурра); number: адад.
    answer: string | string[] | number;
    // order: вазифа ҳалшуда ҳисоб мешавад, агар ин банд аввал бошад.
    mustFirst?: string;
    // Рамзҳои ихтисосҳои база барои хулосаи «агар ин қисм писанд омад…».
    related: string[];
}

export interface Scenario {
    family: string;
    minutes: number;
    keys: TaskKey[];
    text: Record<Lang, ScenarioText>;
}
