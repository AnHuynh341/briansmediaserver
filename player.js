// W41IT player visualizer and session telemetry.
// The old full-screen background/launchpad toggles were intentionally removed.

// Restore playback-mode preferences.
isShuffle = localStorage.getItem('shuffleEnabled') === 'true';

const savedRepeatMode = Number.parseInt(
    localStorage.getItem('repeatMode') || '0',
    10
);

repeatMode = [0, 1, 2].includes(savedRepeatMode)
    ? savedRepeatMode
    : 0;

// ==========================================
// PLAYER SPECTRUM STATE
// ==========================================
let audioCtx = null;
let analyser = null;
let dataArray = null;
let mediaElementSource = null;
let spectrumAnimationId = null;
let spectrumCanvas = null;
let spectrumContext = null;
let spectrumResizeObserver = null;
let lastSpectrumFrameAt = 0;
let spectrumAutoGain = 1;
let spectrumSmoothedPeak = 0.35;

// A small envelope lets the ribbon grow out of / settle back into its idle line
// instead of popping on and off. Because the target can reverse mid-transition,
// rapid Play/Pause/Next/Previous actions remain continuous rather than restarting.
let spectrumVisibility = 0;
let spectrumTargetVisibility = 0;
let spectrumTransitionFrameAt = 0;
const SPECTRUM_RISE_TAU_MS = 72;
const SPECTRUM_FALL_TAU_MS = 96;

// ==========================================
// STREAMING SOURCE STATE
// ==========================================
// Every new load receives a newer generation number. If an older play()
// promise settles later, it is ignored instead of reviving the old track.
let trackLoadGeneration = 0;

function isSupersededTrackLoad(loadGeneration) {
    return loadGeneration !== trackLoadGeneration;
}

// ==========================================
// PLAYBACK QUEUE SCOPE
// ==========================================
// Most views use currentPlaylistTracks as both the visible list and playback queue.
// Special shelves such as What's New can temporarily provide their own queue without
// replacing the visible All Songs list underneath.
let playbackQueueOverride = null;
let playbackQueueSource = 'view';

function getPlaybackQueueTracks() {
    return Array.isArray(playbackQueueOverride)
        ? playbackQueueOverride
        : currentPlaylistTracks;
}

function setPlaybackQueueOverride(tracks, source = 'custom', startingTrackId = null) {
    const requestedIds = new Set(
        (Array.isArray(tracks) ? tracks : [])
            .map(track => track?.id)
            .filter(Boolean)
    );

    playbackQueueOverride = allTracks.filter(track => requestedIds.has(track.id));

    // Preserve the caller's explicit order instead of allTracks order.
    const order = new Map(
        (Array.isArray(tracks) ? tracks : [])
            .map((track, index) => [track?.id, index])
            .filter(([trackId]) => Boolean(trackId))
    );
    playbackQueueOverride.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    playbackQueueSource = source;

    if (isShuffle) {
        resetShuffleState(startingTrackId || getCurrentTrackId());
    } else {
        clearShuffleState();
    }
}

function clearPlaybackQueueOverride() {
    const hadOverride = Array.isArray(playbackQueueOverride);
    playbackQueueOverride = null;
    playbackQueueSource = 'view';

    if (hadOverride && isShuffle) {
        resetShuffleState(getCurrentTrackId());
    }
}

// ==========================================
// SESSION TELEMETRY
// ==========================================
// "Tracks played" counts completed listening passes, not unique track IDs.
// Every pass that accumulates at least two thirds of the track's media duration
// earns +1, so a qualifying song can count again when it is replayed/looped.
// Progress is accumulated from natural media-time movement instead of currentTime
// alone, so jumping the seekbar forward does not manufacture listening progress.
const SESSION_STORAGE_KEY = 'w41it-session-telemetry-v3';
const PREVIOUS_SESSION_STORAGE_KEY = 'w41it-session-telemetry-v2';
const LEGACY_SESSION_STORAGE_KEY = 'w41it-session-telemetry-v1';
const SESSION_TRACK_QUALIFY_FRACTION = 2 / 3;
let sessionStartedListeningAt = null;
let sessionUpdateTimer = null;

// Per-playthrough state. Pausing/resuming keeps the same playthrough, while loading
// another source or starting a Repeat-One cycle begins a fresh eligible pass.
let sessionPlaythroughTrackId = null;
let sessionPlaythroughPlayedSeconds = 0;
let sessionPlaythroughLastMediaTime = null;
let sessionPlaythroughCounted = false;

function readSessionTelemetry() {
    try {
        const currentRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (currentRaw) {
            const parsed = JSON.parse(currentRaw);
            return {
                qualifiedPlayCount: Number.isFinite(Number(parsed.qualifiedPlayCount))
                    ? Math.max(0, Math.floor(Number(parsed.qualifiedPlayCount)))
                    : 0,
                listeningSeconds: Number.isFinite(Number(parsed.listeningSeconds))
                    ? Math.max(0, Number(parsed.listeningSeconds))
                    : 0
            };
        }

        const previousRaw = sessionStorage.getItem(PREVIOUS_SESSION_STORAGE_KEY);
        if (previousRaw) {
            const parsed = JSON.parse(previousRaw);
            return {
                // v2 counted each qualifying track only once. Preserve those already
                // earned counts as the starting total, then allow replays from here on.
                qualifiedPlayCount: Array.isArray(parsed.qualifiedTrackIds)
                    ? parsed.qualifiedTrackIds.length
                    : 0,
                listeningSeconds: Number.isFinite(Number(parsed.listeningSeconds))
                    ? Math.max(0, Number(parsed.listeningSeconds))
                    : 0
            };
        }

        const legacy = JSON.parse(sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY) || '{}');
        return {
            // v1 counted on playback start, so those old track counts are intentionally
            // not migrated into the stricter two-thirds metric.
            qualifiedPlayCount: 0,
            listeningSeconds: Number.isFinite(Number(legacy.listeningSeconds))
                ? Math.max(0, Number(legacy.listeningSeconds))
                : 0
        };
    } catch (error) {
        console.warn('Could not restore session telemetry:', error);
        return { qualifiedPlayCount: 0, listeningSeconds: 0 };
    }
}

const sessionTelemetry = readSessionTelemetry();
let sessionQualifiedPlayCount = sessionTelemetry.qualifiedPlayCount;
let sessionListeningSeconds = sessionTelemetry.listeningSeconds;

function persistSessionTelemetry() {
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            qualifiedPlayCount: Math.max(0, Math.floor(sessionQualifiedPlayCount)),
            listeningSeconds: Math.max(0, Math.floor(sessionListeningSeconds))
        }));
    } catch (error) {
        console.warn('Could not save session telemetry:', error);
    }
}

function getLiveSessionListeningSeconds() {
    if (sessionStartedListeningAt === null) return sessionListeningSeconds;
    return sessionListeningSeconds + ((Date.now() - sessionStartedListeningAt) / 1000);
}

function formatSessionListeningTime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    return `${minutes} min`;
}

function updateSessionInfo() {
    const trackCountElement = document.getElementById('sessionTrackCount');
    const listeningElement = document.getElementById('sessionListeningTime');
    const shuffleElement = document.getElementById('sessionShuffleState');
    const loopElement = document.getElementById('sessionLoopState');
    const liveDot = document.querySelector('.session-live-dot');

    if (trackCountElement) trackCountElement.textContent = String(sessionQualifiedPlayCount);
    if (listeningElement) listeningElement.textContent = formatSessionListeningTime(getLiveSessionListeningSeconds());
    if (shuffleElement) shuffleElement.textContent = isShuffle ? 'Active' : 'Off';

    if (loopElement) {
        loopElement.textContent = repeatMode === 1
            ? 'All'
            : repeatMode === 2
                ? 'One'
                : 'Off';
    }

    if (liveDot) liveDot.classList.toggle('active', !audio.paused && !audio.ended);
}

function resetSessionPlaythrough(trackId = getCurrentTrackId()) {
    sessionPlaythroughTrackId = trackId || null;
    sessionPlaythroughPlayedSeconds = 0;
    sessionPlaythroughLastMediaTime = null;
    sessionPlaythroughCounted = false;
}

function prepareSessionProgressAfterSeek() {
    // The next media-time sample establishes a new baseline. This prevents the
    // seek jump itself from being mistaken for seconds that were actually heard.
    sessionPlaythroughLastMediaTime = null;
}

function noteCurrentTrackPlayedIfQualified() {
    const trackId = getCurrentTrackId();
    const duration = Number(audio.duration);
    const currentMediaTime = Number(audio.currentTime);

    if (!trackId) return false;

    if (sessionPlaythroughTrackId !== trackId) {
        resetSessionPlaythrough(trackId);
    }

    if (Number.isFinite(currentMediaTime)) {
        if (
            sessionPlaythroughLastMediaTime !== null
            && !audio.seeking
            && !isSeeking
        ) {
            const mediaDelta = currentMediaTime - sessionPlaythroughLastMediaTime;

            // Positive natural movement represents media that really played. Backward
            // seeks/restarts never subtract progress; forward seek jumps are excluded
            // because seeking clears the previous baseline before this sample arrives.
            if (Number.isFinite(mediaDelta) && mediaDelta > 0) {
                sessionPlaythroughPlayedSeconds += mediaDelta;
            }
        }

        sessionPlaythroughLastMediaTime = currentMediaTime;
    }

    if (sessionPlaythroughCounted) return false;
    if (!Number.isFinite(duration) || duration <= 0) return false;

    const requiredSeconds = duration * SESSION_TRACK_QUALIFY_FRACTION;
    if (sessionPlaythroughPlayedSeconds < requiredSeconds) return false;

    sessionPlaythroughCounted = true;
    sessionQualifiedPlayCount += 1;
    persistSessionTelemetry();
    updateSessionInfo();
    return true;
}

function startSessionListeningClock() {
    if (sessionStartedListeningAt === null) {
        sessionStartedListeningAt = Date.now();
    }

    if (sessionUpdateTimer === null) {
        sessionUpdateTimer = window.setInterval(() => {
            noteCurrentTrackPlayedIfQualified();
            updateSessionInfo();
            persistSessionTelemetry();
        }, 1000);
    }

    updateSessionInfo();
}

function commitSessionListeningTime() {
    noteCurrentTrackPlayedIfQualified();

    if (sessionStartedListeningAt !== null) {
        sessionListeningSeconds += (Date.now() - sessionStartedListeningAt) / 1000;
        sessionStartedListeningAt = null;
    }

    if (sessionUpdateTimer !== null) {
        clearInterval(sessionUpdateTimer);
        sessionUpdateTimer = null;
    }

    persistSessionTelemetry();
    updateSessionInfo();
}

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
    return getPlaybackQueueTracks()
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
        shuffleButton.title = isShuffle ? 'Shuffle: On (S)' : 'Shuffle: Off (S)';
    }

    if (!repeatButton) {
        updateSessionInfo();
        return;
    }

    repeatButton.classList.toggle('active', repeatMode !== 0);
    repeatButton.removeAttribute('data-repeat-one');

    if (repeatMode === 0) {
        repeatButton.title = 'Repeat: Off (L)';
        repeatButton.setAttribute('aria-label', 'Repeat off');
    } else if (repeatMode === 1) {
        repeatButton.title = 'Repeat: All tracks (L)';
        repeatButton.setAttribute('aria-label', 'Repeat all tracks');
    } else {
        repeatButton.title = 'Repeat: Current track (L)';
        repeatButton.setAttribute('aria-label', 'Repeat current track');
        repeatButton.setAttribute('data-repeat-one', 'true');
    }

    updateSessionInfo();
}

function markPlaybackStopped() {
    if (playIcon) playIcon.className = 'fas fa-play';
    document.querySelector('.player')?.classList.remove('is-playing');
    commitSessionListeningTime();
    stopVisualizer(true);
}

// ==========================================
// 1. TRACK LOADING
// ==========================================
async function loadTrack(i, autoplay = false, navigationSource = 'direct') {
    if (i < 0 || i >= allTracks.length) return false;

    const loadGeneration = ++trackLoadGeneration;
    const track = allTracks[i];
    const displayTrackName = typeof getDisplayTrackName === 'function'
        ? getDisplayTrackName(track.name)
        : track.name;

    // Commit the previous track immediately. Replacing `src` below tells the
    // browser to abandon any pending network request for that old source.
    markPlaybackStopped();
    currentTrackIndex = i;
    resetSessionPlaythrough(track.id);

    // Create/resume the audio graph while the click gesture is still active.
    if (autoplay) setupVisualizer();

    // A normal track-row/hero selection returns playback to the currently visible
    // library/playlist/search queue. Special shelves can opt out with their own
    // navigation source after installing a queue override first.
    if (navigationSource === 'direct') {
        clearPlaybackQueueOverride();
    }

    if (isShuffle && navigationSource === 'direct') {
        registerDirectShuffleSelection(track.id);
    }

    const titleElement = document.getElementById('npTitle');
    const artistElement = document.getElementById('npArtist');

    // Show the selected track immediately instead of leaving the previous
    // title visible while the browser obtains the first playable byte range.
    if (titleElement) titleElement.innerText = displayTrackName;
    if (artistElement) artistElement.innerText = track.artist || 'Unknown Artist';

    const coverArtElements = [
        document.getElementById('npCover')
    ].filter(Boolean);

    coverArtElements.forEach(coverArtElement => {
        if (typeof setCoverImage === 'function') {
            setCoverImage(coverArtElement, track.cover, displayTrackName);
        } else {
            coverArtElement.src = track.cover || '';
        }
    });

    if (typeof renderTrackList === 'function') renderTrackList();

    // Revoke legacy Blob URLs left by older versions before moving to direct
    // media streaming. The browser can now request only the ranges it needs.
    if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
    }

    audio.crossOrigin = 'anonymous';
    audio.preload = autoplay ? 'auto' : 'metadata';
    audio.src = track.file;
    audio.load();

    // Setting a new source cancels the previous source load. The generation
    // guard below also prevents a late rejection/resolution from the previous
    // play request from changing the state of this newer track.
    if (isSupersededTrackLoad(loadGeneration)) return true;

    if (!autoplay) {
        return true;
    }

    try {
        await audio.play();

        if (isSupersededTrackLoad(loadGeneration)) return true;

        if (playIcon) playIcon.className = 'fas fa-pause';
        setupVisualizer();
        startVisualizer();
        return true;
    } catch (playError) {
        // AbortError is expected when the user presses Next/Previous or pauses
        // before buffering finishes. A newer load owns the player now.
        if (isSupersededTrackLoad(loadGeneration) || playError?.name === 'AbortError') {
            return true;
        }

        console.warn('Streaming playback failed:', playError);
        markPlaybackStopped();
        return false;
    }
}

// ==========================================
// 2. PLAYBACK CONTROLS
// ==========================================
async function togglePlay() {
    if (!audio.src) return;

    const playGeneration = trackLoadGeneration;
    setupVisualizer();

    if (audio.paused) {
        try {
            await audio.play();

            if (isSupersededTrackLoad(playGeneration)) return;

            if (playIcon) playIcon.className = 'fas fa-pause';
            startVisualizer();
        } catch (error) {
            if (isSupersededTrackLoad(playGeneration) || error?.name === 'AbortError') return;

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
    updateSessionInfo();
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    localStorage.setItem('repeatMode', String(repeatMode));
    updatePlaybackModeButtons();
    updateSessionInfo();
}

async function nextTrack(isAutoAdvance = false) {
    const playbackTracks = getPlaybackQueueTracks();

    if (playbackTracks.length === 0) {
        markPlaybackStopped();
        return false;
    }

    // Repeat-one applies only when the track finishes naturally.
    // Pressing Next still skips to another track.
    if (repeatMode === 2 && isAutoAdvance) {
        const repeatGeneration = trackLoadGeneration;
        resetSessionPlaythrough(getCurrentTrackId());
        audio.currentTime = 0;

        try {
            await audio.play();

            if (isSupersededTrackLoad(repeatGeneration)) return true;

            if (playIcon) playIcon.className = 'fas fa-pause';
            return true;
        } catch (error) {
            if (isSupersededTrackLoad(repeatGeneration) || error?.name === 'AbortError') {
                return true;
            }

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
    const currentIndexInPlaylist = playbackTracks.findIndex(
        track => track.id === currentTrackId
    );

    let nextIndex = currentIndexInPlaylist + 1;

    // If the playing track is outside the newly selected view,
    // start from the first track in that view.
    if (currentIndexInPlaylist === -1) nextIndex = 0;

    if (nextIndex >= playbackTracks.length) {
        if (repeatMode === 1) {
            nextIndex = 0;
        } else {
            markPlaybackStopped();
            return false;
        }
    }

    const originalIndex = findAllTracksIndex(
        playbackTracks[nextIndex].id
    );

    if (originalIndex === -1) return false;

    return loadTrack(originalIndex, true, 'sequential-next');
}

async function prevTrack() {
    const playbackTracks = getPlaybackQueueTracks();
    if (!audio.src || playbackTracks.length === 0) return false;

    // Standard player behavior: after a few seconds, Previous restarts
    // the current song instead of changing tracks.
    if (audio.currentTime > 3) {
        resetSessionPlaythrough(getCurrentTrackId());
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
    const currentIndexInPlaylist = playbackTracks.findIndex(
        track => track.id === currentTrackId
    );

    if (currentIndexInPlaylist === -1) {
        const firstTrackIndex = findAllTracksIndex(playbackTracks[0].id);
        if (firstTrackIndex === -1) return false;
        return loadTrack(firstTrackIndex, true, 'sequential-previous');
    }

    let previousIndex = currentIndexInPlaylist - 1;

    if (previousIndex < 0) {
        if (repeatMode === 1) {
            previousIndex = playbackTracks.length - 1;
        } else {
            audio.currentTime = 0;
            return false;
        }
    }

    const originalIndex = findAllTracksIndex(
        playbackTracks[previousIndex].id
    );

    if (originalIndex === -1) return false;

    return loadTrack(originalIndex, true, 'sequential-previous');
}

// ==========================================
// 3. TIMELINE & VOLUME
// ==========================================
function updateRangeVisual(rangeElement) {
    if (!rangeElement) return;

    const minimum = Number(rangeElement.min || 0);
    const maximum = Number(rangeElement.max || 100);
    const current = Number(rangeElement.value || minimum);
    const span = maximum - minimum || 1;
    const percentage = Math.min(100, Math.max(0, ((current - minimum) / span) * 100));

    rangeElement.style.setProperty('--range-progress', `${percentage}%`);
}

function syncPlayerRangeVisuals() {
    updateRangeVisual(seekbar);
    updateRangeVisual(volumebar);
}

function syncVolumeReadout() {
    if (!volumebar || !volumePercent) return;

    const percentage = Math.round(Math.min(100, Math.max(0, Number(volumebar.value) || 0)));
    volumePercent.textContent = `${percentage}%`;
    volumebar.setAttribute('aria-valuetext', `${percentage} percent`);
}

audio.addEventListener('ended', async () => {
    commitSessionListeningTime();
    const advanced = await nextTrack(true);
    if (!advanced) markPlaybackStopped();
});

audio.addEventListener('play', () => {
    if (playIcon) playIcon.className = 'fas fa-pause';
    document.querySelector('.player')?.classList.add('is-playing');
    startSessionListeningClock();
    setupVisualizer();
    startVisualizer();
});

audio.addEventListener('pause', () => {
    // A source replacement can queue a late pause event. Only stop the player
    // if the currently active media element is actually paused.
    if (!audio.ended && audio.paused) markPlaybackStopped();
});

audio.addEventListener('loadedmetadata', () => {
    const totalTimeElement = document.getElementById('totalTime');
    if (totalTimeElement) totalTimeElement.innerText = formatTime(audio.duration);
    updateRangeVisual(seekbar);
});

seekbar.addEventListener('input', () => {
    isSeeking = true;
    updateRangeVisual(seekbar);

    if (audio.duration) {
        document.getElementById('currentTime').innerText = formatTime(
            (seekbar.value / 100) * audio.duration
        );
    }
});

seekbar.addEventListener('change', () => {
    prepareSessionProgressAfterSeek();

    if (audio.duration) {
        audio.currentTime = (seekbar.value / 100) * audio.duration;
    }

    updateRangeVisual(seekbar);
    isSeeking = false;
});

audio.addEventListener('seeking', () => {
    prepareSessionProgressAfterSeek();
});

audio.addEventListener('timeupdate', () => {
    noteCurrentTrackPlayedIfQualified();

    if (audio.duration && !isSeeking) {
        seekbar.value = (audio.currentTime / audio.duration) * 100;
        updateRangeVisual(seekbar);
        document.getElementById('currentTime').innerText = formatTime(
            audio.currentTime
        );
    }
});

volumebar.addEventListener('input', () => {
    audio.volume = volumebar.value / 100;
    updateRangeVisual(volumebar);
    syncVolumeReadout();
    localStorage.setItem('userVolume', String(audio.volume));
});

syncPlayerRangeVisuals();
syncVolumeReadout();

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// ==========================================
// 4. TRANSLUCENT RGB SPECTRUM RIBBON
// ==========================================
function resizeSpectrumCanvas() {
    if (!spectrumCanvas || !spectrumContext) return;

    const bounds = spectrumCanvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(bounds.width * pixelRatio));
    const height = Math.max(1, Math.floor(bounds.height * pixelRatio));

    if (spectrumCanvas.width !== width || spectrumCanvas.height !== height) {
        spectrumCanvas.width = width;
        spectrumCanvas.height = height;
        spectrumContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    // Do not wipe an active rise/fall transition just because setupVisualizer()
    // checked the canvas again. The idle line is only needed when fully settled.
    if (spectrumAnimationId === null && spectrumVisibility === 0) {
        drawIdleSpectrum();
    }
}

function prepareSpectrumCanvas() {
    spectrumCanvas = document.getElementById('playerSpectrum');
    if (!spectrumCanvas) return false;

    spectrumContext = spectrumCanvas.getContext('2d');
    if (!spectrumContext) return false;

    resizeSpectrumCanvas();

    if (!spectrumResizeObserver && 'ResizeObserver' in window) {
        spectrumResizeObserver = new ResizeObserver(resizeSpectrumCanvas);
        spectrumResizeObserver.observe(spectrumCanvas);
    }

    return true;
}

function setupVisualizer() {
    if (!prepareSpectrumCanvas()) return false;
    if (analyser && mediaElementSource) return true;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    try {
        audioCtx = audioCtx || new AudioContextClass();
        mediaElementSource = mediaElementSource || audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        analyser.minDecibels = -108;
        analyser.maxDecibels = -22;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        mediaElementSource.connect(analyser);
        analyser.connect(audioCtx.destination);
        return true;
    } catch (error) {
        console.warn('Spectrum ribbon unavailable:', error);
        return false;
    }
}

function roundedSpectrumBar(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.roundRect(x, y, width, height, safeRadius);
    context.fill();
}

function drawIdleSpectrum(clearCanvas = true) {
    if (!spectrumCanvas || !spectrumContext) return;

    const width = spectrumCanvas.clientWidth;
    const height = spectrumCanvas.clientHeight;
    if (clearCanvas) spectrumContext.clearRect(0, 0, width, height);

    const gradient = spectrumContext.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0)');
    gradient.addColorStop(0.22, 'rgba(0, 229, 255, 0.18)');
    gradient.addColorStop(0.52, 'rgba(175, 90, 255, 0.2)');
    gradient.addColorStop(0.78, 'rgba(255, 76, 128, 0.16)');
    gradient.addColorStop(1, 'rgba(255, 76, 128, 0)');

    spectrumContext.fillStyle = gradient;
    spectrumContext.fillRect(0, height - 2, width, 1);
}

function updateSpectrumVisibility(timestamp) {
    if (!spectrumTransitionFrameAt) {
        spectrumTransitionFrameAt = timestamp;
        return;
    }

    const elapsed = Math.min(80, Math.max(0, timestamp - spectrumTransitionFrameAt));
    spectrumTransitionFrameAt = timestamp;

    const tau = spectrumTargetVisibility > spectrumVisibility
        ? SPECTRUM_RISE_TAU_MS
        : SPECTRUM_FALL_TAU_MS;
    const blend = 1 - Math.exp(-elapsed / tau);

    spectrumVisibility += (spectrumTargetVisibility - spectrumVisibility) * blend;

    if (Math.abs(spectrumTargetVisibility - spectrumVisibility) < 0.004) {
        spectrumVisibility = spectrumTargetVisibility;
    }
}

function ensureSpectrumAnimation() {
    if (spectrumAnimationId !== null) return;

    lastSpectrumFrameAt = 0;
    spectrumTransitionFrameAt = 0;
    spectrumAnimationId = requestAnimationFrame(renderFrame);
}

function startVisualizer() {
    if (!setupVisualizer()) return;

    spectrumTargetVisibility = 1;

    if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(error => {
            console.debug('Audio context resume was deferred:', error);
        });
    }

    ensureSpectrumAnimation();
}

function stopVisualizer(drawIdle = true) {
    spectrumTargetVisibility = 0;

    // Do not cancel an in-progress animation. Let the existing ribbon settle
    // back down to the idle line. If Play/Next/Previous is hit during that fall,
    // startVisualizer() simply flips the target back to 1 and the same envelope
    // reverses direction without a visual pop.
    if (analyser && dataArray && spectrumCanvas && spectrumContext) {
        ensureSpectrumAnimation();
    } else if (drawIdle) {
        drawIdleSpectrum();
    }
}

function renderFrame(timestamp = 0) {
    if (!analyser || !dataArray || !spectrumCanvas || !spectrumContext) {
        spectrumAnimationId = null;
        return;
    }

    // A smooth 30fps ribbon is plenty; faster animation only adds noise.
    if (timestamp - lastSpectrumFrameAt < 33) {
        spectrumAnimationId = requestAnimationFrame(renderFrame);
        return;
    }
    lastSpectrumFrameAt = timestamp;
    updateSpectrumVisibility(timestamp);

    const audioIsPlaying = !audio.paused && !audio.ended;

    // While falling, keep the final live spectrum shape and scale it downward.
    // Sampling only during active playback avoids the bars abruptly collapsing
    // to zero before the transition itself has had time to finish.
    if (audioIsPlaying) {
        analyser.getByteFrequencyData(dataArray);
    }

    const width = spectrumCanvas.clientWidth;
    const height = spectrumCanvas.clientHeight;
    spectrumContext.clearRect(0, 0, width, height);

    // The old one-pixel idle ribbon stays underneath the animation, so the live
    // spectrum appears to grow naturally out of it and settle back into it.
    drawIdleSpectrum(false);

    const liftProgress = spectrumVisibility * spectrumVisibility * (3 - 2 * spectrumVisibility);

    if (liftProgress > 0.001) {
        spectrumContext.save();
        spectrumContext.globalCompositeOperation = 'lighter';
        spectrumContext.globalAlpha = Math.min(1, 0.08 + liftProgress * 0.92);

        // Automatic gain normalization follows the spectrum's shape rather than
        // the player's output-volume setting. Quiet listening therefore remains
        // visually lively without making loud masters turn into a solid wall.
        let framePeak = 0;
        let frameAverage = 0;
        const analysedBins = Math.max(1, Math.floor(dataArray.length * 0.82));

        for (let index = 0; index < analysedBins; index += 1) {
            const value = dataArray[index] / 255;
            framePeak = Math.max(framePeak, value);
            frameAverage += value;
        }

        frameAverage /= analysedBins;
        spectrumSmoothedPeak += (Math.max(framePeak, frameAverage * 2.4, 0.08) - spectrumSmoothedPeak) * 0.09;

        const desiredGain = Math.min(5.8, Math.max(1.05, 0.86 / spectrumSmoothedPeak));
        spectrumAutoGain += (desiredGain - spectrumAutoGain) * 0.075;

        const barCount = Math.max(42, Math.min(88, Math.floor(width / 14)));
        const gap = Math.max(1.5, width / barCount * 0.24);
        const barWidth = Math.max(1.8, (width - gap * (barCount - 1)) / barCount);
        const usableHeight = Math.max(10, height - 2);

        for (let index = 0; index < barCount; index += 1) {
            const normalizedIndex = index / Math.max(1, barCount - 1);
            const dataIndex = Math.min(
                dataArray.length - 1,
                Math.floor(Math.pow(normalizedIndex, 1.38) * dataArray.length * 0.80)
            );

            const previousBin = dataArray[Math.max(0, dataIndex - 1)] / 255;
            const currentBin = dataArray[dataIndex] / 255;
            const nextBin = dataArray[Math.min(dataArray.length - 1, dataIndex + 1)] / 255;
            const localShape = (previousBin + currentBin * 2 + nextBin) / 4;
            const normalizedStrength = Math.min(1, localShape * spectrumAutoGain);

            // A restrained travelling pulse keeps the ribbon breathing between
            // softer notes; the actual frequency data still controls its shape.
            const travellingPulse = 0.5 + 0.5 * Math.sin(timestamp * 0.0048 + index * 0.58);
            const livelyFloor = 0.07 + travellingPulse * (0.035 + frameAverage * 0.12);
            const shapedStrength = Math.min(1, normalizedStrength * 0.90 + livelyFloor);
            const easedStrength = Math.pow(shapedStrength, 0.78);
            const fullBarHeight = Math.max(2.5, easedStrength * usableHeight);
            const barHeight = 1 + (fullBarHeight - 1) * liftProgress;
            const x = index * (barWidth + gap);
            const y = height - barHeight;
            const hue = (184 + normalizedIndex * 272 + timestamp * 0.008) % 360;
            const color = `hsla(${hue}, 100%, 68%, ${0.25 + easedStrength * 0.46})`;
            const verticalGradient = spectrumContext.createLinearGradient(0, y, 0, height);

            verticalGradient.addColorStop(0, color);
            verticalGradient.addColorStop(0.62, `hsla(${hue}, 100%, 60%, ${0.10 + easedStrength * 0.16})`);
            verticalGradient.addColorStop(1, `hsla(${hue}, 100%, 56%, 0.018)`);

            spectrumContext.fillStyle = verticalGradient;
            spectrumContext.shadowColor = `hsla(${hue}, 100%, 64%, ${0.18 + easedStrength * 0.34})`;
            spectrumContext.shadowBlur = (6 + easedStrength * 9) * liftProgress;
            roundedSpectrumBar(spectrumContext, x, y, barWidth, barHeight, Math.min(3, barWidth / 2));
        }

        spectrumContext.restore();
    }

    if (spectrumTargetVisibility === 0 && spectrumVisibility === 0) {
        spectrumAnimationId = null;
        spectrumTransitionFrameAt = 0;
        drawIdleSpectrum();
        return;
    }

    spectrumAnimationId = requestAnimationFrame(renderFrame);
}

// ==========================================
// 5. KEYBOARD SHORTCUTS
// ==========================================
function shouldIgnorePlayerShortcut(event) {
    const target = event.target;

    // Never hijack browser/OS shortcuts such as Ctrl+P or Cmd+P.
    if (event.ctrlKey || event.metaKey || event.altKey) return true;

    // A held key should trigger only once instead of racing through the queue.
    if (event.repeat) return true;

    // Ignore controls where key presses are actually used for text entry.
    // Range inputs (seek/volume) are intentionally NOT blocked: after dragging
    // either slider, Space/N/P/S/L should keep controlling the player immediately.
    const textEntryInputTypes = new Set([
        'text', 'search', 'email', 'password', 'url', 'tel', 'number'
    ]);
    const isTextEntryInput = target instanceof HTMLInputElement
        && textEntryInputTypes.has(String(target.type || 'text').toLowerCase());

    // Player transport buttons are safe shortcut targets. A mouse click can leave
    // one focused, but Space/N/P/S/L should still behave as global player keys.
    const isPlayerControlButton = target instanceof HTMLButtonElement
        && target.classList.contains('ctrl-btn')
        && Boolean(target.closest('.player'));

    if (
        isTextEntryInput
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || (target instanceof HTMLButtonElement && !isPlayerControlButton)
        || target?.isContentEditable
    ) {
        return true;
    }

    // Keep media shortcuts disabled until the login screen has actually closed.
    const loginPage = document.getElementById('loginPage');
    if (
        loginPage
        && loginPage.style.display !== 'none'
        && !loginPage.classList.contains('hidden')
    ) {
        return true;
    }

    // Do not change playback behind an open upload/admin/playlist modal.
    if (document.querySelector('.modal-overlay:not(.hidden)')) return true;

    return false;
}

function handlePlayerKeyboardShortcut(event) {
    if (shouldIgnorePlayerShortcut(event)) return;

    const key = String(event.key || '').toLowerCase();

    if (event.code === 'Space' || key === ' ') {
        event.preventDefault(); // Space normally scrolls the page.
        void togglePlay();
        return;
    }

    switch (key) {
        case 'n':
            void nextTrack();
            break;
        case 'p':
            void prevTrack();
            break;
        case 's':
            toggleShuffle();
            break;
        case 'l':
            toggleRepeat();
            break;
        default:
            break;
    }
}

document.addEventListener('keydown', handlePlayerKeyboardShortcut);

// Mouse/pointer clicks normally leave a button focused. Release that focus after
// clicking a transport control so the next key press immediately belongs to the
// global player shortcuts. Keyboard-generated clicks have event.detail === 0,
// so Tab/Space keyboard navigation keeps its normal focus behavior.
document.addEventListener('click', event => {
    if (event.detail === 0) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest('.player .ctrl-btn, .recent-upload-card');
    if (button instanceof HTMLButtonElement) {
        button.blur();
    }
});

// ==========================================
// 6. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    prepareSpectrumCanvas();
    updatePlaybackModeButtons();
    updateSessionInfo();

    if (isShuffle) {
        resetShuffleState(getCurrentTrackId());
    }
});

window.addEventListener('beforeunload', commitSessionListeningTime);
