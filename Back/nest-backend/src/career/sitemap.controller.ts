import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Career } from './career.entity';
import { University } from '../university/university.entity';

/** Ҳамон суроғае, ки дар мета-маълумоти frontend истифода мешавад. */
const ORIGIN = process.env.PUBLIC_ORIGIN || 'https://ikhtisosiman.qobus.tj';

/** Саҳифаҳое, ки `id` надоранд ва ҳамеша дар ҷои худанд. */
const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/careers', priority: '0.9', changefreq: 'weekly' },
    { path: '/universities', priority: '0.9', changefreq: 'weekly' },
    { path: '/about', priority: '0.5', changefreq: 'monthly' },
];

const escapeXml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

/**
 * Харитаи сайт барои Google.
 *
 * Сайт як саҳифаи JavaScript аст: бе ин рӯйхат Google ҳеҷ гоҳ намедонад, ки
 * дар зери он 884 саҳифаи ихтисос ва 128 саҳифаи донишгоҳ ҳаст — ҳеҷ пайванди
 * оддии HTML ба онҳо намебарад.
 *
 * Динамикӣ аст, на файли омода: ҳангоми илова шудани ихтисоси нав он худаш ба
 * рӯйхат меафтад ва касе набояд чизе аз нав созад.
 */
@ApiExcludeController()
@Controller('sitemap.xml')
export class SitemapController {
    constructor(
        @InjectRepository(Career)
        private readonly careerRepository: Repository<Career>,
        @InjectRepository(University)
        private readonly universityRepository: Repository<University>,
    ) { }

    @Get()
    @Header('Content-Type', 'application/xml; charset=utf-8')
    /* Google харитаро зуд-зуд намегирад; кэши як соата дархостҳои беҳударо
       мебандад ва барои ихтисоси нав ҳам дер нест. */
    @Header('Cache-Control', 'public, max-age=3600')
    async getSitemap(): Promise<string> {
        const [careers, universities] = await Promise.all([
            /* Career сутуни updatedAt надорад — барои он lastmod санаи имрӯз
               мешавад. Ин танҳо ишора аст, на даъвои қатъӣ. */
            this.careerRepository.find({ select: ['id'] }),
            this.universityRepository.find({ select: ['id', 'updatedAt'] }),
        ]);

        const today = new Date().toISOString().slice(0, 10);

        const entry = (
            path: string,
            priority: string,
            changefreq: string,
            lastmod: string,
        ) =>
            `  <url>\n` +
            `    <loc>${escapeXml(ORIGIN + path)}</loc>\n` +
            `    <lastmod>${lastmod}</lastmod>\n` +
            `    <changefreq>${changefreq}</changefreq>\n` +
            `    <priority>${priority}</priority>\n` +
            `  </url>`;

        const urls = [
            ...STATIC_PAGES.map((page) =>
                entry(page.path, page.priority, page.changefreq, today),
            ),
            ...careers.map((career) => entry(`/info/${career.id}`, '0.8', 'monthly', today)),
            ...universities.map((university) =>
                entry(
                    `/universities/${university.id}`,
                    '0.7',
                    'monthly',
                    university.updatedAt
                        ? new Date(university.updatedAt).toISOString().slice(0, 10)
                        : today,
                ),
            ),
        ];

        return (
            `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            urls.join('\n') +
            `\n</urlset>\n`
        );
    }
}
