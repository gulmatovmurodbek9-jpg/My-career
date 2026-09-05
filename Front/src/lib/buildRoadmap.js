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

export function buildRoadmap(career) {
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
      tasks.unshift("Фанҳои умумӣ ва заминаи назариявии ихтисос");
      if (soft.length) tasks.push(...soft.slice(0, 2));
    }
    if (year === 2 && tech.length) {
      tasks.push("Кор бо барномаҳо: " + tech.slice(0, 4).join(", "));
    }
    if (year === studyYears) {
      tasks.push("Таҷрибаомӯзӣ дар ташкилоти соҳавӣ");
    }

    steps.push({
      step: year,
      title: `Соли ${year}`,
      tasks: tasks.filter(Boolean),
    });
  }

  if (years > studyYears) {
    steps.push({
      step: years,
      title: `Соли ${years} — кори хатм`,
      tasks: [
        "Кори хатм (дипломӣ) аз рӯи мавзӯи интихобшуда",
        tech.length ? "Ҳимоя бо истифодаи " + tech.slice(0, 2).join(" ва ") : null,
      ].filter(Boolean),
    });
  }

  if (jobs.length || certs.length) {
    steps.push({
      step: steps.length + 1,
      title: "Баъди хатм",
      tasks: [
        jobs.length ? "Ҷойҳои кор: " + jobs.slice(0, 4).join(", ") : null,
        certs.length ? "Сертификатҳои фоиданок: " + certs.slice(0, 3).join(", ") : null,
      ].filter(Boolean),
    });
  }

  return steps;
}
