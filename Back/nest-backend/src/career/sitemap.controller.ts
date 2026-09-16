import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Career } from './career.entity';
import { University } from '../university/university.entity';

const ORIGIN = process.env.PUBLIC_ORIGIN || 'https://ikhtisosiman.qobus.tj';

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
    @Header('Cache-Control', 'public, max-age=3600')
    async getSitemap(): Promise<string> {
        const [careers, universities] = await Promise.all([
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
