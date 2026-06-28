import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const realmId = url.searchParams.get('realmId');

    // Hardcoded for testing (match your .env.local)
    const clientId = process.env.QUICKBOOKS_CLIENT_ID || '';
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || '';
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

    // Verify state (CSRF)
    const storedState = cookies().get('qb_oauth_state')?.value;
    if (!code || !state || state !== storedState) {
      return NextResponse.json({ error: 'Invalid state or missing code' }, { status: 400 });
    }

    // Exchange the code for tokens using fetch (like curl)
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await response.json();

    // Store token in an httpOnly cookie
    const payload = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      realmId: realmId || 'unknown',
      expires_in: tokenData.expires_in,
      created_at: Date.now(),
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');

    cookies().set('qb_token', encoded, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    cookies().delete('qb_oauth_state');

    // Redirect to home page
    return NextResponse.redirect(new URL('/', req.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}