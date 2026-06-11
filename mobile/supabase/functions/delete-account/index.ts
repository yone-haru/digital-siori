// アカウント削除 Edge Function
// デプロイ: supabase functions deploy delete-account
// auth.users を削除すると各テーブルの ON DELETE CASCADE でユーザーデータも全て消える。
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  }

  // 呼び出し元ユーザーを JWT から特定
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  // service role で auth ユーザーごと削除
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ストレージ（カバー画像・アバター）も掃除する
  for (const bucket of ['covers', 'avatars']) {
    const { data: files } = await admin.storage.from(bucket).list(user.id);
    if (files && files.length > 0) {
      await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
