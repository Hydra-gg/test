'use client';

import { formatDistanceToNow } from 'date-fns';
import { Users, MoreHorizontal, Edit, Trash, ExternalLink } from 'lucide-react';

interface Audience {
    id: string;
    name: string;
    platform: string;
    type: string;
    targeting_spec: any;
    size_estimate?: number;
    created_at: string;
}

interface AudienceListProps {
    audiences: Audience[];
}

export function AudienceList({ audiences }: AudienceListProps) {
    if (audiences.length === 0) {
        return (
            <div className="text-center py-12 bg-[#111111] border border-[#ffffff10] rounded-xl">
                <div className="w-12 h-12 bg-[#ffffff05] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white">No Audiences Saved</h3>
                <p className="text-gray-400 mt-2 max-w-sm mx-auto">
                    Use the AI Generator above to build your first audience segments.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[#111111] border border-[#ffffff10] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ffffff10] flex justify-between items-center">
                <h3 className="font-semibold text-white">Saved Audiences</h3>
                <span className="text-xs text-gray-400 px-2 py-1 rounded bg-[#ffffff05]">
                    {audiences.length} Total
                </span>
            </div>

            <div className="divide-y divide-[#ffffff05]">
                {audiences.map((audience) => (
                    <div key={audience.id} className="p-6 hover:bg-[#ffffff02] transition-colors group">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${audience.platform === 'meta' ? 'bg-blue-500/10 text-blue-400' :
                                            audience.platform === 'google' ? 'bg-red-500/10 text-red-400' :
                                                'bg-blue-700/10 text-blue-300' // LinkedIn
                                        }`}>
                                        <Users className="w-4 h-4" />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-white">{audience.name}</h4>
                                        <span className="text-xs px-1.5 py-0.5 rounded border border-[#ffffff10] text-gray-400 capitalize">
                                            {audience.platform}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-400 mb-3 flex items-center gap-3">
                                        <span>Created {formatDistanceToNow(new Date(audience.created_at))} ago</span>
                                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                        <span>{audience.type === 'ai_generated' ? 'AI Generated' : 'Manual'}</span>
                                    </div>

                                    {/* Targeting Preview */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {audience.targeting_spec?.interests?.slice(0, 5).map((tag: string, i: number) => (
                                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-[#ffffff05] text-gray-300 border border-[#ffffff10]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 rounded-lg hover:bg-[#ffffff10] text-gray-400 hover:text-white transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-[#ffffff10] text-gray-400 hover:text-white transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
