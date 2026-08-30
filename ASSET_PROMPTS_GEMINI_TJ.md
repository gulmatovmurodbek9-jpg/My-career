# Промтҳои расм ва видео барои Gemini / Veo / Imagen

Ҳуҷҷат барои лоиҳаи **Ихтисоси ман**. Промтҳо ба забони англисӣ навишта шудаанд
чунки моделҳои тасвир бо англисӣ хеле беҳтар кор мекунанд. Изоҳҳо ба тоҷикӣ.

**Тартиби кор:** промтро нусхабардорӣ кун → ба Gemini мон → натиҷаро гир →
файлро ба `Front/src/images/` гузор → ба ман бигӯ, ман ҷойгузор мекунам.

---

## БУҶЕТИ РӮЗИ АВВАЛ

Видео маҳдуд аст: **3 дона × 8 сония дар як рӯз**. Расм маҳдудияти хеле
сусттар дорад. Аз ин рӯ тақсимот чунин аст:

| Чӣ | Шумора | Аҳамият |
|---|---|---|
| Расми кластер | 5 | **аввал инҳоро бисоз** |
| Видеои экрани аввал | 1 (3 кӯшиш) | баъд аз расмҳо |
| Расми OG | 1 | охир, агар вақт монад |

**Аввал расмҳоро бисоз, баъд видеоро.** Сабаб: агар вақт кам монад, сайт бо
5 расм ва бе видео хуб ба назар мерасад. Бо видео ва бе расм — не.

---

## ҚОИДАИ АСОСӢ: ЯКХЕЛАГӢ

Панҷ расми кластер бояд **як маҷмӯа** ба назар расанд, на панҷ расми тасодуфӣ.
Барои ин ба **охири ҳар як промт** ҳамин сатрро илова кун, бетағйир:

```
STYLE LOCK: documentary editorial photography, shot on 50mm lens at f/2.0,
soft natural window light from the left, muted desaturated color grade with
warm skin tones, subtle film grain, shallow depth of field, background gently
blurred, no text, no logos, no watermarks, photorealistic, 3:2 aspect ratio
```

Агар ин сатрро гум кунӣ, расмҳо ба ҳам намемонанд ва саҳифа бетартиб мешавад.

---

## ҚИСМИ 1 — ПАНҶ РАСМИ КЛАСТЕР

Ҳар расм: як мутахассиси тоҷик дар ҷои кори воқеии худ. Одамони воқеӣ, на
моделҳои штампӣ. Синну сол 25–40.

### 1.1 Кластери 1 — Илмҳои табиӣ ва техникӣ

```
A young Tajik engineer in his late twenties standing in a bright modern
electrical substation control room in Dushanbe, wearing a clean navy work shirt
and a safety helmet held under one arm, looking at a large monitor showing power
grid diagrams, morning daylight through tall industrial windows, calm and
competent expression, Central Asian features, black hair.

STYLE LOCK: documentary editorial photography, shot on 50mm lens at f/2.0,
soft natural window light from the left, muted desaturated color grade with
warm skin tones, subtle film grain, shallow depth of field, background gently
blurred, no text, no logos, no watermarks, photorealistic, 3:2 aspect ratio
```

**Файл:** `cluster-1.jpg`

---

### 1.2 Кластери 2 — Иқтисод ва география

```
A Tajik woman in her early thirties working as a financial analyst, sitting at a
clean wooden desk in a modern Dushanbe office, wearing a simple dark blazer over
a light blouse, a headscarf is optional, reviewing printed charts spread on the
desk with a pen in hand, large window behind showing blurred city rooftops,
focused thoughtful expression, Central Asian features.

STYLE LOCK: documentary editorial photography, shot on 50mm lens at f/2.0,
soft natural window light from the left, muted desaturated color grade with
warm skin tones, subtle film grain, shallow depth of field, background gently
blurred, no text, no logos, no watermarks, photorealistic, 3:2 aspect ratio
```

**Файл:** `cluster-2.jpg`

---

### 1.3 Кластери 3 — Филология, педагогика ва санъат

```
A Tajik schoolteacher in her late twenties standing beside a blackboard in a
sunlit classroom in Tajikistan, wearing a modest dark green dress with subtle
traditional embroidery at the collar, holding an open book, mid-explanation with
a warm engaged expression, a few blurred pupils visible at the edge of frame,
chalk dust in the light beam, Central Asian features.

STYLE LOCK: documentary editorial photography, shot on 50mm lens at f/2.0,
soft natural window light from the left, muted desaturated color grade with
warm skin tones, subtle film grain, shallow depth of field, background gently
blurred, no text, no logos, no watermarks, photorealistic, 3:2 aspect ratio
```

**Файл:** `cluster-3.jpg`

---

### 1.4 Кластери 4 — Ҷомеашиносӣ ва ҳуқуқ

```
A Tajik lawyer in his mid thirties in a quiet law office, wearing a charcoal
suit without a tie, standing beside tall shelves of legal books, holding a
document folder, serious and calm expression, warm afternoon light entering from
a window on the left, Central Asian features, short dark hair.

STYLE LOCK: documentary editorial photography, shot on 50mm lens at f/2.0,
soft natural window light from the left, muted desaturated color grade with
warm skin tones, subtle film grain, shallow depth of field, background gently
blurred, no text, no logos, no watermarks, photorealistic, 3:2 aspect ratio
```

**Файл:** `cluster-4.jpg`

---

### 1.5 Кластери 5 — Тиб, биология ва варзиш

```
A Tajik doctor in her early thirties in a clean modern hospital corridor in
Dushanbe, wearing light blue scrubs and a stethoscope around her neck, holding a
tablet, pausing mid-walk and looking toward the camera with a reassuring calm
expression, soft daylight from a window at the end of the corridor, Central
Asian features.

STYLE LOCK: documentary editorial photography, shot on 50mm lens at f/2.0,
soft natural window light from the left, muted desaturated color grade with
warm skin tones, subtle film grain, shallow depth of field, background gently
blurred, no text, no logos, no watermarks, photorealistic, 3:2 aspect ratio
```

**Файл:** `cluster-5.jpg`

---

## ҚИСМИ 2 — ВИДЕО (Veo)

### Буҷет: 3 видео дар як рӯз

Ин маҳдудият қарори муҳимро талаб мекунад. Қарор:

> **Дар сайт ҳамагӣ ЯК видео мешавад — экрани аввал.
> Ҳар се кӯшиши имрӯза ба ҳамон як видео сарф мешавад.**

Се сабаб:

1. **Veo аз кӯшиши аввал кам вақт натиҷаи корӣ медиҳад.** Чеҳраи каҷ, дасти
   панҷангушта, ҳаракати ғайритабиӣ — инҳо маъмуланд. Се кӯшиш барои як видео
   воқеъбинона аст, се видеои гуногун не.
2. **Видео сайтро вазнин мекунад.** Ҳар видео 1.5–2 МБ. Дар интернети мобилии
   Тоҷикистон панҷ видео сайтро мекушад. Як видео — ҳадди эътидол.
3. **Расмҳо арзонтаранд.** Imagen маҳдудияти хеле сусттар дорад ва 5 бахшро
   мепӯшонад. Иқтидорро ба расм сарф кун, на ба видео.

### Аз куҷо видео гирифтан — вариантҳои ройгон

Веo ягона роҳ нест. Ин хидматҳо кредити **ҳаррӯза** медиҳанд ва танҳо email
мехоҳанд, корти бонкӣ не:

| Хидмат | Ройгонӣ |
|---|---|
| Kling AI | 66 кредит ҳар 24 соат нав мешавад |
| Hailuo (MiniMax) | 200 кредити оғоз, баъд ҳаррӯза |
| Vidu | 7 рӯз бемаҳдудият, баъд ~20 дар рӯз |
| PixVerse, Luma, Seedance | кредити ҳаррӯза |

Ҳамаро дар як рӯз истифода бар: Veo + Kling + Hailuo → 6–8 кӯшиш дар як рӯз.

**Шартҳо зуд иваз мешаванд — рақамҳоро дар сайти худашон тафтиш кун.**

### Роҳи ройгони бе AI — видеои омода

Агар ҳамаи кӯшишҳо барбод раванд, як роҳи боэътимоди охирин ҳаст: видеои
омодаи ройгон. Ин **видеои воқеӣ** аст, аз камераи ҳақиқӣ, аз ин рӯ ҳеҷ гоҳ
чеҳраи каҷ ё ларзиш надорад. Дар ду дақиқа тайёр:

- `pexels.com/videos` — ройгон, барои тиҷорат иҷозат, зикри муаллиф лозим нест
- `pixabay.com/videos` — ҳамин тавр

Калимаҳои ҷустуҷӯ: `school corridor`, `empty classroom morning light`,
`sunlight hallway dust particles`, `light through window floor`

Камбудӣ: дар бойгонӣ чеҳраи тоҷик нест ва панҷ дари ранга низ нест. Аз ин рӯ
он на ҷои A-ро мегирад, на ҷои C-ро — вале аз набудани видео беҳтар аст.

### Тартиби рӯзи аввал

| Навбат | Кор |
|---|---|
| 1 | **Вариант C** (панҷ дари нур). Хатари кам, маънои зиёд |
| 2 | **Вариант A** (духтари тоҷик). Агар хуб барояд, аз C қавитар аст |
| 3 | Агар ҳарду бад шаванд — **B**, баъд **D** |
| захира | Агар ҳама барбод равад — видеои омода аз Pexels |

Чаро C аввал, на A: C қариб ҳамеша тоза мебарояд, пас ту то охири рӯз бе видео
намемонӣ. A хатари бештар дорад, вале мукофоти бештар — аз ин рӯ дуюм.

**Чӣ тавр «бад»-ро мефаҳмӣ:** видеоро дар экрани пурра бубин. Агар чеҳра каҷ
шавад, ангуштҳо нодуруст бошанд, ё ҳаракат «ларзон» бошад — партофта, ба
варианти оянда гузар. Видеои бад аз набудани видео бадтар аст.

### Вариант A — одами асосӣ (аввал инро санҷ)

```
Slow cinematic dolly-in toward a Tajik teenage girl, about 17 years old,
standing alone in a bright modern school corridor in Dushanbe. Tall windows on
the right fill the frame with soft morning light. She is wearing a simple white
school blouse. She slowly lifts her head and looks ahead with quiet
determination. The camera moves forward very slowly and steadily. Shallow depth
of field, background softly blurred. Warm natural color grade, subtle film
grain. No text, no logos, no captions. 8 seconds, 24fps, first and last frame
nearly identical so the clip loops seamlessly.
```

### Вариант B — панҷ ҷои кор дар як ҳаракат

Таъсирбахштар, вале Veo метавонад ҷойҳоро омехта кунад.

```
One continuous cinematic camera move traveling forward through five different
Tajik workplaces without cutting, as if walking through connected doorways: it
starts in an engineering control room with glowing monitors, passes into a
bright office with charts on a desk, then into a sunlit classroom with a
blackboard, then past tall shelves of law books, and finally into a clean
hospital corridor. In each space one Tajik professional looks up briefly as the
camera passes. Smooth steady forward motion throughout, no cuts. Warm natural
color grade, soft daylight in every room, shallow depth of field, subtle film
grain. No text, no logos. 8 seconds, 24fps.
```

### Вариант C — панҷ дари нур (бе одам)

Инро на танҳо ҳамчун захира, балки ҳамчун варианти пурраи мустақил ҳисоб кун.

Бе чеҳра ва бе даст — аз ин рӯ AI хато карда наметавонад. Вале аз долони холӣ
хеле таъсирбахштар аст, чун маънои сайтро бевосита нишон медиҳад: **панҷ роҳ,
интихоби ту.** Панҷ ранги нур айнан ба рангҳои панҷ кластери сайт мувофиқанд.

```
Slow steady cinematic camera move gliding forward down a long quiet corridor in
a modern building, early morning, completely empty of people. Along the right
wall there are five identical doors, each one slightly ajar. From each gap a
different colored light spills out across the polished concrete floor: the first
teal, the second emerald green, the third violet, the fourth warm amber, the
fifth deep rose. The camera passes each door in turn at an even unhurried pace,
and each colored light sweeps across the frame as it passes. Fine dust particles
drift slowly in the light beams. Muted desaturated color grade everywhere except
the door light, deep soft shadows, shallow depth of field, subtle film grain.
No people, no text, no signage, no logos, no lens flare. 8 seconds, 24fps,
smooth constant forward motion.
```

### Вариант D — панҷ касб рӯи миз (бе одам)

Агар C-ро AI натавонад (баъзан шумораи дарҳоро омехта мекунад), инро санҷ.
Ашёи оддӣ — хатари сифр.

```
Slow overhead cinematic camera move drifting sideways across a long dark walnut
table in soft morning window light. Five small groups of objects are arranged in
a row, evenly spaced: a green circuit board beside a steel caliper; a leather
ledger beside a brass calculator; an open book beside a fountain pen; a wooden
gavel beside a folded document tied with string; a stethoscope beside a small
glass vial. The camera glides smoothly from the first group to the last, keeping
the objects sharp while the background stays soft. Muted desaturated color
grade, warm highlights, deep shadows, shallow depth of field, subtle film grain.
No hands, no people, no text, no logos. 8 seconds, 24fps.
```

**Файл:** `hero.mp4` (танҳо як файл, беҳтарин аз ҳамаи кӯшишҳо)

### Чаро C ва D аз долони холӣ беҳтаранд

Принсипи корӣ: **ба AI ашё ва нур бидеҳ, на чеҳра ва даст.**

Чеҳра ва даст ҷойҳоеанд, ки AI бештар мешиканад — ангушти зиёдатӣ, чашми каҷ,
дандони нодуруст. Ашё (дар, миз, китоб, асбоб) ва нур ҳамеша тоза мебароянд, ва
дар айни замон метавонанд маъно дошта бошанд. Долони холӣ бехатар буд, вале
ҳеҷ чиз намегуфт.

### Талаботи техникӣ ба видео

Инро ҳатман риоя кун, вагарна сайт суст мешавад:

| Параметр | Қимат |
|---|---|
| Андоза | 1280×720 (1080p лозим нест) |
| Вазн | **на бештар аз 2 МБ** |
| Формат | mp4 (H.264) ва плюс webm агар мумкин |
| Овоз | нест — тамоман бароварда шавад |
| Давомнокӣ | 8–10 сония, ҳалқавӣ |

Агар файл вазнинтар барояд, бо ин фармон фишурда мешавад:

```bash
ffmpeg -i hero-raw.mp4 -an -vf "scale=1280:-2" -c:v libx264 -crf 30 -preset slow hero.mp4
```

`-an` овозро мебарорад. `-crf 30` вазнро кам мекунад; агар сифат бад шавад,
рақамро ба 26 паст кун.

---

## ҚИСМИ 3 — РАСМИ OG (барои Telegram ва шабакаҳо)

Вақте касе истиноди сайтро мефиристад, ҳамин расм намоён мешавад.

```
A clean flat editorial poster composition on a deep charcoal background. In the
center-left, five vertical colored bars of equal width in teal, emerald, purple,
amber and rose, arranged side by side like a chart. Generous empty space on the
right side for text to be added later. Minimal, geometric, no people, no text,
no logos. Sharp and modern.

Aspect ratio 1200x630 pixels.
```

**Файл:** `og-image.jpg` → дар `Front/public/`

Матни болои он ман дар код илова мекунам, на дар расм.

---

## ҚИСМИ 4 — ЧӢ КОР НАКУНӢ

Инҳо натиҷаро вайрон мекунанд:

- **Матн дар дохили расм.** Ҳеҷ гоҳ. Матнро ман дар код мемонам, вагарна
  тарҷума ба русӣ ва англисӣ кор намекунад.
- **Логотип ё аломати обӣ.** Дар промт «no logos, no watermarks» ҳаст, вале
  натиҷаро тафтиш кун.
- **Расмҳои аз ҳад равшан ва серранг.** Онҳо бо дизайн намезананд. Агар Gemini
  расми хеле серрангро дод, дубора бо калимаи `muted desaturated` бисоз.
- **Файли PNG.** Барои акс ҳамеша `jpg` ё `webp`. PNG барои акс 10 маротиба
  вазнинтар мешавад. (Мо аллакай як бор аз ин зарар дидем: чор расми PNG 32 МБ
  вазн доштанд.)
- **Расми аз 3000px васеътар.** Барои веб лозим нест.

---

## БАЪД АЗ ГИРИФТАНИ ФАЙЛҲО

Файлҳоро ба `Front/src/images/` гузор ва ба ман бигӯ. Ман:

1. `node Front/scripts/optimize-images.mjs` иҷро мекунам — расмҳо ба webp
   табдил меёбанд ва андозаашон барои телефон ва компютер сохта мешавад
2. Ба ҳар кластер расми худашро васл мекунам
3. Видеоро ба экрани аввал бо `poster` ва ғайрифаъол дар реҷаи
   `prefers-reduced-motion` мегузорам
