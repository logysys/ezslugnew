import { Link, router } from '@inertiajs/react';
import type { User } from '@/types';

interface SidebarProps {
  auth: {
    user: User | null;
  };
  onNewSearch: () => void;
  onOpenComingSoon: (feature: string, description: string, iconColor: string, icon: JSX.Element) => void;
}

export default function Sidebar({ auth, onNewSearch, onOpenComingSoon }: SidebarProps) {
  const handleLogoClick = () => {
    router.visit('/');
  };

  const handleLogout = () => {
    router.post('/logout');
  };

  return (
    /* Changed: Width is 16 on mobile (w-16), 20 on desktop (md:w-20). Added overflow-y-auto for tall menus. */
    <aside className="fixed left-0 top-0 h-screen w-16 md:w-20 border-r border-gray-100 flex flex-col items-center py-4 md:py-8 bg-white/80 backdrop-blur-sm shadow-sm z-50 overflow-y-auto overflow-x-hidden scrollbar-hide">
      
      {/* Top section */}
      <div className="flex flex-col items-center space-y-6 md:space-y-10 w-full">
        {/* Logo - Scaled for mobile */}
        <div 
          onClick={handleLogoClick}
          className="relative group cursor-pointer"
          aria-label="Go to home page"
        >
          <div className="absolute inset-0 bg-[#22c55e]/20 rounded-2xl blur-md group-hover:bg-[#22c55e]/30 transition-all duration-300"></div>
          <img 
            src="/ezlogo.png" 
            alt="Ezbar.ai Logo" 
            className="relative w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain rounded-xl md:rounded-2xl ring-2 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        {/* Main navigation */}
        <nav className="flex flex-col items-center space-y-4 md:space-y-6 w-full px-1">
          {/* New Search */}
          <button onClick={onNewSearch} className="flex flex-col items-center group cursor-pointer w-full">
            <div className="p-2 bg-gray-50 rounded-xl group-hover:text-[#22c55e] transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-[#22c55e]">
                <path d="M12 5v14"/><path d="M5 12h14"/>
              </svg>
            </div>
            <span className="text-[8px] md:text-[10px] mt-1 font-medium text-gray-500 group-hover:text-[#22c55e] text-center">New</span>
          </button>
          
          {/* Slug Wall */}
          <Link href="/public/ai/history" className="flex flex-col items-center group w-full">
            <div className="p-2 rounded-xl bg-gray-50 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-[#22c55e]">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <span className="text-[8px] md:text-[10px] mt-1 font-medium text-gray-500 group-hover:text-[#22c55e] text-center">Slug Wall</span>
          </Link>
          
          {auth.user && (
            <>
              {/* Slug Management */}
              <Link href="/ai/history" className="flex flex-col items-center group w-full">
                <div className="p-2 rounded-xl bg-gray-50 transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-[#22c55e]">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <span className="text-[8px] md:text-[10px] mt-1 font-medium text-gray-500 group-hover:text-[#22c55e] text-center px-1 leading-tight">Slug Management</span>
              </Link>
              
              {/* Dashboard */}
              <Link href="/ai/dashboard" className="flex flex-col items-center group w-full">
                <div className="p-2 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#22c55e]">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <span className="text-[8px] md:text-[10px] mt-1 font-medium text-[#22c55e] text-center">Dashboard</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-6 md:space-y-8 mt-auto pt-6 w-full px-1">
        {auth.user ? (
          <>
            <Link href="/ai/user-settings" className="flex flex-col items-center group w-full">
              <div className="p-2 rounded-xl bg-gray-50 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-gray-600">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
              <span className="text-[8px] md:text-[10px] mt-1 font-medium text-gray-500 text-center">Settings</span>
            </Link>
            <button onClick={handleLogout} className="flex flex-col items-center group w-full">
              <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-red-50 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-red-500">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <span className="text-[8px] md:text-[10px] mt-1 font-medium text-gray-500 group-hover:text-red-500 text-center">Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="flex flex-col items-center group w-full">
              <div className="p-2 rounded-xl bg-gray-50 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-[#22c55e]">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              <span className="text-[8px] md:text-[10px] mt-1 font-medium text-gray-500 text-center">Sign In</span>
            </Link>
            <Link href="/register" className="flex flex-col items-center group w-full">
              <div className="p-2 rounded-xl bg-gray-50 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-[#22c55e]">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <span className="text-[8px] md:text-[10px] mt-1 font-medium text-gray-500 text-center">Sign Up</span>
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}