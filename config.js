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

// ---- Playback State ----
let allTracks = [];
let currentPlaylistTracks = [];
let currentTrackIndex = 0;
let currentViewPlaylistIndex = -1;
let isShuffle = false;
let repeatMode = 0; // 0: Off, 1: Repeat All, 2: Repeat One
let userPlaylists = [];
let isSeeking = false;

// ---- User Session State ----
let currentUser = null;
let currentUserRole = null;
let currentUserId = null;

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

// Load the live Appwrite video catalog only after the regular video player code
// has created its fallback arrays/functions. If Appwrite is unavailable, the
// embedded video.js catalog stays in place and the site keeps working.
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('script[data-w41it-video-catalog]')) return;

    const script = document.createElement('script');
    script.src = 'video-catalog.js?v=appwrite-catalog-20260817-1';
    script.dataset.w41itVideoCatalog = 'true';
    script.async = false;
    document.body.appendChild(script);
});
