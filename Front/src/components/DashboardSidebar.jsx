import React from 'react';
import { Link, useLocation } from 'react-router';
import {
    LayoutDashboard,
    ClipboardCheck,
    MessageCircle,
    Scale,
    FileCheck,
    Bookmark,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

const DashboardSidebar = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const { user } = useAuthStore();

    const menuItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard'), to: '/dashboard', tone: 'from-blue-500 to-indigo-600' },
        { icon: ClipboardCheck, label: t('nav.quiz'), to: '/quiz', tone: 'from-emerald-500 to-teal-600' },
        { icon: MessageCircle, label: t('nav.ai_advisor'), to: '/dashboard/ai-chat', tone: 'from-violet-500 to-purple-600' },
        { icon: Scale, label: t('nav.compare'), to: '/dashboard/compare', tone: 'from-amber-500 to-orange-600' },
        { icon: FileCheck, label: t('nav.plan'), to: '/dashboard/plan', tone: 'from-sky-500 to-cyan-600' },
        { icon: Bookmark, label: t('nav.favorites'), to: '/favorites', tone: 'from-rose-500 to-pink-600' },
        ...(user?.role === 'admin'
            ? [{ icon: ShieldCheck, label: t('nav.admin', 'Панели админ'), to: '/admin', tone: 'from-slate-500 to-slate-700' }]
            : []),
    ];

    // Телефон: плиткаҳои ранга (мисли барнома). Дар саҳифаи асосии «Панел» — тӯри калон;
    // дар саҳифаҳои дохилӣ — ҳамон плиткаҳо хурд ва дар як сатр, то ҷойи кам гиранд.
    const home = location.pathname === '/dashboard';
    // Номҳои кӯтоҳ барои сатри саҳифаҳои дохилӣ — ҳама дар як сатр ҷой мегиранд, бе лағжиш.
    const lang = String(i18n.language || 'tj').slice(0, 2);
    const SHORT = {
        tj: { '/dashboard': 'Панел', '/quiz': 'Санҷиш', '/dashboard/ai-chat': 'AI', '/dashboard/compare': 'Муқоиса', '/dashboard/plan': 'Нақша', '/favorites': 'Захира', '/admin': 'Админ' },
        ru: { '/dashboard': 'Кабинет', '/quiz': 'Тест', '/dashboard/ai-chat': 'AI', '/dashboard/compare': 'Сравнить', '/dashboard/plan': 'План', '/favorites': 'Сохран.', '/admin': 'Админ' },
        en: { '/dashboard': 'Home', '/quiz': 'Test', '/dashboard/ai-chat': 'AI', '/dashboard/compare': 'Compare', '/dashboard/plan': 'Plan', '/favorites': 'Saved', '/admin': 'Admin' },
    }[lang] || {};
    const mobile = (
        <nav aria-label={t('nav.dashboard')} className={`md:hidden ${home ? 'mb-3' : 'mb-3'}`}>
            <div
                className={home ? 'grid grid-cols-3 gap-2.5' : 'grid gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm'}
                style={home ? undefined : { gridTemplateColumns: `repeat(${menuItems.length}, minmax(0, 1fr))` }}
            >
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-current={isActive ? 'page' : undefined}
                            title={item.label}
                            className={`flex min-w-0 flex-col items-center justify-center text-center transition-all active:scale-95 ${home
                                ? `gap-2 rounded-2xl border px-1.5 py-3.5 shadow-sm ${isActive ? 'border-primary/40 bg-primary/10' : 'border-border bg-card'}`
                                : `gap-1 rounded-xl px-0.5 py-2 ${isActive ? 'bg-primary/10' : ''}`}`}
                        >
                            <span className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-md ${home ? 'h-11 w-11' : `h-9 w-9 ${isActive ? 'ring-2 ring-primary/40 ring-offset-1 ring-offset-card' : ''}`}`}>
                                <item.icon className={home ? 'h-5 w-5' : 'h-[18px] w-[18px]'} aria-hidden />
                            </span>
                            <span className={`w-full font-bold leading-tight ${home ? 'text-[12px] line-clamp-2' : 'truncate text-[10px]'} ${isActive ? 'text-primary' : home ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {home ? item.label : (SHORT[item.to] || item.label)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );

    return (
        <>
        {mobile}
        <aside className="hidden md:flex w-full md:w-20 lg:w-64 xl:w-72 md:h-[calc(100vh-136px)] md:sticky md:top-[112px] mb-2 md:mb-0 md:flex-col sidebar-glass rounded-[1.5rem] p-2 md:p-4 lg:p-5 xl:p-6 md:overflow-y-auto shrink-0">
            <div className="flex md:flex-col flex-1 gap-2 md:gap-2">
                {menuItems.map((item, idx) => {
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={idx}
                            to={item.to}
                            aria-current={isActive ? 'page' : undefined}
                            title={item.label}
                            className={`group flex min-w-fit items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? 'text-primary' : ''}`} />
                            <span className="font-bold text-xs md:hidden lg:block tracking-tight whitespace-nowrap">{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="ml-auto hidden lg:block"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </motion.div>
                            )}
                        </Link>
                    );
                })}
            </div>

        </aside>
        </>
    );
};

export default DashboardSidebar;
