/**
 * AI Provider Router
 * Unified interface for multiple AI providers (GPT, Claude, Gemini, Flux)
 * Routes requests to appropriate provider based on task type
 */

// =============================================================================
// PROVIDER CONFIGURATION
// =============================================================================

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'flux';

export interface ProviderConfig {
    apiKey: string;
    model: string;
    baseUrl: string;
}

// Provider configurations from environment
const PROVIDERS: Record<AIProvider, () => ProviderConfig | null> = {
    openai: () => process.env.OPENAI_API_KEY ? {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        baseUrl: 'https://api.openai.com/v1',
    } : null,

    anthropic: () => process.env.ANTHROPIC_API_KEY ? {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
        baseUrl: 'https://api.anthropic.com/v1',
    } : null,

    gemini: () => process.env.GEMINI_API_KEY ? {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-pro',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    } : null,

    flux: () => process.env.FLUX_API_KEY ? {
        apiKey: process.env.FLUX_API_KEY,
        model: 'flux-dev',
        baseUrl: process.env.FLUX_API_URL || 'https://api.replicate.com/v1',
    } : null,
};

// Task-to-provider routing
export type AITask =
    | 'reasoning'      // Main analysis, GPT preferred
    | 'conservative'   // Safety-focused analytics, Claude preferred
    | 'grounding'      // Fact-checking, large context, Gemini preferred
    | 'creative'       // Creative text, GPT with Claude filter
    | 'image';         // Image generation, Flux

const TASK_ROUTING: Record<AITask, AIProvider[]> = {
    reasoning: ['openai', 'anthropic', 'gemini'],
    conservative: ['anthropic', 'openai', 'gemini'],
    grounding: ['gemini', 'openai', 'anthropic'],
    creative: ['openai', 'anthropic'],
    image: ['flux'],
};

// =============================================================================
// UNIFIED AI INTERFACE
// =============================================================================

export interface AIRequest {
    task: AITask;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    images?: string[]; // For multimodal
}

export interface AIResponse {
    content: string;
    provider: AIProvider;
    model: string;
    tokensUsed?: number;
    imageUrl?: string; // For image generation
}

/**
 * Get the best available provider for a task
 */
export function getProviderForTask(task: AITask): ProviderConfig & { provider: AIProvider } | null {
    const preferredProviders = TASK_ROUTING[task];

    for (const provider of preferredProviders) {
        const config = PROVIDERS[provider]();
        if (config) {
            return { ...config, provider };
        }
    }

    return null;
}

/**
 * Call the appropriate AI provider based on task
 */
export async function callAI(request: AIRequest): Promise<AIResponse | null> {
    const providerConfig = getProviderForTask(request.task);

    if (!providerConfig) {
        console.error(`No provider available for task: ${request.task}`);
        return null;
    }

    const { provider, apiKey, model, baseUrl } = providerConfig;

    switch (provider) {
        case 'openai':
            return callOpenAI(request, apiKey, model);
        case 'anthropic':
            return callAnthropic(request, apiKey, model);
        case 'gemini':
            return callGemini(request, apiKey, model, baseUrl);
        case 'flux':
            return callFlux(request, apiKey, baseUrl);
        default:
            return null;
    }
}

// =============================================================================
// PROVIDER-SPECIFIC IMPLEMENTATIONS
// =============================================================================

async function callOpenAI(
    request: AIRequest,
    apiKey: string,
    model: string
): Promise<AIResponse | null> {
    try {
        const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }
        messages.push({ role: 'user', content: request.prompt });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.maxTokens ?? 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI error:', error);
            return null;
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || '',
            provider: 'openai',
            model,
            tokensUsed: data.usage?.total_tokens,
        };
    } catch (error) {
        console.error('OpenAI call failed:', error);
        return null;
    }
}

async function callAnthropic(
    request: AIRequest,
    apiKey: string,
    model: string
): Promise<AIResponse | null> {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: request.maxTokens ?? 2000,
                system: request.systemPrompt,
                messages: [
                    { role: 'user', content: request.prompt },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Anthropic error:', error);
            return null;
        }

        const data = await response.json();
        return {
            content: data.content[0]?.text || '',
            provider: 'anthropic',
            model,
            tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
        };
    } catch (error) {
        console.error('Anthropic call failed:', error);
        return null;
    }
}

async function callGemini(
    request: AIRequest,
    apiKey: string,
    model: string,
    baseUrl: string
): Promise<AIResponse | null> {
    try {
        const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;

        const contents = [];
        if (request.systemPrompt) {
            contents.push({
                role: 'user',
                parts: [{ text: `${request.systemPrompt}\n\n${request.prompt}` }],
            });
        } else {
            contents.push({
                role: 'user',
                parts: [{ text: request.prompt }],
            });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: request.temperature ?? 0.7,
                    maxOutputTokens: request.maxTokens ?? 2000,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Gemini error:', error);
            return null;
        }

        const data = await response.json();
        return {
            content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
            provider: 'gemini',
            model,
            tokensUsed: data.usageMetadata?.totalTokenCount,
        };
    } catch (error) {
        console.error('Gemini call failed:', error);
        return null;
    }
}

async function callFlux(
    request: AIRequest,
    apiKey: string,
    baseUrl: string
): Promise<AIResponse | null> {
    try {
        // Flux via Replicate API
        const response = await fetch(`${baseUrl}/predictions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${apiKey}`,
            },
            body: JSON.stringify({
                version: 'black-forest-labs/flux-dev',
                input: {
                    prompt: request.prompt,
                    num_outputs: 1,
                    aspect_ratio: '1:1',
                    output_format: 'webp',
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Flux error:', error);
            return null;
        }

        const data = await response.json();

        // Poll for result
        let prediction = data;
        while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const pollResponse = await fetch(prediction.urls.get, {
                headers: { 'Authorization': `Token ${apiKey}` },
            });
            prediction = await pollResponse.json();
        }

        if (prediction.status === 'failed') {
            console.error('Flux generation failed:', prediction.error);
            return null;
        }

        return {
            content: '',
            provider: 'flux',
            model: 'flux-dev',
            imageUrl: prediction.output?.[0],
        };
    } catch (error) {
        console.error('Flux call failed:', error);
        return null;
    }
}

// =============================================================================
// HIGH-LEVEL TASK FUNCTIONS
// =============================================================================

/**
 * Analyze data with reasoning (GPT preferred)
 */
export async function analyzeWithReasoning(
    prompt: string,
    systemPrompt?: string
): Promise<string | null> {
    const response = await callAI({
        task: 'reasoning',
        prompt,
        systemPrompt,
        temperature: 0.5,
    });
    return response?.content || null;
}

/**
 * Conservative analysis for safety-critical decisions (Claude preferred)
 */
export async function analyzeConservative(
    prompt: string,
    systemPrompt?: string
): Promise<string | null> {
    const response = await callAI({
        task: 'conservative',
        prompt,
        systemPrompt,
        temperature: 0.3,
    });
    return response?.content || null;
}

/**
 * Ground facts with large context (Gemini preferred)
 */
export async function groundFacts(
    prompt: string,
    context: string
): Promise<string | null> {
    const response = await callAI({
        task: 'grounding',
        prompt: `${context}\n\n---\n\n${prompt}`,
        temperature: 0.2,
    });
    return response?.content || null;
}

/**
 * Generate creative content (GPT with optional Claude filter)
 */
export async function generateCreative(
    prompt: string,
    applyFilter: boolean = false
): Promise<string | null> {
    const creative = await callAI({
        task: 'creative',
        prompt,
        temperature: 0.8,
    });

    if (!creative?.content || !applyFilter) {
        return creative?.content || null;
    }

    // Apply Claude as precision filter
    const anthropicConfig = PROVIDERS.anthropic();
    if (!anthropicConfig) {
        return creative.content;
    }

    const filtered = await callAnthropic({
        task: 'conservative',
        prompt: `Review and refine this creative content for accuracy and brand safety. Keep the creative essence but fix any issues:\n\n${creative.content}`,
        systemPrompt: 'You are a brand safety and quality filter. Preserve creativity while ensuring accuracy.',
        temperature: 0.3,
    }, anthropicConfig.apiKey, anthropicConfig.model);

    return filtered?.content || creative.content;
}

/**
 * Generate image (Flux)
 */
export async function generateImage(prompt: string): Promise<string | null> {
    const response = await callAI({
        task: 'image',
        prompt,
    });
    return response?.imageUrl || null;
}
