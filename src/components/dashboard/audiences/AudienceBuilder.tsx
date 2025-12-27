'use client';

import { useState } from 'react';
import { Sparkles, Save, Check, Loader2, Target, Users } from 'lucide-react';
import type { GeneratedAudience } from '@/lib/ai/audience-generator';

interface AudienceBuilderProps {
    onSaveSuccess: () => void;
}

export function AudienceBuilder({ onSaveSuccess }: AudienceBuilderProps) {
    const [description, setDescription] = useState('');
    const [platform, setPlatform] = useState<'meta' | 'google' | 'linkedin'>('meta');
    const [loading, setLoading] = useState(false);
    const [generatedAudiences, setGeneratedAudiences] = useState<GeneratedAudience[]>([]);
    const [savingId, setSavingId] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!description.trim()) return;

        setLoading(true);
        setGeneratedAudiences([]);

        try {
            const res = await fetch('/api/ai/audiences/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, platform }),
            });

            if (!res.ok) throw new Error('Failed to generate');

            const data = await res.json();
            setGeneratedAudiences(data.audiences);
        } catch (err) {
            console.error(err);
            alert('Failed to generate audiences. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (audience: GeneratedAudience, index: number) => {
        setSavingId(index);

        try {
            const res = await fetch('/api/audiences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: audience.name,
                    platform: audience.platform,
                    type: 'ai_generated',
                    targeting_spec: audience.targeting,
                    size_estimate: 0 // Mock, would fetch from platform API ideally
                }),
            });

            if (!res.ok) throw new Error('Failed to save');

            // Remove from list or mark saved
            setGeneratedAudiences(prev => prev.filter((_, i) => i !== index));
            onSaveSuccess();

        } catch (err) {
            console.error(err);
            alert('Failed to save audience.');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#111111] border border-[#ffffff10] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">AI Audience Generator</h3>
                        <p className="text-sm text-gray-400">Describe your ideal customer, and AI will build targeting segments.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Platform</label>
                        <div className="flex gap-2">
                            {(['meta', 'google', 'linkedin'] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPlatform(p)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${platform === p
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-[#ffffff05] text-gray-400 hover:text-white hover:bg-[#ffffff10]'
                                        }`}
                                >
                                    {p} Ads
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Ideal Customer Profile</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Budget-conscious college students interested in sustainable fashion and vintage clothing..."
                            className="w-full h-32 bg-[#0A0A0A] border border-[#ffffff10] rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !description.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Target className="w-4 h-4" />
                                    Generate Segments
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            {generatedAudiences.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {generatedAudiences.map((audience, i) => (
                        <div key={i} className="bg-[#111111] border border-[#ffffff10] rounded-xl p-5 hover:border-blue-500/30 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{audience.name}</h4>
                                <div className="text-xs px-2 py-1 rounded bg-[#ffffff05] text-gray-400 border border-[#ffffff05]">
                                    {Math.round(audience.confidence * 100)}% Match
                                </div>
                            </div>

                            <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">
                                {audience.description}
                            </p>

                            <div className="space-y-3 mb-6">
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Interests</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {audience.targeting.interests.slice(0, 3).map((tag, idx) => (
                                            <span key={idx} className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                                {tag}
                                            </span>
                                        ))}
                                        {audience.targeting.interests.length > 3 && (
                                            <span className="text-xs px-1.5 py-0.5 text-gray-500">+{audience.targeting.interests.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleSave(audience, i)}
                                disabled={savingId === i}
                                className="w-full py-2 rounded-lg border border-[#ffffff10] hover:bg-[#ffffff05] text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                            >
                                {savingId === i ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save Audience
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
