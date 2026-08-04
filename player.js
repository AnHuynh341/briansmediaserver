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

// ==========================================
// SESSION TELEMETRY
// ==========================================
const SESSION_STORAGE_KEY = 'w41it-session-telemetry-v1';
let sessionStartedListeningAt = null;
let sessionUpdateTimer = null;

function readSessionTelemetry() {
    try {
        const parsed = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || '{}');
        return {
            playedTrackIds: Array.isArray(parsed.playedTrackIds) ? parsed.playedTrackIds : [],
            listeningSeconds: Number.isFinite(Number(parsed.listeningSeconds))
                ? Math.max(0, Number(parsed.listeningSeconds))
                : 0
        };
    } catch (error) {
        console.warn('Could not restore session telemetry:', error);
        return { playedTrackIds: [], listeningSeconds: 0 };
    }
}

const sessionTelemetry = readSessionTelemetry();
const sessionPlayedTrackIds = new Set(sessionTelemetry.playedTrackIds);
let sessionListeningSeconds = sessionTelemetry.listeningSeconds;

function persistSessionTelemetry() {
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            playedTrackIds: Array.from(sessionPlayedTrackIds),
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

    if (trackCountElement) trackCountElement.textContent = String(sessionPlayedTrackIds.size);
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

function noteCurrentTrackPlayed() {
    const trackId = getCurrentTrackId();
    if (!trackId) return;

    sessionPlayedTrackIds.add(trackId);
    persistSessionTelemetry();
    updateSessionInfo();
}

function startSessionListeningClock() {
    if (sessionStartedListeningAt === null) {
        sessionStartedListeningAt = Date.now();
    }

    if (sessionUpdateTimer === null) {
        sessionUpdateTimer = window.setInterval(() => {
            updateSessionInfo();
            persistSessionTelemetry();
        }, 1000);
    }

    updateSessionInfo();
}

function commitSessionListeningTime() {
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

    if (!repeatButton) {
        updateSessionInfo();
        return;
    }

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

    currentTrackIndex = i;
    const track = allTracks[i];
    const displayTrackName = typeof getDisplayTrackName === 'function'
        ? getDisplayTrackName(track.name)
        : track.name;

    // Create/resume the audio graph while the click gesture is still active.
    if (autoplay) setupVisualizer();

    if (isShuffle && navigationSource === 'direct') {
        registerDirectShuffleSelection(track.id);
    }

    const titleElement = document.getElementById('npTitle');
    const artistElement = document.getElementById('npArtist');

    if (titleElement) titleElement.innerText = 'Loading...';
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

        if (titleElement) titleElement.innerText = displayTrackName;
        if (artistElement) artistElement.innerText = track.artist || 'Unknown Artist';

        if (typeof renderTrackList === 'function') renderTrackList();

        if (autoplay) {
            try {
                await audio.play();
                if (playIcon) playIcon.className = 'fas fa-pause';

                setupVisualizer();
                startVisualizer();
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

        if (titleElement) titleElement.innerText = displayTrackName;
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
            startVisualizer();
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
    updateSessionInfo();
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    localStorage.setItem('repeatMode', String(repeatMode));
    updatePlaybackModeButtons();
    updateSessionInfo();
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

audio.addEventListener('ended', async () => {
    commitSessionListeningTime();
    const advanced = await nextTrack(true);
    if (!advanced) markPlaybackStopped();
});

audio.addEventListener('play', () => {
    if (playIcon) playIcon.className = 'fas fa-pause';
    document.querySelector('.player')?.classList.add('is-playing');
    noteCurrentTrackPlayed();
    startSessionListeningClock();
    setupVisualizer();
    startVisualizer();
});

audio.addEventListener('pause', () => {
    if (!audio.ended) markPlaybackStopped();
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
    if (audio.duration) {
        audio.currentTime = (seekbar.value / 100) * audio.duration;
    }

    updateRangeVisual(seekbar);
    isSeeking = false;
});

audio.addEventListener('timeupdate', () => {
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
    localStorage.setItem('userVolume', String(audio.volume));
});

syncPlayerRangeVisuals();

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

    drawIdleSpectrum();
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

function drawIdleSpectrum() {
    if (!spectrumCanvas || !spectrumContext) return;

    const width = spectrumCanvas.clientWidth;
    const height = spectrumCanvas.clientHeight;
    spectrumContext.clearRect(0, 0, width, height);

    const gradient = spectrumContext.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0)');
    gradient.addColorStop(0.22, 'rgba(0, 229, 255, 0.18)');
    gradient.addColorStop(0.52, 'rgba(175, 90, 255, 0.2)');
    gradient.addColorStop(0.78, 'rgba(255, 76, 128, 0.16)');
    gradient.addColorStop(1, 'rgba(255, 76, 128, 0)');

    spectrumContext.fillStyle = gradient;
    spectrumContext.fillRect(0, height - 2, width, 1);
}

function startVisualizer() {
    if (!setupVisualizer()) return;

    if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(error => {
            console.debug('Audio context resume was deferred:', error);
        });
    }

    if (spectrumAnimationId !== null) return;
    lastSpectrumFrameAt = 0;
    spectrumAnimationId = requestAnimationFrame(renderFrame);
}

function stopVisualizer(drawIdle = true) {
    if (spectrumAnimationId !== null) {
        cancelAnimationFrame(spectrumAnimationId);
        spectrumAnimationId = null;
    }

    if (drawIdle) drawIdleSpectrum();
}

function renderFrame(timestamp = 0) {
    if (!analyser || !dataArray || !spectrumCanvas || !spectrumContext) {
        spectrumAnimationId = null;
        return;
    }

    if (audio.paused || audio.ended) {
        spectrumAnimationId = null;
        drawIdleSpectrum();
        return;
    }

    // A smooth 30fps ribbon is plenty; faster animation only adds noise.
    if (timestamp - lastSpectrumFrameAt < 33) {
        spectrumAnimationId = requestAnimationFrame(renderFrame);
        return;
    }
    lastSpectrumFrameAt = timestamp;

    analyser.getByteFrequencyData(dataArray);

    const width = spectrumCanvas.clientWidth;
    const height = spectrumCanvas.clientHeight;
    spectrumContext.clearRect(0, 0, width, height);
    spectrumContext.save();
    spectrumContext.globalCompositeOperation = 'lighter';

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
    const usableHeight = Math.max(10, height - 4);

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
        const barHeight = Math.max(2.5, easedStrength * usableHeight);
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
        spectrumContext.shadowBlur = 6 + easedStrength * 9;
        roundedSpectrumBar(spectrumContext, x, y, barWidth, barHeight, Math.min(3, barWidth / 2));
    }

    spectrumContext.restore();
    spectrumAnimationId = requestAnimationFrame(renderFrame);
}

// ==========================================
// 5. INITIALIZATION
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
