/**
 * Нақшаи роҳро аз маълумоти воқеии ихтисос месозад.
 *
 * Нақшаи дар база захирашуда шаблон аст: «Соли 1: фанҳои умумӣ», «Соли 2:
 * малакаи амалии «НОМ»». Барои 477 ихтисос ҳамагӣ 63 варианти ягона буд, аз
 * ин рӯ ду ихтисоси гуногун қариб як хел менамуданд.
 *
 * Дар ҳамон вақт худи сабт маълумоти мушаххас дорад — малакаҳо, технологияҳо,
 * ҷойҳои кор, сертификатҳо, солҳои таҳсил — ва ҳеҷ кадоми он нишон дода
 * намешуд. Ин ҷо ҳамон маълумот ба қадамҳо тақсим мешавад.
 *
 * Ҳеҷ чиз ихтироъ намешавад: агар майдон холӣ бошад, қадам сохта намешавад.
 */

/** Малакаҳоро ба солҳои таҳсил тақсим мекунад. */
function share(items, buckets) {
  if (!items.length) return Array.from({ length: buckets }, () => []);
  const perBucket = Math.ceil(items.length / buckets);
  return Array.from({ length: buckets }, (_, i) =>
    items.slice(i * perBucket, (i + 1) * perBucket),
  );
}

/*
 *  ҳамчун параметр меояд, на аз i18n рост гирифта мешавад: ин файл
 * ҳуки React нест ва ба контексти забон дастрасӣ надорад. Бе он қадамҳо
 * дар ҳама забон тоҷикӣ мемонданд — дар экран «Соли 1» бо рӯйхати англисӣ
 * дар як ҷо менишаст.
 */
export function buildRoadmap(career, t = (k, o) => o?.defaultValue ?? k) {
  const technical = career?.skills?.technical ?? [];
  const soft = career?.skills?.soft ?? [];
  const tech = career?.technologies ?? [];
  const jobs = career?.careerOpportunities ?? [];
  const certs = career?.certification ?? [];

  // Бе малака ва технология қадамҳо холӣ мешаванд — беҳтар аст, ки нақшаи
  // захирашуда истифода шавад.
  if (technical.length === 0 && tech.length === 0) return null;

  const years = Math.min(Math.max(Number(career?.durationYears) || 4, 2), 6);
  // Соли охир ба кори хатм меравад, бинобар ин малакаҳо ба солҳои пеш аз он.
  const studyYears = Math.max(years - 1, 1);
  const buckets = share(technical, studyYears);

  const steps = [];

  for (let year = 1; year <= studyYears; year += 1) {
    const skills = buckets[year - 1] ?? [];
    const tasks = [...skills];

    if (year === 1) {
      tasks.unshift(t("career_page.rm_basics"));
      if (soft.length) tasks.push(...soft.slice(0, 2));
    }
    if (year === 2 && tech.length) {
      tasks.push(t("career_page.rm_software", { list: tech.slice(0, 4).join(", ") }));
    }
    if (year === studyYears) {
      tasks.push(t("career_page.rm_internship"));
    }

    steps.push({
      step: year,
      title: t("career_page.rm_year", { year }),
      tasks: tasks.filter(Boolean),
    });
  }

  if (years > studyYears) {
    steps.push({
      step: years,
      title: t("career_page.rm_thesis_year", { year: years }),
      tasks: [
        t("career_page.rm_thesis"),
        tech.length ? t("career_page.rm_defense", { list: tech.slice(0, 2).join(", ") }) : null,
      ].filter(Boolean),
    });
  }

  if (jobs.length || certs.length) {
    steps.push({
      step: steps.length + 1,
      title: t("career_page.rm_after"),
      tasks: [
        jobs.length ? t("career_page.rm_jobs", { list: jobs.slice(0, 4).join(", ") }) : null,
        certs.length ? t("career_page.rm_certs", { list: certs.slice(0, 3).join(", ") }) : null,
      ].filter(Boolean),
    });
  }

  return steps;
}
