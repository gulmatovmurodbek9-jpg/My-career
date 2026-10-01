// 17/18: дар база тавсифи муассисаҳо нест — аз маълумоти воқеӣ (навъ, шаҳр, шакл, ихтисосҳо) месозем.
export const autoDescription = (t, uni) =>
  t("career_page.u_auto_desc", {
    type: uni.institutionType || t("career_page.u_institution"),
    city: uni.city || t("career_page.u_city_unknown"),
    state: uni.isState ? t("career_page.u_state_short") : t("career_page.u_private_short"),
    count: uni.careerCount || 0,
  });
