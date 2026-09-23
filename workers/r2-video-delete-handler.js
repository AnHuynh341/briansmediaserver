/*
 * W41IT R2 video DELETE handler
 *
 * The deployed w41it-video-r2 Worker is not stored in this GitHub repository.
 * Integrate handleVideoR2DeleteOptions()/handleVideoR2Delete() into that Worker
 * before its normal GET/object-serving path:
 *
 *   if (request.method === 'OPTIONS') {
 *       return handleVideoR2DeleteOptions(request, env);
 *   }
 *   if (request.method === 'DELETE') {
 *       return handleVideoR2Delete(request, env);
 *   }
 *
 * Required R2 binding:
 *   VIDEO_BUCKET -> R2 bucket "w41it-video"
 *
 * Optional variable:
 *   W41IT_ALLOWED_ORIGINS -> comma-separated browser origins allowed to call DELETE.
 */

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6a0878e40013d0103042';
const APPWRITE_ADMIN_USER_ID = '6a74abd00005cc027457';

const DEFAULT_ALLOWED_ORIGINS = [
    'https://anhuynh341.github.io'
];

const VIDEO_EXTENSIONS = new Set([
    '.mp4',
    '.m4v',
    '.webm',
    '.mov',
    '.mkv',
    '.avi'
]);

function allowedOrigins(env) {
    return String(
        env.W41IT_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(',')
    )
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
}

function deleteCorsHeaders(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = allowedOrigins(env);
    const headers = {
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '600',
        Vary: 'Origin'
    };

    if (allowed.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    return headers;
}

function jsonResponse(body, status, request, env) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...deleteCorsHeaders(request, env)
        }
    });
}

async function verifyVideoDeleteAdmin(request) {
    const authorization = request.headers.get('Authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return {
            ok: false,
            response: new Response('Missing admin authorization.', { status: 401 })
        };
    }

    const response = await fetch(
        APPWRITE_ENDPOINT + '/account',
        {
            method: 'GET',
            headers: {
                'X-Appwrite-Project': APPWRITE_PROJECT_ID,
                'X-Appwrite-JWT': match[1]
            }
        }
    );

    if (!response.ok) {
        return {
            ok: false,
            response: new Response('Invalid or expired admin session.', { status: 401 })
        };
    }

    const user = await response.json();
    if (user?.$id !== APPWRITE_ADMIN_USER_ID || user?.emailVerification !== true) {
        return {
            ok: false,
            response: new Response('Administrator permission required.', { status: 403 })
        };
    }

    return { ok: true, user };
}

function r2KeyFromDeleteRequest(request) {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url).pathname);
    } catch (_error) {
        return null;
    }

    const key = pathname.replace(/^\/+/, '');
    const parts = key.split('/');
    const extension = key.slice(key.lastIndexOf('.')).toLowerCase();

    if (
        !key
        || (parts[0] !== 'anime' && parts[0] !== 'youtube')
        || parts.some(part => part === '.' || part === '..')
        || !VIDEO_EXTENSIONS.has(extension)
    ) {
        return null;
    }

    return key;
}

export function handleVideoR2DeleteOptions(request, env) {
    return new Response(null, {
        status: 204,
        headers: deleteCorsHeaders(request, env)
    });
}

export async function handleVideoR2Delete(request, env) {
    if (request.method !== 'DELETE') {
        return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
    }

    const origin = request.headers.get('Origin') || '';
    if (!allowedOrigins(env).includes(origin)) {
        return jsonResponse({ error: 'Origin not allowed.' }, 403, request, env);
    }

    const auth = await verifyVideoDeleteAdmin(request);
    if (!auth.ok) {
        const headers = new Headers(auth.response.headers);
        Object.entries(deleteCorsHeaders(request, env)).forEach(([key, value]) => {
            headers.set(key, value);
        });
        return new Response(await auth.response.text(), {
            status: auth.response.status,
            headers
        });
    }

    const key = r2KeyFromDeleteRequest(request);
    if (!key) {
        return jsonResponse({ error: 'Invalid R2 video object path.' }, 400, request, env);
    }

    const bucket = env.VIDEO_BUCKET || env.W41IT_VIDEO || env.R2_BUCKET || env.MY_BUCKET;
    if (!bucket) {
        return jsonResponse(
            { error: 'R2 video bucket binding is not configured.' },
            500,
            request,
            env
        );
    }

    try {
        await bucket.delete(key);
        return new Response(null, {
            status: 204,
            headers: deleteCorsHeaders(request, env)
        });
    } catch (error) {
        console.error('R2 video delete failed', {
            key,
            error: String(error)
        });
        return jsonResponse({ error: 'R2 deletion failed.' }, 502, request, env);
    }
}
