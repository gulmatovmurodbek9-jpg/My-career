
function share(items, buckets) {
  if (!items.length) return Array.from({ length: buckets }, () => []);
  const perBucket = Math.ceil(items.length / buckets);
  return Array.from({ length: buckets }, (_, i) =>
    items.slice(i * perBucket, (i + 1) * perBucket),
  );
}

export function buildRoadmap(career, t = (k, o) => o?.defaultValue ?? k) {
  const technical = career?.skills?.technical ?? [];
  const soft = career?.skills?.soft ?? [];
  const tech = career?.technologies ?? [];
  const jobs = career?.careerOpportunities ?? [];
  const certs = career?.certification ?? [];

  if (technical.length === 0 && tech.length === 0) return null;

  const years = Math.min(Math.max(Number(career?.durationYears) || 4, 2), 6);
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
