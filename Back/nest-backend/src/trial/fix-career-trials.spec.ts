import { fixText } from './fix-career-trials';

describe('fixText (ислоҳи механикӣ)', () => {
    it('ҳарфи лотинии ҳамшаклро дар дохили калимаи кириллӣ иваз мекунад', () => {
        expect(fixText('Подключение стабилитронoв', 'ru')).toBe('Подключение стабилитронов');
    });
    it('ихтисораи лотиниро бо пасванди тоҷикӣ намерасонад', () => {
        expect(fixText('Таймерҳо дар PLCҳо', 'tj')).toBe('Таймерҳо дар PLCҳо');
    });
    it('ҳарфҳои тоҷикиро дар номҳои англисӣ ба лотинӣ мегардонад', () => {
        expect(fixText('A client from Vaҳdat and Dustӣ district', 'en')).toBe('A client from Vahdat and Dusti district');
    });
    it('Markdown ва фосилаҳои дукарата', () => {
        expect(fixText('Данные:\n*   Прибыль: 50\n- Срок: 3', 'ru')).toBe('Данные:\n• Прибыль: 50\n• Срок: 3');
        expect(fixText('бактерия *Salmonella spp.* дар тухм', 'tj')).toBe('бактерия Salmonella spp. дар тухм');
        expect(fixText('2 * 3 = 6  ва  тамом', 'tj')).toBe('2 * 3 = 6 ва тамом');
    });
});

describe('fixText: такрор ва ҳарфҳои омехта', () => {
    it('калимаи такрориро нест мекунад, такрори таъкидиро не', () => {
        expect(fixText('Бинобар ин ин вазифа дар дар хона аст', 'tj')).toBe('Бинобар ин, ин вазифа дар хона аст');
        expect(fixText('из точки В в точку А', 'ru')).toBe('из точки В в точку А');
        expect(fixText('барои қарорҳои муҳим муҳим аст', 'tj')).toBe('барои қарорҳои муҳим муҳим аст');
        expect(fixText('Хонаҳои калон калон', 'tj')).toBe('Хонаҳои калон калон');
        expect(fixText('Check and and confirm', 'en')).toBe('Check and confirm');
    });
    it('ҳарфҳои омехтаро ислоҳ мекунад', () => {
        expect(fixText('Дарzмол ва VТ', 'tj')).toBe('Дарзмол ва VT');
        expect(fixText('Guldaст and Oriyоn shops', 'en')).toBe('Guldast and Oriyon shops');
        expect(fixText('Таймерҳо дар PLCҳо ва APIҳо', 'tj')).toBe('Таймерҳо дар PLCҳо ва APIҳо');
    });
});

describe('fixText: нохунакҳо', () => {
    it('нохунаки дохилиро мепӯшонад', () => {
        expect(fixText('Сатр бо «Корти бонкӣ «Наврӯз»', 'tj')).toBe('Сатр бо «Корти бонкӣ „Наврӯз“»');
        expect(fixText('Он мегӯяд: «Ин тарҳ хуб аст.', 'tj')).toBe('Он мегӯяд: «Ин тарҳ хуб аст».');
        expect(fixText('«Дуруст» ва «нодуруст»', 'tj')).toBe('«Дуруст» ва «нодуруст»');
    });
});
