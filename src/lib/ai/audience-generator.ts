import { callOpenAI } from './openai-client';

export interface TargetingSpec {
    interests: string[];
    behaviors: string[];
    demographics: {
        ageRange?: string; // e.g. "25-45"
        gender?: 'all' | 'male' | 'female';
        locations?: string[];
        languages?: string[];
    };
    keywords?: string[]; // search terms
}

export interface GeneratedAudience {
    name: string;
    description: string;
    platform: 'meta' | 'google' | 'linkedin';
    confidence: number;
    targeting: TargetingSpec;
}

const SYSTEM_PROMPT = `You are an expert digital marketing strategist specializing in audience segmentation.
Your goal is to translate broad customer descriptions into precise targeting specifications for ad platforms (Meta, Google, LinkedIn).
Output strictly JSON.`;

/**
 * Generate audience segments based on a natural language description
 */
export async function generateAudienceSegments(
    description: string,
    platform: 'meta' | 'google' | 'linkedin' = 'meta'
): Promise<GeneratedAudience[]> {
    const prompt = `
    Analyze the following customer persona/description and generate 3 distinct audience segments for ${platform} Ads.
    
    Description: "${description}"
    
    For each segment provide:
    1. A catchy marketing name
    2. A brief rationale
    3. Specific targeting options available on ${platform} (Interests for Meta, Keywords/Topics for Google, Job Titles/Industries for LinkedIn).
    
    Return a JSON object with a key "segments" containing an array of objects matching this structure:
    {
        "name": "string",
        "description": "string",
        "confidence": number (0-1),
        "targeting": {
            "interests": ["string"],
            "behaviors": ["string"],
            "demographics": {
                "ageRange": "string",
                "gender": "all" | "male" | "female",
                "locations": ["string"]
            },
            "keywords": ["string"] 
        }
    }
    `;

    try {
        const response = await callOpenAI(prompt, SYSTEM_PROMPT, 0.7);

        if (!response || !response.content) return [];

        const result = JSON.parse(response.content);

        // Normalize platform specific fields if needed
        return result.segments.map((s: any) => ({
            ...s,
            platform,
            targeting: {
                ...s.targeting,
                // Ensure defaults
                demographics: {
                    gender: 'all',
                    locations: ['United States'], // Default to US if unspecified
                    ...s.targeting.demographics
                }
            }
        }));

    } catch (error) {
        console.error('Error generating audiences:', error);
        return [];
    }
}
