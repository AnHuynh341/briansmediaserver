// ==========================================
// CONFIG.JS — Appwrite Setup & Global State
// ==========================================

const { Client, Databases, Storage, Account, ID, Query } = Appwrite;

const client = new Client();
client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('6a0878e40013d0103042');

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = '6a087bfc0014b3277171';
const BUCKET_ID = '6a088144001cc411fc81';
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
let isSeeking = false; // Fixes the timeline tug-of-war

// ---- User Session State ----
let currentUser = null;
let currentUserRole = null;
let currentUserId = null;

// ---- DOM References ----
const audio = document.getElementById('audio');
const seekbar = document.getElementById('seekbar');
const volumebar = document.getElementById('volumebar');
const playIcon = document.getElementById('playIcon');

// ---- Restore Saved Volume ----
const savedVolume = localStorage.getItem('userVolume');
if (savedVolume) {
    audio.volume = savedVolume;
    if (volumebar) volumebar.value = savedVolume * 100;
}
