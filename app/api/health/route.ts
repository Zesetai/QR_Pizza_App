export async function GET() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ADMIN_PASSCODE',
    'APP_ENV',
  ];
  const missing = required.filter(k => !process.env[k as keyof NodeJS.ProcessEnv]);

  return new Response(
    JSON.stringify({
      ok: missing.length === 0,
      env: process.env.APP_ENV ?? null,
      missing,
    }),
    { headers: { 'content-type': 'application/json' }, status: missing.length ? 500 : 200 }
  );
}
