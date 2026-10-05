import 'reflect-metadata';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { ClusterController } from './cluster/cluster.controller';
import { CareerController } from './career/career.controller';
import { UsersController } from './users/users.controller';
import { QuizController } from './quiz/quiz.controller';
import { AuthController } from './auth/auth.controller';
import { VoiceController } from './voice/voice.controller';
import { UniversityController } from './university/university.controller';
import { TrialController } from './trial/trial.controller';
import { ROLES_KEY } from './auth/decorators/roles.decorator';
import { AppointmentModule } from './appointment/appointment.module';

// Ҳар эндпоинте, ки маълумотро тағйир медиҳад (POST/PUT/PATCH/DELETE), бояд guard дошта
// бошад — ба ғайр аз рӯйхати ошкоро ҷамъиятӣ дар поён (бо сабаб). Ҳамин тест хатои
// «кластерҳо бе ҳимоя»-ро (даври 2-и журӣ) мегирифт.
const CONTROLLERS = [ClusterController, CareerController, UsersController, QuizController, AuthController, VoiceController, UniversityController, TrialController];

const PUBLIC: Record<string, string> = {
    'POST /auth/login': 'вуруд',
    'POST /auth/register': 'бақайдгирӣ',
    'POST /auth/verify-email': 'тасдиқи почта (код)',
    'POST /auth/resend-code': 'коди нав (лимит дорад)',
    'POST /auth/google': 'вуруд бо Google',
    'POST /auth/forgot-password': 'барқарорсозӣ (лимит дорад)',
    'POST /auth/reset-password': 'барқарорсозӣ (код)',
    'POST /careers/ai-search': 'ҷустуҷӯ, лимити IP',
    'POST /careers/assistant': 'ёвари овозӣ, лимити IP',
    'POST /careers/match': 'ҳисоби мувофиқат, чизе наменависад',
    'POST /quiz/feedback': 'баҳо ба супориши худ (як бор)',
    'POST /quiz/ntc-choice': 'интихоби ММТ барои супориши худ (як бор)',
    'POST /quiz/progress': 'воронка, бе маълумоти шахсӣ',
    'POST /quiz/score': 'ҳисоби хол, чизе наменависад',
    'POST /quiz/interpret': 'ҷавоби озод, лимити IP',
    'POST /quiz/submit': 'тест бе вуруд',
    'POST /trial/:family/check': 'санҷиши як вазифа, чизе наменависад',
    'POST /trial/:family/finish': 'натиҷаи «Як рӯз дар ихтисос», бе маълумоти шахсӣ',
    'POST /voice/debug': 'танҳо бо VOICE_DEBUG=1',
    'POST /voice/stt': 'аз сайти мо + лимити IP',
    'POST /voice/test-worker': 'танҳо TTS_WORKER_TEST=1 ва localhost',
    'POST /voice/speak': 'аз сайти мо + навбат',
};

const routes = () => {
    const list: Array<{ key: string; guarded: boolean; roles: string[] | undefined }> = [];
    for (const controller of CONTROLLERS) {
        const base = String(Reflect.getMetadata(PATH_METADATA, controller) || '');
        const classGuards = Reflect.getMetadata(GUARDS_METADATA, controller) || [];
        for (const name of Object.getOwnPropertyNames(controller.prototype)) {
            const handler = controller.prototype[name];
            if (typeof handler !== 'function' || name === 'constructor') continue;
            const method = Reflect.getMetadata(METHOD_METADATA, handler);
            if (method === undefined) continue;
            const path = String(Reflect.getMetadata(PATH_METADATA, handler) ?? '');
            const verb = RequestMethod[method];
            const key = `${verb} /${[base, path].filter((p) => p && p !== '/').join('/').replace(/\/+/g, '/').replace(/^\//, '')}`;
            const guards = [...classGuards, ...(Reflect.getMetadata(GUARDS_METADATA, handler) || [])];
            list.push({ key, guarded: guards.length > 0, roles: Reflect.getMetadata(ROLES_KEY, handler) });
        }
    }
    return list;
};

describe('Амният: ҳар эндпоинти тағйирдиҳанда ҳимоя дорад', () => {
    const mutating = routes().filter((route) => /^(POST|PUT|PATCH|DELETE) /.test(route.key));

    it('рӯйхат холӣ нест (тест худаш кор мекунад)', () => {
        expect(mutating.length).toBeGreaterThan(20);
    });

    it.each(mutating.map((route) => [route.key, route]))('%s', (key, route: any) => {
        if (PUBLIC[key as string]) return;
        expect(route.guarded).toBe(true);
    });

    it('тағйири кластерҳо танҳо барои админ', () => {
        for (const route of mutating.filter((r) => r.key.includes('/clusters'))) {
            expect(route.guarded).toBe(true);
            expect(route.roles).toEqual(['admin']);
        }
    });

    it('рӯйхати мутахассисон ҷамъиятӣ нест', () => {
        const route = routes().find((r) => r.key === 'GET /users/specialists');
        expect(route?.guarded).toBe(true);
    });

    it('натиҷаҳои «Як рӯз дар ихтисос» танҳо барои админ', () => {
        const route = routes().find((r) => r.key === 'GET /trial/stats');
        expect(route?.guarded).toBe(true);
        expect(route?.roles).toEqual(['admin']);
    });

    it('машваратҳо (функсияи хомӯш) эндпоинт надоранд', () => {
        expect(Reflect.getMetadata('controllers', AppointmentModule)).toEqual([]);
    });
});
