const savedState = localStorage.getItem('visualizerState');
let userWantsVisualizer = localStorage.getItem('visState') === null
    ? true
    : localStorage.getItem('visState') === 'true';
let userWantsUIGlow = localStorage.getItem('glowState') === null
    ? true
    : localStorage.getItem('glowState') === 'true';
let userWantsLaunchpad = localStorage.getItem('padState') === null
    ? true
    : localStorage.getItem('padState') === 'true';

// Restore playback-mode preferences.
isShuffle = localStorage.getItem('shuffleEnabled') === 'true';

const savedRepeatMode = Number.parseInt(
    localStorage.getItem('repeatMode') || '0',
    10
);

repeatMode = [0, 1, 2].includes(savedRepeatMode)
    ? savedRepeatMode
    : 0;

let audioCtx, analyser, dataArray;
let isVisualizerRunning = false;
let colorHue = 0;
let lastBeatTime = 0;
let currentPadIndex = 0;

let snowCtx, canvasW, canvasH;
let particles = [];
const MAX_PARTICLES = 200;

// ==========================================
// SHUFFLE STATE
// ==========================================
// The queue contains unplayed track IDs for the current shuffle cycle.
// History allows Previous to behave sensibly while shuffled.
let shuffleQueue = [];
let shuffleHistory = [];
let shuffleHistoryIndex = -1;
let shuffleScopeKey = '';

function getCurrentTrack() {
    return allTracks[currentTrackIndex] || null;
}

function getCurrentTrackId() {
    return getCurrentTrack()?.id || null;
}

function getPlayableTrackIds() {
    return currentPlaylistTracks
        .map(track => track?.id)
        .filter(Boolean);
}

function getShuffleScopeKey() {
    return getPlayableTrackIds().join('|');
}

function shuffleArray(values) {
    const result = [...values];

    for (let index = result.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[randomIndex]] = [
            result[randomIndex],
            result[index]
        ];
    }

    return result;
}

function resetShuffleState(startingTrackId = null) {
    const playableIds = getPlayableTrackIds();
    const startingTrackIsPlayable = startingTrackId
        && playableIds.includes(startingTrackId);

    shuffleScopeKey = playableIds.join('|');
    shuffleHistory = startingTrackIsPlayable ? [startingTrackId] : [];
    shuffleHistoryIndex = startingTrackIsPlayable ? 0 : -1;

    shuffleQueue = shuffleArray(
        playableIds.filter(trackId => trackId !== startingTrackId)
    );
}

function clearShuffleState() {
    shuffleQueue = [];
    shuffleHistory = [];
    shuffleHistoryIndex = -1;
    shuffleScopeKey = '';
}

function ensureShuffleState() {
    const currentScopeKey = getShuffleScopeKey();

    if (shuffleScopeKey !== currentScopeKey) {
        resetShuffleState(getCurrentTrackId());
    }
}

function registerDirectShuffleSelection(trackId) {
    // Clicking a track starts a fresh shuffled session from that track.
    resetShuffleState(trackId);
}

function getNextShuffleTrackId() {
    ensureShuffleState();

    // If Previous was used, Next first walks forward through existing history.
    if (shuffleHistoryIndex < shuffleHistory.length - 1) {
        shuffleHistoryIndex += 1;
        return shuffleHistory[shuffleHistoryIndex];
    }

    if (shuffleQueue.length === 0) {
        if (repeatMode !== 1) return null;

        const playableIds = getPlayableTrackIds();
        const currentTrackId = getCurrentTrackId();

        // Repeat-all with a one-track playlist simply plays it again.
        if (playableIds.length === 1) {
            return playableIds[0];
        }

        shuffleQueue = shuffleArray(
            playableIds.filter(trackId => trackId !== currentTrackId)
        );
    }

    const nextTrackId = shuffleQueue.shift() || null;

    if (!nextTrackId) return null;

    // If the user previously moved backward, discard that abandoned branch.
    shuffleHistory = shuffleHistory.slice(0, shuffleHistoryIndex + 1);
    shuffleHistory.push(nextTrackId);
    shuffleHistoryIndex = shuffleHistory.length - 1;

    return nextTrackId;
}

function getPreviousShuffleTrackId() {
    ensureShuffleState();

    if (shuffleHistoryIndex <= 0) return null;

    shuffleHistoryIndex -= 1;
    return shuffleHistory[shuffleHistoryIndex];
}

function findAllTracksIndex(trackId) {
    return allTracks.findIndex(track => track.id === trackId);
}

function updatePlaybackModeButtons() {
    const shuffleButton = document.getElementById('shuffleBtn');
    const repeatButton = document.getElementById('repeatBtn');

    if (shuffleButton) {
        shuffleButton.classList.toggle('active', isShuffle);
        shuffleButton.setAttribute('aria-pressed', String(isShuffle));
        shuffleButton.title = isShuffle ? 'Shuffle: On' : 'Shuffle: Off';
    }

    if (!repeatButton) return;

    repeatButton.classList.toggle('active', repeatMode !== 0);
    repeatButton.removeAttribute('data-repeat-one');

    if (repeatMode === 0) {
        repeatButton.title = 'Repeat: Off';
        repeatButton.setAttribute('aria-label', 'Repeat off');
    } else if (repeatMode === 1) {
        repeatButton.title = 'Repeat: All tracks';
        repeatButton.setAttribute('aria-label', 'Repeat all tracks');
    } else {
        repeatButton.title = 'Repeat: Current track';
        repeatButton.setAttribute('aria-label', 'Repeat current track');
        repeatButton.setAttribute('data-repeat-one', 'true');
    }
}

function markPlaybackStopped() {
    if (playIcon) playIcon.className = 'fas fa-play';
}

// ==========================================
// 1. TRACK LOADING
// ==========================================
async function loadTrack(i, autoplay = false, navigationSource = 'direct') {
    if (i < 0 || i >= allTracks.length) return false;

    currentTrackIndex = i;
    const track = allTracks[i];

    if (isShuffle && navigationSource === 'direct') {
        registerDirectShuffleSelection(track.id);
    }

    const titleElement = document.getElementById('npTitle');
    const artistElement = document.getElementById('npArtist');

    if (titleElement) titleElement.innerText = 'Loading...';
    if (artistElement) artistElement.innerText = track.artist || 'Unknown Artist';

    try {
        const response = await fetch(track.file, {
            method: 'GET',
            mode: 'cors',
            headers: {
                Accept: 'audio/mpeg,audio/mp3,audio/flac,*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (audio.src && audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
        }

        audio.src = blobUrl;

        if (titleElement) titleElement.innerText = track.name;
        if (artistElement) artistElement.innerText = track.artist || 'Unknown Artist';

        const coverArtElement = document.getElementById('npCover');
        if (coverArtElement) coverArtElement.src = track.cover;

        if (typeof renderTrackList === 'function') renderTrackList();

        if (autoplay) {
            try {
                await audio.play();
                if (playIcon) playIcon.className = 'fas fa-pause';

                if (userWantsVisualizer) {
                    setupVisualizer();
                    startVisualizer();
                }
            } catch (playError) {
                console.warn('Play prevented:', playError);
                markPlaybackStopped();
            }
        } else {
            markPlaybackStopped();
        }

        return true;
    } catch (error) {
        console.error('Failed to load track through fetch:', error);

        if (titleElement) titleElement.innerText = track.name;
        if (artistElement) artistElement.innerText = track.artist || 'Unknown Artist';

        // Fallback for servers that allow media playback but not fetch/CORS.
        audio.src = track.file;

        if (autoplay) {
            try {
                await audio.play();
                if (playIcon) playIcon.className = 'fas fa-pause';
            } catch (playError) {
                console.warn('Fallback playback failed:', playError);
                markPlaybackStopped();
            }
        } else {
            markPlaybackStopped();
        }

        return true;
    }
}

// ==========================================
// 2. PLAYBACK CONTROLS
// ==========================================
async function togglePlay() {
    if (!audio.src) return;

    setupVisualizer();

    if (audio.paused) {
        try {
            await audio.play();
            if (playIcon) playIcon.className = 'fas fa-pause';
            if (userWantsVisualizer) startVisualizer();
        } catch (error) {
            console.warn('Play prevented:', error);
            markPlaybackStopped();
        }
    } else {
        audio.pause();
        markPlaybackStopped();
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    localStorage.setItem('shuffleEnabled', String(isShuffle));

    if (isShuffle) {
        resetShuffleState(getCurrentTrackId());
    } else {
        clearShuffleState();
    }

    updatePlaybackModeButtons();
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    localStorage.setItem('repeatMode', String(repeatMode));
    updatePlaybackModeButtons();
}

async function nextTrack(isAutoAdvance = false) {
    if (currentPlaylistTracks.length === 0) {
        markPlaybackStopped();
        return false;
    }

    // Repeat-one applies only when the track finishes naturally.
    // Pressing Next still skips to another track.
    if (repeatMode === 2 && isAutoAdvance) {
        audio.currentTime = 0;

        try {
            await audio.play();
            if (playIcon) playIcon.className = 'fas fa-pause';
            return true;
        } catch (error) {
            console.warn('Could not repeat current track:', error);
            markPlaybackStopped();
            return false;
        }
    }

    if (isShuffle) {
        const nextTrackId = getNextShuffleTrackId();

        if (!nextTrackId) {
            markPlaybackStopped();
            return false;
        }

        const originalIndex = findAllTracksIndex(nextTrackId);
        if (originalIndex === -1) return false;

        return loadTrack(originalIndex, true, 'shuffle-next');
    }

    const currentTrackId = getCurrentTrackId();
    const currentIndexInPlaylist = currentPlaylistTracks.findIndex(
        track => track.id === currentTrackId
    );

    let nextIndex = currentIndexInPlaylist + 1;

    // If the playing track is outside the newly selected view,
    // start from the first track in that view.
    if (currentIndexInPlaylist === -1) nextIndex = 0;

    if (nextIndex >= currentPlaylistTracks.length) {
        if (repeatMode === 1) {
            nextIndex = 0;
        } else {
            markPlaybackStopped();
            return false;
        }
    }

    const originalIndex = findAllTracksIndex(
        currentPlaylistTracks[nextIndex].id
    );

    if (originalIndex === -1) return false;

    return loadTrack(originalIndex, true, 'sequential-next');
}

async function prevTrack() {
    if (!audio.src || currentPlaylistTracks.length === 0) return false;

    // Standard player behavior: after a few seconds, Previous restarts
    // the current song instead of changing tracks.
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return true;
    }

    if (isShuffle) {
        const previousTrackId = getPreviousShuffleTrackId();

        if (!previousTrackId) {
            audio.currentTime = 0;
            return false;
        }

        const originalIndex = findAllTracksIndex(previousTrackId);
        if (originalIndex === -1) return false;

        return loadTrack(originalIndex, true, 'shuffle-previous');
    }

    const currentTrackId = getCurrentTrackId();
    const currentIndexInPlaylist = currentPlaylistTracks.findIndex(
        track => track.id === currentTrackId
    );

    if (currentIndexInPlaylist === -1) {
        const firstTrackIndex = findAllTracksIndex(currentPlaylistTracks[0].id);
        if (firstTrackIndex === -1) return false;
        return loadTrack(firstTrackIndex, true, 'sequential-previous');
    }

    let previousIndex = currentIndexInPlaylist - 1;

    if (previousIndex < 0) {
        if (repeatMode === 1) {
            previousIndex = currentPlaylistTracks.length - 1;
        } else {
            audio.currentTime = 0;
            return false;
        }
    }

    const originalIndex = findAllTracksIndex(
        currentPlaylistTracks[previousIndex].id
    );

    if (originalIndex === -1) return false;

    return loadTrack(originalIndex, true, 'sequential-previous');
}

// ==========================================
// 3. TIMELINE & VOLUME
// ==========================================
audio.addEventListener('ended', async () => {
    const advanced = await nextTrack(true);
    if (!advanced) markPlaybackStopped();
});

audio.addEventListener('play', () => {
    if (playIcon) playIcon.className = 'fas fa-pause';
});

audio.addEventListener('pause', () => {
    if (!audio.ended) markPlaybackStopped();
});

audio.addEventListener('loadedmetadata', () => {
    const totalTimeElement = document.getElementById('totalTime');
    if (totalTimeElement) totalTimeElement.innerText = formatTime(audio.duration);
});

seekbar.addEventListener('input', () => {
    isSeeking = true;

    if (audio.duration) {
        document.getElementById('currentTime').innerText = formatTime(
            (seekbar.value / 100) * audio.duration
        );
    }
});

seekbar.addEventListener('change', () => {
    if (audio.duration) {
        audio.currentTime = (seekbar.value / 100) * audio.duration;
    }

    isSeeking = false;
});

audio.addEventListener('timeupdate', () => {
    if (audio.duration && !isSeeking) {
        seekbar.value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('currentTime').innerText = formatTime(
            audio.currentTime
        );
    }
});

volumebar.addEventListener('input', () => {
    audio.volume = volumebar.value / 100;
    localStorage.setItem('userVolume', String(audio.volume));
});

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// ==========================================
// 4. VISUALIZER (Placeholders kept as supplied)
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

// ==========================================
// 6. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const visualizerInput = document.getElementById('visualizerToggleInput');
    const glowInput = document.getElementById('uiGlowToggleInput');
    const launchpadInput = document.getElementById('launchpadToggleInput');

    if (visualizerInput) visualizerInput.checked = userWantsVisualizer;
    if (glowInput) glowInput.checked = userWantsUIGlow;
    if (launchpadInput) launchpadInput.checked = userWantsLaunchpad;

    updatePlaybackModeButtons();

    if (isShuffle) {
        resetShuffleState(getCurrentTrackId());
    }
});
