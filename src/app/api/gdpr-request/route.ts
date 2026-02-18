import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const email = formData.get('email');
        const type = formData.get('type');
        const reason = formData.get('reason');

        if (!email || !type) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log(`[GDPR Request] Type: ${type}, Email: ${email}, Reason: ${reason}`);

        // Here you would typically:
        // 1. Save request to database
        // 2. Send email notification to admin
        // 3. Send confirmation email to user

        return NextResponse.json({ success: true, message: 'Request received' });
    } catch (error) {
        console.error('GDPR request error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
