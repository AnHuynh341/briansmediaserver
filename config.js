const { Client, Databases, Storage, Account, ID, Query } = Appwrite;

const client = new Client();
client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('6a0878e40013d0103042');

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = '6a087bfc0014b3277171';
// const BUCKET_ID = '6a088144001cc411fc81';
const COLLECTION_ID = 'tracks';
const PLAYLIST_COLLECTION_ID = 'playlists';
const USERS_COLLECTION_ID = 'users';
const account = new Account(client);

const APPWRITE_ADMIN_USER_ID = '6a74abd00005cc027457';

function isVerifiedAdminAccount(user) {
    return Boolean(
        user
        && user.$id === APPWRITE_ADMIN_USER_ID
        && user.emailVerification === true
    );
}

let videoTablesDB = null;
let videoTablesAccount = null;

async function loadVideoTablesSdk() {
    if (videoTablesDB && videoTablesAccount) return;

    const existing = document.querySelector('script[data-w41it-video-tables-adapter]');
    if (existing) {
        await new Promise((resolve, reject) => {
            if (videoTablesDB && videoTablesAccount) {
                resolve();
                return;
            }
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', () => reject(new Error('Could not load TablesDB REST adapter')), { once: true });
        });
    } else {
        const script = document.createElement('script');
        script.src = 'video-tables-adapter.js?v=verified-admin-20260818-1';
        script.dataset.w41itVideoTablesAdapter = 'true';
        script.async = false;

        await new Promise((resolve, reject) => {
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', () => reject(new Error('Could not load TablesDB REST adapter')), { once: true });
            document.body.appendChild(script);
        });
    }

    if (!videoTablesDB || !videoTablesAccount) {
        throw new Error('TablesDB REST adapter loaded but did not initialize.');
    }
}

// ---- Playback State ----
let allTracks = [];
let currentPlaylistTracks = [];
let currentTrackIndex = 0;
let currentViewPlaylistIndex = -1;
let isShuffle = false;
let repeatMode = 0;
let userPlaylists = [];
let isSeeking = false;

// ---- User Session State ----
let currentUser = null;
let currentUserRole = null;
let currentUserId = null;
let currentUserAuthId = null;
let currentAuthMode = 'none';
let currentUserVerified = false;

// ---- DOM References ----
const audio = document.getElementById('audio');
const seekbar = document.getElementById('seekbar');
const volumebar = document.getElementById('volumebar');
const volumePercent = document.getElementById('volumePercent');
const playIcon = document.getElementById('playIcon');

// ---- Restore Saved Volume ----
const savedVolume = localStorage.getItem('userVolume');
if (savedVolume) {
    audio.volume = savedVolume;
    if (volumebar) volumebar.value = savedVolume * 100;
}

document.addEventListener('DOMContentLoaded', async () => {
    if (document.querySelector('script[data-w41it-video-catalog]')) return;

    try {
        await loadVideoTablesSdk();
    } catch (error) {
        console.warn('TablesDB adapter unavailable; keeping embedded video catalog.', error);
        return;
    }

    const script = document.createElement('script');
    script.src = 'video-catalog.js?v=tables-rest-catalog-20260817-2';
    script.dataset.w41itVideoCatalog = 'true';
    script.async = false;
    document.body.appendChild(script);
});

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('script[data-w41it-inline-admin]')) return;

    const script = document.createElement('script');
    script.src = 'admin-inline.js?v=verified-admin-20260818-1';
    script.dataset.w41itInlineAdmin = 'true';
    script.async = false;

    script.addEventListener('load', () => {
        if (document.querySelector('script[data-w41it-admin-polish]')) return;

        const polish = document.createElement('script');
        polish.src = 'admin-polish.js?v=admin-polish-20260818-1';
        polish.dataset.w41itAdminPolish = 'true';
        polish.async = false;

        polish.addEventListener('load', () => {
            if (document.querySelector('script[data-w41it-admin-mobile-fix]')) return;

            const mobileFix = document.createElement('script');
            mobileFix.src = 'admin-mobile-fix.js?v=admin-mobile-fix-20260818-1';
            mobileFix.dataset.w41itAdminMobileFix = 'true';
            mobileFix.async = false;
            document.body.appendChild(mobileFix);
        }, { once: true });

        document.body.appendChild(polish);
    }, { once: true });

    document.body.appendChild(script);
});

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('script[data-w41it-playlist-drag-scroll]')) return;

    const script = document.createElement('script');
    script.src = 'playlist-drag-scroll.js?v=playlist-drag-scroll-20260819-1';
    script.dataset.w41itPlaylistDragScroll = 'true';
    script.async = false;
    document.body.appendChild(script);
});

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('script[data-w41it-playlist-modal-polish]')) return;

    const script = document.createElement('script');
    script.src = 'playlist-modal-polish.js?v=playlist-modal-polish-20260819-3';
    script.dataset.w41itPlaylistModalPolish = 'true';
    script.async = false;
    document.body.appendChild(script);
});
