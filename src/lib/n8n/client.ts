/**
 * N8N Workflow Client
 * Handles communication with N8N webhook triggers for automated ad operations
 */

export interface WorkflowTriggerOptions {
    workflowId: string; // The specific webhook path/ID in N8N
    payload: Record<string, any>;
    apiKey?: string;
}

export interface ExecutionResult {
    success: boolean;
    executionId?: string;
    error?: string;
}

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.your-domain.com/webhook';
const N8N_API_KEY_HEADER = 'X-N8N-API-KEY';

export async function triggerWorkflow(options: WorkflowTriggerOptions): Promise<ExecutionResult> {
    const { workflowId, payload, apiKey } = options;

    // Construct URL - usually N8N webhooks are like /webhook/stats-workflow
    const url = `${N8N_BASE_URL}/${workflowId}`;

    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Add auth if provided or global env var exists
        const token = apiKey || process.env.N8N_API_KEY;
        if (token) {
            headers[N8N_API_KEY_HEADER] = token;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ...payload,
                timestamp: new Date().toISOString(),
                source: 'escalate_ai_platform',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`N8N responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json().catch(() => ({}));

        return {
            success: true,
            executionId: data.executionId || 'queued', // Webhooks might not return execution ID immediately depending on config
        };

    } catch (error) {
        console.error(`Failed to trigger workflow ${workflowId}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Triggers a specific recommendation execution workflow
 */
export async function executeRecommendationWorkflow(
    recommendationId: string,
    type: string,
    params: Record<string, any>
): Promise<ExecutionResult> {
    // Map internal types to N8N webhook slugs
    // In production, this map should probably come from the DB or config
    const WORKFLOW_MAP: Record<string, string> = {
        'budget_shift': 'ops-budget-shift',
        'pause': 'ops-pause-campaign',
        'scale': 'ops-scale-campaign',
        'creative_swap': 'ops-creative-swap',
        'bid_adjust': 'ops-bid-adjust',
        'default': 'ops-catch-all'
    };

    const webhookSlug = WORKFLOW_MAP[type] || WORKFLOW_MAP['default'];

    return triggerWorkflow({
        workflowId: webhookSlug,
        payload: {
            recommendationId,
            actionType: type,
            parameters: params,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`,
        }
    });
}
