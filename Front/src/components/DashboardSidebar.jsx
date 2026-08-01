import React from 'react';
import { Link, useLocation } from 'react-router';
import {
    LayoutDashboard,
    BrainCircuit,
    MessageCircle,
    Settings,
    User,
    ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const DashboardSidebar = () => {
    const { t } = useTranslation();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard'), to: '/dashboard' },
        { icon: BrainCircuit, label: t('nav.quiz'), to: '/quiz' },
        { icon: MessageCircle, label: t('nav.ai_advisor'), to: '/dashboard/ai-chat' },
    ];

    return (
        <aside className="w-full md:w-20 lg:w-64 xl:w-72 md:h-[calc(100vh-136px)] md:sticky md:top-[112px] mb-2 md:mb-0 flex md:flex-col sidebar-glass rounded-[1.5rem] lg:rounded-[2rem] p-2 md:p-4 lg:p-5 xl:p-6 overflow-x-auto md:overflow-hidden shrink-0">
            <div className="flex md:flex-col flex-1 gap-2 md:gap-2">
                {menuItems.map((item, idx) => {
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={idx}
                            to={item.to}
                            className={`group flex min-w-fit items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-500 group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
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

            <div className="hidden lg:block mt-8 pt-8 border-t border-white/5 space-y-2">
                <Link
                    to="/profile"
                    className="group flex items-center gap-4 p-4 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
                >
                    <User className="w-6 h-6" />
                    <span className="font-bold text-sm tracking-tight">{t('nav.profile')}</span>
                </Link>
                <Link
                    to="/settings"
                    className="group flex items-center gap-4 p-4 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
                >
                    <Settings className="w-6 h-6" />
                    <span className="font-bold text-sm tracking-tight">{t('nav.settings')}</span>
                </Link>
            </div>
        </aside>
    );
};

export default DashboardSidebar;
