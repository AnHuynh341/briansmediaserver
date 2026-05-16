// ==========================================
// PLAYER.JS — Audio Engine & Playback Controls
// ==========================================
// Depends on: config.js, ui.js (renderTrackList)

// ==========================================
// PLAYER ENGINE
// ==========================================

// Remembers if the user wants the visualizer running (Defaults to ON)
const savedState = localStorage.getItem('visualizerState');
let userWantsVisualizer = savedState === null ? false : (savedState === 'true');

async function loadTrack(i, autoplay = false) {
    if (i < 0 || i >= allTracks.length) return;
    currentTrackIndex = i;
    const track = allTracks[i];

    document.getElementById('npTitle').innerText = 'Loading...';
    document.getElementById('npArtist').innerText = track.artist;

    try {
        const response = await fetch(track.file);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (audio.src && audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
        }

        audio.src = blobUrl;

        document.getElementById('npTitle').innerText = track.name;
        document.getElementById('npArtist').innerText = track.artist;

const coverArtEl = document.getElementById('npCover');
if (coverArtEl) {
    coverArtEl.src = track.cover;
    coverArtEl.onerror = () => {
        coverArtEl.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%231a1a36'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%2300E5FF'%3E♪%3C/text%3E%3C/svg%3E`;
    };
}

        renderTrackList();

        if (autoplay) {
            await audio.play();
            playIcon.className = 'fas fa-pause';
            if (userWantsVisualizer) {
                setupVisualizer();
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                startVisualizer();
            }
        } else {
            playIcon.className = 'fas fa-play';
        }

    } catch (e) {
        console.error('Failed to load track:', e);
        document.getElementById('npTitle').innerText = track.name;
        audio.src = track.file;
    }

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: track.artist,
            album: track.genre,
            artwork: [{ src: track.cover, sizes: '600x600', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack(false));
    }
}

function togglePlay() {
    if (!audio.src) return;

    setupVisualizer();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (audio.paused) {
        audio.play();
        document.getElementById('playIcon').classList.replace('fa-play', 'fa-pause');
        
        // ONLY turn on the glow if the user actually wants it!
        if (userWantsVisualizer) {
            startVisualizer(); 
        }
    } else {
        audio.pause();
        document.getElementById('playIcon').classList.replace('fa-pause', 'fa-play');
        // The renderFrame loop will automatically detect the pause and turn off the lights
    }
}
function toggleShuffle() {
    isShuffle = !isShuffle;
    const btn = document.getElementById('shuffleBtn');
    if (isShuffle) {
        btn.classList.add('active');
        btn.style.color = 'var(--accent, #00ffcc)';
        btn.style.textShadow = '0 0 8px var(--accent, #00ffcc)';
    } else {
        btn.classList.remove('active');
        btn.style.color = '';
        btn.style.textShadow = '';
    }
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const btn = document.getElementById('repeatBtn');
    const icon = btn.querySelector('i');

    btn.classList.remove('active');
    btn.removeAttribute('data-repeat-one');
    btn.style.color = '';
    btn.style.textShadow = '';

    if (repeatMode === 1) {
        btn.classList.add('active');
        icon.className = 'fas fa-redo-alt';
        btn.style.color = 'var(--accent)';
    } else if (repeatMode === 2) {
        btn.classList.add('active');
        icon.className = 'fas fa-redo-alt';
        btn.setAttribute('data-repeat-one', 'true');
        btn.style.color = 'var(--success)';
    } else {
        icon.className = 'fas fa-redo-alt';
        btn.style.color = 'var(--text-sub)';
    }
}

function nextTrack(isAutoAdvance = false) {
    if (repeatMode === 2 && isAutoAdvance) {
        audio.currentTime = 0;
        audio.play();
        return;
    }

    const currentIndexInPlaylist = currentPlaylistTracks.findIndex(
        t => t.id === allTracks[currentTrackIndex]?.id
    );

    let nextIndexInPlaylist;

    if (isShuffle && currentPlaylistTracks.length > 1) {
        do {
            nextIndexInPlaylist = Math.floor(Math.random() * currentPlaylistTracks.length);
        } while (nextIndexInPlaylist === currentIndexInPlaylist);
    } else {
        nextIndexInPlaylist = currentIndexInPlaylist + 1;

        if (nextIndexInPlaylist >= currentPlaylistTracks.length) {
            if (repeatMode === 1) {
                nextIndexInPlaylist = 0;
            } else {
                audio.pause();
                playIcon.className = 'fas fa-play';
                return;
            }
        }
    }

    const originalIndex = allTracks.findIndex(
        t => t.id === currentPlaylistTracks[nextIndexInPlaylist].id
    );
    loadTrack(originalIndex, true);
}

function prevTrack() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }

    const currentIndexInPlaylist = currentPlaylistTracks.findIndex(
        t => t.id === allTracks[currentTrackIndex]?.id
    );
    const prevIndexInPlaylist =
        (currentIndexInPlaylist - 1 + currentPlaylistTracks.length) % currentPlaylistTracks.length;

    const originalIndex = allTracks.findIndex(
        t => t.id === currentPlaylistTracks[prevIndexInPlaylist].id
    );
    loadTrack(originalIndex, true);
}

// ==========================================
// AUDIO EVENT LISTENERS & TIMELINE
// ==========================================

audio.addEventListener('ended', () => nextTrack(true));

audio.addEventListener('loadedmetadata', () => {
    document.getElementById('totalTime').innerText = formatTime(audio.duration);
});

// INPUT: fires continuously while dragging — preview time only, do NOT seek yet
seekbar.addEventListener('input', () => {
    isSeeking = true; // Tell the audio player to stop fighting us
    if (audio.duration) {
        const seekTime = (seekbar.value / 100) * audio.duration;
        document.getElementById('currentTime').innerText = formatTime(seekTime);
    }
});

// CHANGE: fires exactly once when you release the slider — now perform the actual seek
seekbar.addEventListener('change', () => {
    if (audio.duration) {
        audio.currentTime = (seekbar.value / 100) * audio.duration;
    }
    isSeeking = false; // Give control back to the audio player
});

// TIMEUPDATE: moves the bar naturally while playing, but not while user is dragging
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
// GLOBAL KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener('keydown', function (event) {
    const activeTag = document.activeElement.tagName;
    const isTyping = (activeTag === 'INPUT' || activeTag === 'TEXTAREA');

    if (isTyping) return;

    switch (event.code) {
        case 'Space':
            event.preventDefault();
            togglePlay();
            break;

        case 'ArrowRight':
            event.preventDefault();
            if (audio.src && audio.duration) {
                audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
            }
            break;

        case 'ArrowLeft':
            event.preventDefault();
            if (audio.src) {
                audio.currentTime = Math.max(audio.currentTime - 5, 0);
            }
            break;
    }
});
// ==========================================
// REAL-TIME AUDIO VISUALIZER (BASS GLOW & SLOW PULSING STARFIELD)
// ==========================================
let audioCtx, analyser, dataArray;
let isVisualizerRunning = false;
let colorHue = 0; 

let snowCtx, canvasW, canvasH;
let particles = [];
const MAX_PARTICLES = 200; // Vastly increased for a dense, tiny starfield effect

function setupVisualizer() {
    if (audioCtx) return;

    // 1. Setup Audio Engine
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512; // High resolution for bass detection
    
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    // 2. Setup Canvas
    const canvas = document.getElementById('snow-canvas');
    if (canvas) {
        snowCtx = canvas.getContext('2d');
        resizeCanvas(canvas);
        window.addEventListener('resize', () => resizeCanvas(canvas));
        
        // Build the massive particle pool
        for(let i = 0; i < MAX_PARTICLES; i++) {
            particles.push({
                x: Math.random() * canvasW,
                y: Math.random() * canvasH,
                size: Math.random() * 1.5 + 0.5, // Extremely small base size
                sway: Math.random() * Math.PI * 2,
                life: Math.random() 
            });
        }
    }
}

function resizeCanvas(canvas) {
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width = canvasW;
    canvas.height = canvasH;
}

function startVisualizer() {
    if (!isVisualizerRunning) {
        isVisualizerRunning = true;
        document.getElementById('snow-canvas').style.opacity = '1';
        renderFrame();
    }
}

function renderFrame() {
    if (!isVisualizerRunning || audio.paused) {
        isVisualizerRunning = false;
        document.getElementById('reactive-bg').style.boxShadow = 'none';
        document.getElementById('snow-canvas').style.opacity = '0';
        return;
    }

    requestAnimationFrame(renderFrame);
    analyser.getByteFrequencyData(dataArray);

    // BASS DETECTION
    let bassSum = 0;
    for (let i = 0; i < 12; i++) bassSum += dataArray[i];
    const bassAverage = bassSum / 12;

    // OVERALL VOLUME
    let totalSum = 0;
    for (let i = 0; i < dataArray.length; i++) totalSum += dataArray[i];
    const overallAverage = totalSum / dataArray.length;

    // Spinning color wheel
    colorHue += 0.2 + (overallAverage / 40);
    if (colorHue > 360) colorHue -= 360;

    const bg = document.getElementById('reactive-bg');

    // ==========================================
    // SOFTER, FADED GLOW LOGIC
    // ==========================================
    if (bassAverage > 180) {
        // INTENSE BASS (Now much smoother and softer)
        const intensity = (bassAverage - 180) / 75;
        const blurSize = 150 + (intensity * 150); // Wider blur
        const spreadSize = 20 + (intensity * 40); // Tighter spread so it doesn't wash out the center
        const alpha = 0.15 + (intensity * 0.2); // Faded opacity (Max 0.35 instead of 0.7)
        
        // Removed the double-shadow to eliminate harsh edges
        bg.style.boxShadow = `inset 0 0 ${blurSize}px ${spreadSize}px hsla(${colorHue}, 100%, 55%, ${alpha})`;
        
    } else {
        // CHILL BEAT (Barely-there ambient fade)
        const chillLevel = Math.max(overallAverage, 1) / 120;
        const blurSize = 100 + (chillLevel * 100);
        const spreadSize = 10 + (chillLevel * 20);
        const alpha = 0.05 + (chillLevel * 0.1); // Extremely subtle, max 0.15
        
        bg.style.boxShadow = `inset 0 0 ${blurSize}px ${spreadSize}px hsla(${colorHue}, 100%, 50%, ${alpha})`;
    }

    drawParticles(colorHue, overallAverage);
}
// ==========================================
// UNIFIED STARFIELD ENGINE (Slow, Tiny, Pulsing, RGB)
// ==========================================
function drawParticles(currentHue, overallAverage) {
    if (!snowCtx) return;
    snowCtx.clearRect(0, 0, canvasW, canvasH);
    
    // We use the overall volume for the pulse so it breathes smoothly
    const pulse = overallAverage / 255; 

    for(let i = 0; i < MAX_PARTICLES; i++) {
        let p = particles[i];
        snowCtx.beginPath();
        
        // Size pulses slightly with the music, but stays very small
        const responsiveSize = p.size + (pulse * 2.5); 
        
        // Movement stays incredibly slow and peaceful
        const speed = 0.3 + (pulse * 0.8); 
        
        // Alpha (transparency) fades in and out with the volume
        const alpha = 0.15 + (pulse * 0.3); 
        
        // THE FIX: Particles now perfectly match the shifting rainbow edge glow!
        snowCtx.fillStyle = `hsla(${currentHue}, 80%, 75%, ${alpha})`;
        snowCtx.arc(p.x, p.y, responsiveSize, 0, Math.PI * 2);
        
        // Slow upward drift + gentle side sway
        p.y -= speed; 
        p.x += Math.sin(p.sway) * 0.3; 
        p.sway += 0.015;
        
        // Seamlessly wrap particles back to the bottom
        if (p.y < -10) {
            p.y = canvasH + 10;
            p.x = Math.random() * canvasW;
        }
        
        snowCtx.fill();
    }
}
// ==========================================
// VISUALIZER KILL SWITCH
// ==========================================
function toggleVisualizerMode() {
    const toggleInput = document.getElementById('visualizerToggleInput');
    userWantsVisualizer = toggleInput.checked;
    localStorage.setItem('visualizerState', userWantsVisualizer);

    if (userWantsVisualizer) {
        if (!audio.paused && audio.src) {
            isVisualizerRunning = false; // force clean restart
            startVisualizer();
        }
    } else {
        isVisualizerRunning = false;
        document.getElementById('reactive-bg').style.boxShadow = 'none'; // ✅ fixed
        document.getElementById('snow-canvas').style.opacity = '0';
    }
}
// ==========================================
// INITIALIZE UI ON LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Make sure the physical iOS switch matches the saved memory!
    const toggleInput = document.getElementById('visualizerToggleInput');
    if (toggleInput) {
        toggleInput.checked = userWantsVisualizer;
    }
});