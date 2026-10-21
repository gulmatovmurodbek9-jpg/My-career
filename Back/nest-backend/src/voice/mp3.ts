import { readFileSync } from 'fs';
import { join } from 'path';
import { createContext, runInContext } from 'vm';

// WAV → MP3 барои интернети суст: нутқи 16 kHz дар MP3-и 32 кбит/с ~8 маротиба хурдтар аст
// (садои 9-сонияӣ: 288 КБ → 36 КБ), сифаташ барои овоз фарқ надорад. lamejs (JS-и тоза, бе ffmpeg);
// версияи npm-и он дар Node хато дорад («MPEGMode is not defined»), бинобар ин файли тайёри
// lame.min.js дар контексти алоҳида бор мешавад.
let lame: any = null;
function encoder(): any {
    if (!lame) {
        const file = join(require.resolve('lamejs/package.json'), '..', 'lame.min.js');
        const context: any = {};
        createContext(context);
        runInContext(`${readFileSync(file, 'utf8')};this.__lame = lamejs;`, context);
        lame = context.__lame;
    }
    return lame;
}

// Сарлавҳаи WAV-ро мехонем (на ҳамеша 44 байт): формат, басомад, каналҳо ва ҷойи «data».
function readWav(wav: Buffer): { rate: number; channels: number; samples: Int16Array } | null {
    if (wav.length < 44 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') return null;
    let offset = 12;
    let rate = 16000;
    let channels = 1;
    let bits = 16;
    while (offset + 8 <= wav.length) {
        const id = wav.toString('ascii', offset, offset + 4);
        const size = wav.readUInt32LE(offset + 4);
        if (id === 'fmt ') {
            channels = wav.readUInt16LE(offset + 10);
            rate = wav.readUInt32LE(offset + 12);
            bits = wav.readUInt16LE(offset + 22);
        } else if (id === 'data') {
            if (bits !== 16) return null;
            const start = offset + 8;
            const end = Math.min(wav.length, start + size);
            const copy = wav.subarray(start, end - ((end - start) % 2));
            const samples = new Int16Array(copy.length / 2);
            for (let i = 0; i < samples.length; i += 1) samples[i] = copy.readInt16LE(i * 2);
            return { rate, channels, samples };
        }
        offset += 8 + size + (size % 2);
    }
    return null;
}

export function wavToMp3(wav: Buffer, kbps = 32): Buffer | null {
    const parsed = readWav(wav);
    if (!parsed || parsed.channels !== 1) return null;
    const lib = encoder();
    const mp3 = new lib.Mp3Encoder(1, parsed.rate, kbps);
    const parts: Buffer[] = [];
    for (let i = 0; i < parsed.samples.length; i += 1152) {
        const chunk = mp3.encodeBuffer(parsed.samples.subarray(i, i + 1152));
        if (chunk.length) parts.push(Buffer.from(chunk));
    }
    const tail = mp3.flush();
    if (tail.length) parts.push(Buffer.from(tail));
    return parts.length ? Buffer.concat(parts) : null;
}
