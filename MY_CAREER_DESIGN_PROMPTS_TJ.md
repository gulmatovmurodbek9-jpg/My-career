# ДАСТУРИ МУКАММАЛИ ТАРРОҲӢ ВА ДИЗАЙН-СИСТЕМАИ "MY CAREER"
## Низомномаи Рангҳо, Токенҳо ва Промтҳои Ҳирфаии AI (DALL-E, Midjourney ва Figma)

Ин ҳуҷҷат дастурамали мукаммал ва махсуси визуалӣ барои лоиҳаи **"My Career" (Карераи Ман)** мебошад. Он барои аз сари нав тарҳрезӣ кардан ё навсозии интерфейси веб ва мобилӣ бо намуди **Super-Premium, инноватсионӣ ва сатҳи ҷаҳонӣ** пешбинӣ шудааст. Шумо метавонед промтҳои ин ҳуҷҷатро барои тавлиди суратҳо дар AI ё ҳамчун дастури корӣ дар Figma ва Tailwind CSS истифода баред.

---

## БАХШИ 1: ДИЗАЙН-СИСТЕМА ВА ТОКЕНҲОИ ВИЗУАЛӢ (DESIGN SYSTEM TOKENS)

Барои сохтани интерфейси ҷозибадор ва premium, аз услуби **Glassmorphism (Темаи Шишаи Нимшаффоф)** дар якҷоягӣ бо **Dark Mode** ва эффектҳои **Neon Glow** истифода мешавад.

### 1.1. Палитраи Рангҳо (Color Palette Tokens)

| Номи ранг | Рамзи Hex | Нақш дар интерфейс | Ҳисси равонӣ |
| :--- | :--- | :--- | :--- |
| **Deep Space Navy** | `#080B11` | Заминаи умумии саҳифаҳо (Background) | Амиқӣ, устуворӣ ва ҳирфаӣ |
| **Glow Cyan (Фирӯзӣ)** | `#06B6D4` | Ранги аксентии аввалиндараҷа, тугмаҳо, пинҳои харита | Технология ва ояндасозӣ |
| **Electric Indigo** | `#6366F1` | Ранги дуюминдараҷа, графикҳо, ороиши кортҳо | Зеҳни сунъӣ ва инноватсия |
| **Neon Magenta** | `#D946EF` | Фоизи мувофиқат, холҳои баланди RIASEC, огоҳиҳо | Ҷозиба ва диққати махсус |
| **Glass Card Bg** | `rgba(15, 23, 42, 0.45)` | Заминаи кортҳо ва қуттиҳо (with backdrop blur) | Нимшаффофӣ ва замонавӣ |

---

## БАХШИ 2: МУФАССАЛТАРИН ПРОМТҲОИ AI БАРОИ ТАВЛИДИ СУРАТҲО (AI IMAGE PROMPTS)

### 2.1. Саҳифаи Асосии Веб (Landing Page Hero)
* **Ҳадаф:** Муаррифии лоиҳа бо унсури визуалии 3D барои ҷалби мактаббачагон ва волидон.
* **Промт барои AI (Midjourney/DALL-E):**
  > `A stunning Landing Page UI mockup for "My Career" website, dark mode, background color #080B11, in the center is a magnificent glowing 3D crystal-like human brain structure with bright glowing neural paths in cyan (#06B6D4) and electric purple (#6366F1) colors, sleek glassmorphism UI widgets overlaying the edges, clean modern sans-serif typography, highly polished, premium SaaS interface look, UX/UI portfolio trend, 8k resolution, photorealistic, elegant --ar 16:9`
* **Истифода дар Figma:** Ин тасвирро метавон дар маркази бахши "Hero Section" (Саҳифаи асосӣ) ҳамчун замина ё унсури визуалии 3D истифода бурд.

### 2.2. Намоиши Натиҷаҳои Санҷиши RIASEC (Radar Component)
* **Ҳадаф:** Намоиши сохтории намуди равонии корбар бо диаграммаи дурахшони 6-меҳвара.
* **Промт барои AI (Midjourney/DALL-E):**
  > `A futuristic web dashboard component showing psychology vocational quiz results, dark theme, featuring a high-tech glowing neon Radar Chart with 6 colorful axes: Realistic (Red), Investigative (Blue), Artistic (Green), Social (Yellow), Enterprising (Purple), Conventional (Cyan). Clean translucent glassmorphism container, sharp numbers, match percentage indicators, modern elegant dark data visualization UI, sleek and premium UX --ar 4:3`
* **Истифода дар Figma:** Асос барои тарҳрезии ороиши қуттии натиҷаҳо ва инфографикаҳои майдаи холҳо.

### 2.3. Чат бо Мушовири AI (AI Career Chat Interface)
* **Ҳадаф:** Интерфейси муоширати овозӣ ва матнӣ бо чат-боти роҳнамо.
* **Промт барои AI (Midjourney/DALL-E):**
  > `Futuristic AI career assistant interface design, chat messenger layout, dark mode, elegant bubble design with subtle gradient borders in indigo and cyan, at the bottom is an active colorful organic wave sound visualizer representing voice input, a high-tech robotic guide mascot avatar in the corner with a friendly glowing face, neat sidebar with search and history, premium UI design --ar 9:16`
* **Истифода дар Figma:** Дастур барои ороиши саҳифаи мобилии чати AI ва ҷойгиршавии тугмаҳои сабти овоз ва мавҷҳои аудиоӣ.

### 2.4. Харитаи Интерактивии Донишгоҳҳо (University Map)
* **Ҳадаф:** Намоиши ҷолиби харита бо нишонаҳои неони донишгоҳҳо.
* **Промт барои AI (Midjourney/DALL-E):**
  > `High-fidelity dark mode navigation map UI screen for universities location tracking, custom dark dark-blue base map, glowing neon cyan locator pins with subtle circular wave expansions, elegant floating slide-out detailed card on the right displaying university photo, active majors list, ranking, and tuition fee. Glassmorphism overlays, clean control UI --ar 16:9`
* **Истифода дар Figma:** Барои тарҳрезии унсурҳои навигатсионии харита ва тарзи ҷойгиршавии панели маълумотии рост.

---

## БАХШИ 3: УТИЛИТҲОИ CSS ВА ТАҲРИРИ TAILWIND (READY-TO-USE CODE)

Барои он ки ин дизайни супер-премиумро мустақиман ба коди худ гузаронед, танзимоти зеринро истифода баред:

### 3.1. Танзимоти `tailwind.config.js` (Мутобиқи токенҳои мо)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'space-dark': '#080B11',
        'glow-cyan': '#06B6D4',
        'electric-indigo': '#6366F1',
        'neon-magenta': '#D946EF',
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #06B6D4 0%, #6366F1 100%)',
      }
    },
  },
}
```

### 3.2. Синфҳои Махсуси CSS (Custom CSS Utilities)

```css
/* 1. Эффекти шишаи нимшаффоф бо Backdrop Blur */
.glass-panel {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.5);
}

/* 2. Чаҳорчӯбаи дурахшони неонӣ бо гузариши рангҳо */
.glowing-border {
  position: relative;
  border-radius: 16px;
  background: linear-gradient(rgba(8, 11, 17, 0.9), rgba(8, 11, 17, 0.9)) padding-box,
              linear-gradient(135deg, #06B6D4, #6366F1) border-box;
  border: 1px solid transparent;
}

/* 3. Сояи дурахшон ҳангоми гузаштани курсор (Hover Glow Glow) */
.btn-neon-glow {
  background: linear-gradient(135deg, #06B6D4 0%, #6366F1 100%);
  color: white;
  transition: all 0.3s ease;
}
.btn-neon-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(99, 102, 241, 0.3);
}

/* 4. Мавҷи овози аниматсионӣ (Voice Wave Bar Animation) */
@keyframes waveGlow {
  0%, 100% { height: 10px; }
  50% { height: 40px; }
}
.voice-wave-bar {
  width: 4px;
  background-color: #06B6D4;
  border-radius: 2px;
  animation: waveGlow 1.2s infinite ease-in-out;
}
.voice-wave-bar:nth-child(2) { animation-delay: 0.2s; }
.voice-wave-bar:nth-child(3) { animation-delay: 0.4s; }
.voice-wave-bar:nth-child(4) { animation-delay: 0.6s; }
```

---

Ин дастури дизайнии мукаммал ва аз сари нав сохташуда ба шумо кӯмак мекунад, ки лоиҳаро ба як маҳсулоти бениҳоят зебо ва рақобатпазири технологӣ табдил диҳед. Онро ба Figma ё муҳити таҳияи худ бор карда, намуди зоҳирии платформаро ба сатҳи олӣ бардоред!
