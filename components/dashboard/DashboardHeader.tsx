import Link from 'next/link';
import { User, Bell, Settings, LogOut } from 'lucide-react';
import { DateRangeProvider } from '@/contexts/DateRangeContext';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

interface DashboardHeaderProps {
    user: {
        name: string;
        email: string;
        role: string;
        avatar_url?: string;
    };
    companyName: string;
}

export function DashboardHeader({ user, companyName }: DashboardHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#ffffff10] bg-[#0A0A0A]/80 px-6 backdrop-blur-xl transition-all">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="font-bold text-white">E</span>
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">Escalate AI</span>
                </Link>
                <div className="h-6 w-px bg-[#ffffff10] mx-2" />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffffff05] border border-[#ffffff05]">
                    <span className="text-sm font-medium text-gray-200">{companyName}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium uppercase tracking-wider">
                        {user.role} Mode
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Date Picker (Client Side) */}
                <DateRangeProvider>
                    <DateRangePicker />
                </DateRangeProvider>

                <div className="h-6 w-px bg-[#ffffff10]" />
                <button className="relative p-2 rounded-full hover:bg-[#ffffff05] transition-colors text-gray-400 hover:text-white">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0A0A]" />
                </button>

                <Link href="/dashboard/settings" className="p-2 rounded-full hover:bg-[#ffffff05] transition-colors text-gray-400 hover:text-white">
                    <Settings className="w-5 h-5" />
                </Link>

                <div className="h-6 w-px bg-[#ffffff10]" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-white">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center border border-[#ffffff10]">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-gray-300" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
