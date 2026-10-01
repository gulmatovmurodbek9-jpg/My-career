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
        { icon: LayoutDashboard, label: t('nav.dashboard'), to: '/dashboard' },
        { icon: ClipboardCheck, label: t('nav.quiz'), to: '/quiz' },
        { icon: MessageCircle, label: t('nav.ai_advisor'), to: '/dashboard/ai-chat' },
        { icon: Scale, label: t('nav.compare'), to: '/dashboard/compare' },
        { icon: FileCheck, label: t('nav.plan'), to: '/dashboard/plan' },
        { icon: Bookmark, label: t('nav.favorites'), to: '/favorites' },
        ...(user?.role === 'admin'
            ? [{ icon: ShieldCheck, label: t('nav.admin', 'Панели админ'), to: '/admin' }]
            : []),
    ];

    return (
        <aside className="w-full md:w-20 lg:w-64 xl:w-72 md:h-[calc(100vh-136px)] md:sticky md:top-[112px] mb-2 md:mb-0 flex md:flex-col sidebar-glass rounded-[1.5rem] p-2 md:p-4 lg:p-5 xl:p-6 overflow-x-auto md:overflow-y-auto shrink-0">
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
    );
};

export default DashboardSidebar;
