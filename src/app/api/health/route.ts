import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Server is running successfully'
    });
}

export const dynamic = 'force-dynamic';
