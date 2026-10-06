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
