import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY!;
const AVATAR_BUCKET = process.env.CLOUDFLARE_R2_AVATAR_BUCKET || 'avatar-user-url';
const ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

const r2 = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Type invalide. Utilisez JPG, PNG, WEBP ou GIF.' }, { status: 400 });
    }

    // Limit: 500 KB
    if (file.size > 500 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 500 Ko)' }, { status: 400 });
    }

    // Always store under the same key per user (no extension) so the serve URL never changes
    const key = `avatars/${user.id}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: AVATAR_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    // Stable serve URL — served via our proxy endpoint (never expires)
    const serveUrl = `/api/user/avatar-serve?uid=${user.id}`;

    // Save to Supabase
    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: serveUrl })
      .eq('id', user.id);

    if (dbError) {
      await supabaseAdmin
        .from('users')
        .update({ avatar_url: serveUrl })
        .eq('id', user.id);
    }

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { avatar_url: serveUrl },
    });

    return NextResponse.json({ url: serveUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}


const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY!;
const AVATAR_BUCKET = process.env.CLOUDFLARE_R2_AVATAR_BUCKET || 'avatar-user-url';
const ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

const r2 = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Build the public URL for an avatar object
function avatarPublicUrl(key: string): string {
  return `${ENDPOINT}/${AVATAR_BUCKET}/${key}`;
}

export async function POST(req: NextRequest) {
  try {
    // Auth: verify user session via Authorization header (Bearer token)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WEBP or GIF.' }, { status: 400 });
    }

    // Limit size: 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const key = `avatars/${user.id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    await r2.send(new PutObjectCommand({
      Bucket: AVATAR_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      // Make the object publicly readable (requires R2 public bucket or presigned)
      // We use direct URL since bucket is configured as public
    }));

    const publicUrl = avatarPublicUrl(key);

    // Save URL to Supabase profiles table
    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (dbError) {
      // Also try the users table
      await supabaseAdmin
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
    }

    // Update auth user metadata too
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { avatar_url: publicUrl },
    });

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
