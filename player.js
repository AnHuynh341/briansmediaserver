// ==========================================
// AUDIO ENGINE + VISUALIZER
// ==========================================

const savedState = localStorage.getItem('visualizerState');
let userWantsVisualizer = localStorage.getItem('visState') === null ? true : (localStorage.getItem('visState') === 'true');
let userWantsUIGlow = localStorage.getItem('glowState') === null ? true : (localStorage.getItem('glowState') === 'true');
let userWantsLaunchpad = localStorage.getItem('padState') === null ? true : (localStorage.getItem('padState') === 'true');

let audioCtx, analyser, dataArray;
let isVisualizerRunning = false;
let colorHue = 0;
let lastBeatTime = 0;
let currentPadIndex = 0;

let snowCtx, canvasW, canvasH;
let particles = [];
const MAX_PARTICLES = 200;

// ==========================================
// 1. TRACK LOADING (Improved with better CORS handling)
// ==========================================
async function loadTrack(i, autoplay = false) {
    if (i < 0 || i >= allTracks.length) return;
    
    currentTrackIndex = i;
    const track = allTracks[i];

    document.getElementById('npTitle').innerText = 'Loading...';
    document.getElementById('npArtist').innerText = track.artist;

    try {
        // Try fetch first (better error handling + CORS)
        const response = await fetch(track.file, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'audio/mpeg,audio/mp3,*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Clean up old blob URL
        if (audio.src && audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
        }

        audio.src = blobUrl;

        // Update UI
        document.getElementById('npTitle').innerText = track.name;
        document.getElementById('npArtist').innerText = track.artist;

        const coverArtEl = document.getElementById('npCover');
        if (coverArtEl) coverArtEl.src = track.cover;

        renderTrackList();

        if (autoplay) {
            await audio.play().catch(e => console.warn("Play prevented:", e));
            playIcon.className = 'fas fa-pause';
            if (userWantsVisualizer) {
                setupVisualizer();
                startVisualizer();
            }
        } else {
            playIcon.className = 'fas fa-play';
        }

    } catch (e) {
        console.error('Failed to load track:', e);
        document.getElementById('npTitle').innerText = track.name;

        // Fallback: Direct assignment
        audio.src = track.file;

        if (autoplay) {
            audio.play().catch(() => {});
            playIcon.className = 'fas fa-pause';
        }
    }
}

// ==========================================
// 2. PLAYBACK CONTROLS
// ==========================================
function togglePlay() {
    if (!audio.src) return;
    setupVisualizer();

    if (audio.paused) {
        audio.play();
        playIcon.className = 'fas fa-pause';
        if (userWantsVisualizer) startVisualizer();
    } else {
        audio.pause();
        playIcon.className = 'fas fa-play';
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    const btn = document.getElementById('shuffleBtn');
    if (isShuffle) btn.classList.add('active');
    else btn.classList.remove('active');
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const btn = document.getElementById('repeatBtn');
    const icon = btn.querySelector('i');
    
    btn.classList.remove('active');
    btn.removeAttribute('data-repeat-one');

    if (repeatMode === 1) {
        btn.classList.add('active');
        icon.className = 'fas fa-redo-alt';
    } else if (repeatMode === 2) {
        btn.classList.add('active');
        icon.className = 'fas fa-redo-alt';
        btn.setAttribute('data-repeat-one', 'true');
    }
}

function nextTrack(isAutoAdvance = false) {
    if (repeatMode === 2 && isAutoAdvance) {
        audio.currentTime = 0;
        audio.play();
        return;
    }

    const currentIndexInPlaylist = currentPlaylistTracks.findIndex(t => t.id === allTracks[currentTrackIndex]?.id);
    let nextIndex = currentIndexInPlaylist + 1;

    if (nextIndex >= currentPlaylistTracks.length) {
        if (repeatMode === 1) nextIndex = 0;
        else return;
    }

    const originalIndex = allTracks.findIndex(t => t.id === currentPlaylistTracks[nextIndex].id);
    loadTrack(originalIndex, true);
}

function prevTrack() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }
    const currentIndexInPlaylist = currentPlaylistTracks.findIndex(t => t.id === allTracks[currentTrackIndex]?.id);
    const prevIndex = (currentIndexInPlaylist - 1 + currentPlaylistTracks.length) % currentPlaylistTracks.length;
    
    const originalIndex = allTracks.findIndex(t => t.id === currentPlaylistTracks[prevIndex].id);
    loadTrack(originalIndex, true);
}

// ==========================================
// 3. TIMELINE & VOLUME
// ==========================================
audio.addEventListener('ended', () => nextTrack(true));
audio.addEventListener('loadedmetadata', () => {
    document.getElementById('totalTime').innerText = formatTime(audio.duration);
});

seekbar.addEventListener('input', () => {
    isSeeking = true;
    if (audio.duration) {
        document.getElementById('currentTime').innerText = formatTime((seekbar.value / 100) * audio.duration);
    }
});

seekbar.addEventListener('change', () => {
    if (audio.duration) audio.currentTime = (seekbar.value / 100) * audio.duration;
    isSeeking = false;
});

audio.addEventListener('timeupdate', () => {
    if (audio.duration && !isSeeking) {
        seekbar.value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('currentTime').innerText = formatTime(audio.currentTime);
    }
});

volumebar.addEventListener('input', () => {
    audio.volume = volumebar.value / 100;
    localStorage.setItem('userVolume', audio.volume);
});

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ==========================================
// 4. VISUALIZER (Unchanged - kept compact)
// ==========================================
function setupVisualizer() { /* ... keep your original setupVisualizer ... */ }
function startVisualizer() { /* ... keep your original ... */ }
function renderFrame() { /* ... keep your original ... */ }
function drawParticles(currentHue, overallAverage) { /* ... keep your original ... */ }
function triggerDynamicLaunchpad(bassStrength) { /* ... keep your original ... */ }

// ==========================================
// 5. TOGGLES
// ==========================================
function toggleVisualizerMode() { /* ... your original ... */ }
function toggleUIGlowMode() { /* ... your original ... */ }
function toggleLaunchpadMode() { /* ... your original ... */ }

// Init
document.addEventListener('DOMContentLoaded', () => {
    const visInput = document.getElementById('visualizerToggleInput');
    const glowInput = document.getElementById('uiGlowToggleInput');
    const padInput = document.getElementById('launchpadToggleInput');
    
    if (visInput) visInput.checked = userWantsVisualizer;
    if (glowInput) glowInput.checked = userWantsUIGlow;
    if (padInput) padInput.checked = userWantsLaunchpad;
});
