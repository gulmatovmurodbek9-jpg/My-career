/**
 * Номи манбаъро ба суроғаи расмии он мебарорад.
 *
 * Дар база манбаъҳо матни оддианд («freeCodeCamp — Responsive Web Design»),
 * аз ин рӯ саҳифа онҳоро ҳамчун матни мурда нишон медод. Ин ҷадвал танҳо
 * платформаҳоеро дар бар мегирад, ки суроғаашон бешубҳа маълум аст.
 *
 * Барои номҳои дигар пайванд СОХТА НАМЕШАВАД. Пайванди бофта аз набудани
 * пайванд бадтар аст: корбар зер мекунад ва ба саҳифаи вайрон меафтад.
 * Китобҳо низ пайванд намегиранд — нашрияҳо ва фурӯшгоҳҳо гуногунанд.
 */
const PLATFORMS = [
  [/freecodecamp/i, "https://www.freecodecamp.org/"],
  [/\bcs50\b/i, "https://cs50.harvard.edu/"],
  [/odin project/i, "https://www.theodinproject.com/"],
  [/\bstepik\b/i, "https://stepik.org/"],
  [/\bcoursera\b/i, "https://www.coursera.org/"],
  [/\bedx\b/i, "https://www.edx.org/"],
  [/\budemy\b/i, "https://www.udemy.com/"],
  [/khan academy/i, "https://www.khanacademy.org/"],
  [/sololearn/i, "https://www.sololearn.com/"],
  [/mdn web docs|\bmdn\b/i, "https://developer.mozilla.org/"],
  [/stack overflow/i, "https://stackoverflow.com/"],
  [/\bgithub\b/i, "https://github.com/"],
  [/\bdev\.to\b/i, "https://dev.to/"],
  [/\bhabr\b/i, "https://habr.com/"],
  [/\bkaggle\b/i, "https://www.kaggle.com/"],
  [/investopedia/i, "https://www.investopedia.com/"],
  [/\bw3schools\b/i, "https://www.w3schools.com/"],
  [/\bfigma\b/i, "https://www.figma.com/"],
  [/\bcanva\b/i, "https://www.canva.com/"],
  [/\bduolingo\b/i, "https://www.duolingo.com/"],
  [/\bpubmed\b/i, "https://pubmed.ncbi.nlm.nih.gov/"],
  [/\bbmj\b/i, "https://www.bmj.com/"],
  [/бонки миллии тоҷикистон|nbt\.tj/i, "https://nbt.tj/"],
  [/вазорати маориф/i, "https://maorif.tj/"],
  [/\bandroid developers\b/i, "https://developer.android.com/"],
  [/\bnptel\b/i, "https://nptel.ac.in/"],
];

/** Суроға, агар манбаъ шинохта шавад; вагарна `null`. */
export function resourceUrl(name) {
  if (typeof name !== "string") return null;
  const hit = PLATFORMS.find(([pattern]) => pattern.test(name));
  return hit ? hit[1] : null;
}
