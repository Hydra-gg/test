'use client';

import { useRouter } from 'next/navigation';
import { AudienceBuilder } from '@/components/dashboard/audiences/AudienceBuilder';
import { AudienceList } from '@/components/dashboard/audiences/AudienceList';

interface AudienceManagerLayoutProps {
    initialAudiences: any[];
}

export function AudienceManagerLayout({ initialAudiences }: AudienceManagerLayoutProps) {
    const router = useRouter();

    const handleSaveSuccess = () => {
        router.refresh();
    };

    return (
        <div className="space-y-8">
            <AudienceBuilder onSaveSuccess={handleSaveSuccess} />
            <AudienceList audiences={initialAudiences} />
        </div>
    );
}
