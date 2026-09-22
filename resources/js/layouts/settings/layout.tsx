import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser,
    faKey,
    faPalette,
    faCog
} from '@fortawesome/free-solid-svg-icons';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: faUser,
    },
    {
        title: 'Password',
        href: '/settings/password',
        icon: faKey,
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: faPalette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <>
            {/* Added Google Font for a more modern look */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
            
            <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl mx-auto">
                    
                    {/* Sidebar */}
                    <aside className="lg:col-span-3">
                        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-6 h-full">
                            <div className="flex items-center space-x-3 mb-8">
                                <FontAwesomeIcon icon={faCog} className="text-3xl text-blue-400" />
                                <h2 className="text-2xl font-bold text-white tracking-wider">
                                    Settings
                                </h2>
                            </div>
                            <nav className="flex flex-col space-y-3">
                                {sidebarNavItems.map((item, index) => {
                                    const isActive = currentPath === item.href;
                                    return (
                                        <Link
                                            key={`${item.href}-${index}`}
                                            href={item.href}
                                            className={`
                                                flex items-center px-4 py-3 rounded-xl transition-all duration-300 ease-in-out
                                                group relative
                                                ${isActive
                                                    ? 'bg-blue-500/20 text-white shadow-lg'
                                                    : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
                                                }
                                            `}
                                        >
                                            {isActive && (
                                                <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full animate-glow"></span>
                                            )}
                                            {item.icon && (
                                                <FontAwesomeIcon 
                                                    icon={item.icon} 
                                                    className={`
                                                        mr-4 w-5 h-5 transition-transform duration-300
                                                        ${isActive ? 'text-blue-300' : 'text-gray-400 group-hover:text-blue-300'}
                                                    `}
                                                />
                                            )}
                                            <span className="font-medium">{item.title}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-9">
                        <section className="bg-black/20 backdrop-blur-lg border border-gray-700/60 rounded-2xl shadow-2xl p-6 sm:p-8">
                            {children}
                        </section>
                    </main>

                </div>
            </div>

            {/* CSS for glowing effect on active link */}
            <style jsx>{`
                @keyframes glow {
                    0% { box-shadow: 0 0 5px #007BFF, 0 0 10px #007BFF; }
                    50% { box-shadow: 0 0 20px #007BFF, 0 0 30px #007BFF; }
                    100% { box-shadow: 0 0 5px #007BFF, 0 0 10px #007BFF; }
                }
                .animate-glow {
                    animation: glow 1.5s infinite ease-in-out;
                }
            `}</style>
        </>
    );
}