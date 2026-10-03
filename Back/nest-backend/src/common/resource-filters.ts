// Манбаъҳои омӯзишӣ барои AI — ҳамон қоидаҳои фронтенд (Front/src/lib/resourceFilters.js):
// «китоб» бе муаллиф номи жанр аст → ҳамчун «мавзӯъ» дода мешавад, то AI онро номи китоб нагӯяд.
const KNOWN_TITLES = [/pmbok guide/i, /фейнмановские лекции/i, /introduction to statistical learning/i, /web application hacker'?s handbook/i, /кодексҳои ҷумҳурии тоҷикистон/i];

export const isRealBook = (item: unknown): boolean => {
    const text = String(item || '');
    if (KNOWN_TITLES.some((re) => re.test(text))) return true;
    const author = text.split(/\s[—-]\s/)[1];
    return Boolean(author) && !/^(учебник|дастур|практическое пособие|пособие)/i.test(author.trim());
};

export const resourcesForAi = (resources: any): any => {
    if (!resources || typeof resources !== 'object') return resources;
    const books: unknown[] = Array.isArray(resources.books) ? resources.books : [];
    return {
        ...resources,
        books: books.filter(isRealBook),
        topicsToRead: books.filter((book) => !isRealBook(book)),
    };
};
