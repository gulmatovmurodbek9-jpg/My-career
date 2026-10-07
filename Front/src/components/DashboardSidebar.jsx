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
    const { t } = useTranslation();
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
    const mobile = (
        <nav aria-label={t('nav.dashboard')} className={`md:hidden ${home ? 'mb-3' : 'mb-2 -mx-4 px-4 overflow-x-auto overscroll-x-contain'}`}>
            <div className={home ? 'grid grid-cols-3 gap-2.5' : 'flex gap-2 pb-1 snap-x'}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-current={isActive ? 'page' : undefined}
                            className={`snap-start flex flex-col items-center justify-center text-center rounded-2xl border transition-all active:scale-95 ${home ? 'gap-2 px-1.5 py-3.5' : 'w-[76px] shrink-0 gap-1.5 px-1 py-2.5'} ${isActive ? 'border-primary/40 bg-primary/10 shadow-sm' : 'border-border bg-card shadow-sm'}`}
                        >
                            <span className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-md ${home ? 'h-11 w-11' : 'h-9 w-9'}`}>
                                <item.icon className={home ? 'h-5 w-5' : 'h-[18px] w-[18px]'} aria-hidden />
                            </span>
                            <span className={`font-bold leading-tight line-clamp-2 ${home ? 'text-[12px]' : 'text-[10.5px]'} ${isActive ? 'text-primary' : 'text-foreground'}`}>{item.label}</span>
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
