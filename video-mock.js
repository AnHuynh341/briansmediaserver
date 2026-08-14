// ==========================================================
// W41IT VIDEO MODE — FRONTEND MOCK
// ==========================================================
// This file deliberately contains only demo data and frontend state.
// Later, replace VIDEO_MOCK_SERIES with Appwrite videoSeries/videoEpisodes
// documents (and real VPS file/subtitle URLs) without rebuilding the UI.

const VIDEO_MEDIA_ORIGIN = 'https://media.anhuynh341.online';

function resolveVideoMediaUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = String(path).startsWith('/') ? String(path) : `/${path}`;
    return `${VIDEO_MEDIA_ORIGIN}${normalizedPath}`;
}

function getVideoSeriesPoster(series) {
    return series.posterPath ? resolveVideoMediaUrl(series.posterPath) : series.poster;
}

function getVideoSeriesBackdrop(series) {
    return series.backdropPath
        ? resolveVideoMediaUrl(series.backdropPath)
        : (series.backdrop || getVideoSeriesPoster(series));
}

const VIDEO_MOCK_SERIES = [
    {
        id: 'smoking-behind-supermarket',
        title: 'Smoking Behind the Supermarket with You',
        year: 2026,
        genre: 'Drama',
        posterPath: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/thumbnail.jpg',
        backdropPath: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/thumbnail.jpg',
        description: 'Real VPS streaming test. Video, artwork and subtitles are served from the W41IT media origin.',
        episodes: [
            {
                number: 6,
                title: 'Lingering Scent Behind the Supermarket with You',
                duration: '23:50',
                quality: '1080p',
                thumbnailPath: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/thumbnail.jpg',
                videoPath: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/video.mp4',
                subtitles: [
                    {
                        lang: 'en',
                        label: 'English',
                        path: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/en.vtt',
                        default: true
                    },
                    {
                        lang: 'vi',
                        label: 'Vietnamese',
                        path: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/vi.vtt'
                    }
                ]
            }
        ]
    },
    {
        id: 'nocturne-protocol',
        title: 'Nocturne Protocol',
        year: 2026,
        genre: 'Sci-Fi',
        poster: 'assets/video/neon-reverie.jpg',
        backdrop: 'assets/video/nocturne-backdrop.jpg',
        description: 'A citywide memory network begins leaking fragments of lives that were never supposed to exist.',
        episodeTitles: [
            'Signal in the Static', 'Fractured Code', 'Ghost in the Machine', 'Zero Hour',
            'Shadows of Elysium', 'Beneath the Light', 'Echoes of the Past', 'Mirror\'s Edge',
            'The Fifth Key', 'Crossing the Event Horizon', 'Until the End of Time', 'Beyond the Protocol'
        ]
    },
    {
        id: 'eclipsed-horizon',
        title: 'Eclipsed Horizon',
        year: 2026,
        genre: 'Fantasy',
        poster: 'assets/video/eclipsed-horizon.jpg',
        backdrop: 'assets/video/eclipsed-horizon.jpg',
        description: 'A lone traveler follows a vanishing moon across a continent whose cities appear only at dusk.',
        episodeTitles: ['The Last Sunset', 'Glass Desert', 'Moonwake', 'A City at Dusk', 'The Fifth Bell', 'Where Stars Fall', 'Beyond the Rim', 'Homeward']
    },
    {
        id: 'aethers-ascent',
        title: 'Aether\'s Ascent',
        year: 2026,
        genre: 'Adventure',
        poster: 'assets/video/aethers-ascent.jpg',
        backdrop: 'assets/video/aethers-ascent.jpg',
        description: 'Cadets on a floating citadel discover that the sky beneath their world is not empty after all.',
        episodeTitles: ['Updraft', 'Cloudline', 'The Broken Wing', 'Blue Cathedral', 'Stormglass', 'Below the Sky', 'Freefall', 'Ascent']
    },
    {
        id: 'ruinbound',
        title: 'Ruinbound',
        year: 2026,
        genre: 'Action',
        poster: 'assets/video/ruinbound.jpg',
        backdrop: 'assets/video/ruinbound.jpg',
        description: 'Two scavengers race through a continent of dormant war machines before an ancient signal wakes them.',
        episodeTitles: ['Ash Road', 'Red Engine', 'The Salvager', 'Black Rain', 'Ruin Song', 'Last Ammunition', 'Wake the Giant', 'Afterfire']
    },
    {
        id: 'whispers-after-class',
        title: 'Whispers After Class',
        year: 2026,
        genre: 'Drama',
        poster: 'assets/video/whispers-after-class.jpg',
        backdrop: 'assets/video/whispers-after-class.jpg',
        description: 'An after-school radio club receives messages from students who have not joined the school yet.',
        episodeTitles: ['Dead Air', 'Cherry Blossoms Fade', 'Room 403', 'Second Broadcast', 'Rainy Tuesday', 'Unsent Letter', 'The Empty Studio', 'Good Night']
    },
    {
        id: 'solstice-bakery',
        title: 'Solstice Bakery',
        year: 2026,
        genre: 'Slice of Life',
        poster: 'assets/video/solstice-bakery.jpg',
        backdrop: 'assets/video/solstice-bakery.jpg',
        description: 'A tiny countryside bakery becomes the meeting point for people who need one quiet day before moving on.',
        episodeTitles: ['First Loaf', 'Rain Tea', 'The Late Train', 'Strawberry Morning', 'Festival Bread', 'A Table for Two', 'Summer Closing', 'Winter Opening']
    },
    {
        id: 'stellar-drift',
        title: 'Stellar Drift',
        year: 2026,
        genre: 'Mystery',
        poster: 'assets/video/stellar-drift.jpg',
        backdrop: 'assets/video/stellar-drift.jpg',
        description: 'A survey ship finds the same impossible eclipse waiting at every jump point on its route home.',
        episodeTitles: ['Departure Vector', 'Black Sun', 'No Reply', 'Silent Orbit', 'The Ring', 'False Home', 'Light Delay', 'Drift']
    }
];

const VIDEO_EPISODE_DURATIONS = ['23:41', '23:28', '23:17', '23:45', '23:36', '23:36', '23:51', '24:02', '23:44', '24:15', '23:38', '24:30'];
const VIDEO_GENRES = ['All', 'Action', 'Adventure', 'Drama', 'Fantasy', 'Sci-Fi', 'Slice of Life', 'Mystery'];

const videoMockState = {
    activeSeriesId: 'nocturne-protocol',
    activeEpisode: 7,
    activeGenre: 'All',
    search: '',
    toastTimer: null,
    mockPlaying: false,
    currentSeconds: 0
};

function normalizeVideoSubtitles(subtitles) {
    if (Array.isArray(subtitles)) {
        return subtitles
            .map((track, index) => ({
                lang: track?.lang || `sub-${index + 1}`,
                label: track?.label || track?.lang || `Subtitle ${index + 1}`,
                src: resolveVideoMediaUrl(track?.path || track?.src || ''),
                default: Boolean(track?.default)
            }))
            .filter(track => Boolean(track.src));
    }

    return Object.entries(subtitles || {})
        .map(([lang, src]) => ({
            lang,
            label: lang === 'vi' ? 'Vietnamese' : lang === 'ja' ? 'Japanese' : 'English',
            src: resolveVideoMediaUrl(src),
            default: lang === 'en'
        }))
        .filter(track => Boolean(track.src));
}

function makeVideoEpisodes(series) {
    if (Array.isArray(series.episodes) && series.episodes.length > 0) {
        return series.episodes.map((episode, index) => ({
            id: episode.id || `${series.id}-e${episode.number ?? index + 1}`,
            number: Number(episode.number ?? index + 1),
            title: episode.title || `Episode ${episode.number ?? index + 1}`,
            duration: episode.duration || VIDEO_EPISODE_DURATIONS[index % VIDEO_EPISODE_DURATIONS.length],
            quality: episode.quality || '1080p',
            thumbnail: resolveVideoMediaUrl(episode.thumbnailPath || episode.thumbnail || ''),
            fileUrl: resolveVideoMediaUrl(episode.videoPath || episode.fileUrl || ''),
            subtitles: normalizeVideoSubtitles(episode.subtitles)
        }));
    }

    const titles = series.episodeTitles || [];
    return titles.map((title, index) => ({
        id: `${series.id}-e${index + 1}`,
        number: index + 1,
        title,
        duration: VIDEO_EPISODE_DURATIONS[index % VIDEO_EPISODE_DURATIONS.length],
        quality: '720p',
        thumbnail: `assets/video/episode-${String((index % 6) + 1).padStart(2, '0')}.jpg`,
        fileUrl: '',
        subtitles: []
    }));
}

function getVideoSeries(seriesId) {
    return VIDEO_MOCK_SERIES.find(series => series.id === seriesId) || VIDEO_MOCK_SERIES[0];
}

function getVideoEpisode(series, episodeNumber) {
    const episodes = makeVideoEpisodes(series);
    return episodes.find(episode => episode.number === Number(episodeNumber)) || episodes[0];
}

function parseDurationSeconds(duration) {
    const parts = String(duration || '0:00').split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function formatVideoTime(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${minutes}:${String(secs).padStart(2, '0')}`;
}

function switchMediaMode(mode) {
    const isVideo = mode === 'video';
    const mainPage = document.getElementById('mainPage');
    const audioMainView = document.getElementById('audioMainView');
    const videoMainView = document.getElementById('videoMainView');
    const navAudio = document.getElementById('navAllTracks');
    const navVideo = document.getElementById('navVideo');

    if (!mainPage || !audioMainView || !videoMainView) return;

    mainPage.classList.toggle('video-mode', isVideo);
    audioMainView.classList.toggle('hidden', isVideo);
    videoMainView.classList.toggle('hidden', !isVideo);
    navVideo?.classList.toggle('active', isVideo);
    navAudio?.classList.toggle('active', !isVideo);

    if (isVideo) {
        if (typeof audio !== 'undefined' && audio && !audio.paused) {
            audio.pause();
            if (typeof markPlaybackStopped === 'function') markPlaybackStopped();
        }
        renderVideoHome();
        showVideoHome();
    } else {
        const video = document.getElementById('videoPlayer');
        if (video && !video.paused) video.pause();
        videoMockState.mockPlaying = false;
        updateVideoPlaybackButtons();
        if (typeof showAllTracks === 'function') showAllTracks();
    }

    try {
        sessionStorage.setItem('w41it-media-mode', isVideo ? 'video' : 'audio');
    } catch {}

    if (window.innerWidth <= 900 && typeof closeSidebar === 'function') closeSidebar();
}

function renderVideoHome() {
    renderVideoGenreFilters();
    renderVideoWhatsNew();
    renderVideoContinueWatching();
    renderVideoSeriesGrid();
}

function createVideoSeriesCard(series, { compact = false, isNew = false } = {}) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'video-series-card';
    card.dataset.seriesId = series.id;
    card.onclick = () => openVideoWatch(series.id, 1);

    const art = document.createElement('span');
    art.className = 'video-series-art';

    const image = document.createElement('img');
    image.src = getVideoSeriesPoster(series);
    image.alt = '';
    image.loading = compact ? 'eager' : 'lazy';
    art.appendChild(image);

    if (isNew) {
        const badge = document.createElement('span');
        badge.className = 'video-new-badge';
        badge.textContent = 'NEW';
        art.appendChild(badge);
    }

    const title = document.createElement('span');
    title.className = 'video-series-title';
    title.textContent = series.title;

    const meta = document.createElement('span');
    meta.className = 'video-series-meta';
    meta.textContent = `${series.genre} • ${series.year}`;

    card.append(art, title, meta);
    return card;
}

function renderVideoWhatsNew() {
    const grid = document.getElementById('videoWhatsNewGrid');
    if (!grid) return;
    grid.replaceChildren();
    VIDEO_MOCK_SERIES.slice(0, 7).forEach(series => {
        grid.appendChild(createVideoSeriesCard(series, { compact: true, isNew: true }));
    });
}

function renderVideoContinueWatching() {
    const grid = document.getElementById('videoContinueGrid');
    if (!grid) return;
    grid.replaceChildren();

    const items = [
        { seriesId: 'nocturne-protocol', episode: 7, progress: 62 },
        { seriesId: 'eclipsed-horizon', episode: 4, progress: 78 },
        { seriesId: 'whispers-after-class', episode: 3, progress: 54 }
    ];

    items.forEach(item => {
        const series = getVideoSeries(item.seriesId);
        const episode = getVideoEpisode(series, item.episode);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'video-continue-card';
        button.onclick = () => openVideoWatch(series.id, episode.number);
        button.innerHTML = `
            <span class="video-continue-thumb" style="background-image:url('${episode.thumbnail}')"></span>
            <span class="video-continue-copy">
                <strong>${escapeVideoHtml(series.title)}</strong>
                <span>S1 E${episode.number} · ${escapeVideoHtml(episode.title)}</span>
                <span class="video-continue-progress"><i style="width:${item.progress}%"></i></span>
            </span>`;
        grid.appendChild(button);
    });
}

function renderVideoGenreFilters() {
    const filters = document.getElementById('videoGenreFilters');
    if (!filters) return;
    filters.replaceChildren();

    VIDEO_GENRES.forEach(genre => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `video-filter-chip${videoMockState.activeGenre === genre ? ' active' : ''}`;
        button.textContent = genre;
        button.onclick = () => {
            videoMockState.activeGenre = genre;
            renderVideoGenreFilters();
            renderVideoSeriesGrid();
        };
        filters.appendChild(button);
    });
}

function renderVideoSeriesGrid() {
    const grid = document.getElementById('videoSeriesGrid');
    if (!grid) return;

    const query = videoMockState.search.trim().toLowerCase();
    const activeGenre = videoMockState.activeGenre;
    const filtered = VIDEO_MOCK_SERIES.filter(series => {
        const genreMatches = activeGenre === 'All' || series.genre === activeGenre;
        const queryMatches = !query
            || series.title.toLowerCase().includes(query)
            || series.genre.toLowerCase().includes(query)
            || series.description.toLowerCase().includes(query);
        return genreMatches && queryMatches;
    });

    grid.replaceChildren();
    filtered.forEach(series => grid.appendChild(createVideoSeriesCard(series)));

    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'grid-column:1/-1;padding:28px 4px;color:#8f9bad;font-size:.82rem;';
        empty.textContent = 'No demo series match this filter.';
        grid.appendChild(empty);
    }
}

function showVideoHome() {
    document.getElementById('videoHomeView')?.classList.remove('hidden');
    document.getElementById('videoWatchView')?.classList.add('hidden');
    const page = document.getElementById('videoHomeView');
    if (page) page.scrollTop = 0;
}

function openVideoWatch(seriesId, episodeNumber = 1) {
    const series = getVideoSeries(seriesId);
    const episodes = makeVideoEpisodes(series);
    const requestedEpisode = Number(episodeNumber);
    const selectedEpisode = episodes.find(episode => episode.number === requestedEpisode) || episodes[0];
    if (!selectedEpisode) return;

    videoMockState.activeSeriesId = series.id;
    videoMockState.activeEpisode = selectedEpisode.number;
    videoMockState.currentSeconds = 0;
    videoMockState.mockPlaying = false;

    document.getElementById('videoHomeView')?.classList.add('hidden');
    document.getElementById('videoWatchView')?.classList.remove('hidden');
    renderVideoWatchView();

    const page = document.getElementById('videoWatchView');
    if (page) page.scrollTop = 0;
}

function renderVideoWatchView() {
    const series = getVideoSeries(videoMockState.activeSeriesId);
    const episodes = makeVideoEpisodes(series);
    const episode = getVideoEpisode(series, videoMockState.activeEpisode);
    const video = document.getElementById('videoPlayer');

    if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.poster = getVideoSeriesBackdrop(series);

        if (episode.fileUrl) {
            video.src = episode.fileUrl;
            installVideoSubtitleTracks(video, episode);
            video.load();
        } else {
            removeVideoSubtitleTracks(video);
            rebuildVideoSubtitleSelector([]);
        }
    }

    const breadcrumb = document.getElementById('videoBreadcrumb');
    if (breadcrumb) breadcrumb.textContent = `Video  /  ${series.title}  /  S1 E${episode.number}`;

    const seriesName = document.getElementById('videoWatchSeriesName');
    if (seriesName) seriesName.textContent = series.title;

    const title = document.getElementById('videoWatchEpisodeTitle');
    if (title) title.textContent = `S1 E${episode.number} · ${episode.title}`;

    const description = document.getElementById('videoWatchDescription');
    if (description) description.textContent = series.description;

    const meta = document.getElementById('videoWatchMeta');
    if (meta) {
        meta.innerHTML = `
            <span>Season 1</span>
            <span>Episode ${episode.number}</span>
            <span>${episode.duration}</span>
            <span>${escapeVideoHtml(series.genre)}</span>
            <span>${escapeVideoHtml(episode.quality || '720p')}</span>
            <span>${episode.fileUrl ? 'VPS stream' : 'Frontend mock'}</span>`;
    }

    const qualityBadge = document.querySelector('#videoStage .video-quality-badge');
    if (qualityBadge) qualityBadge.textContent = episode.quality || '720p';

    const panelTitle = document.getElementById('videoEpisodePanelTitle');
    if (panelTitle) panelTitle.textContent = series.title;
    const poster = document.getElementById('videoEpisodeSeriesPoster');
    if (poster) {
        poster.src = getVideoSeriesPoster(series);
        poster.alt = `${series.title} cover`;
    }
    const count = document.getElementById('videoEpisodeCount');
    if (count) count.textContent = `${episodes.length} Episodes`;

    renderVideoEpisodeList(series, episodes);
    resetVideoControlState(episode);
}

function renderVideoEpisodeList(series, episodes = makeVideoEpisodes(series)) {
    const list = document.getElementById('videoEpisodeList');
    if (!list) return;
    list.replaceChildren();

    episodes.forEach(episode => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = `video-episode-row${episode.number === videoMockState.activeEpisode ? ' active' : ''}`;
        row.dataset.episode = String(episode.number);
        row.onclick = () => openVideoWatch(series.id, episode.number);

        const stateIcon = episode.number < videoMockState.activeEpisode
            ? '<i class="fas fa-check-circle" title="Watched in mock state"></i>'
            : episode.number === videoMockState.activeEpisode
                ? '<i class="fas fa-play-circle"></i>'
                : '<i class="fas fa-ellipsis-v"></i>';

        row.innerHTML = `
            <img class="video-episode-thumb" src="${episode.thumbnail}" alt="">
            <span class="video-episode-number">${episode.number}</span>
            <span class="video-episode-copy">
                <strong>${escapeVideoHtml(episode.title)}</strong>
                <span>${episode.duration}</span>
            </span>
            <span class="video-episode-state">${stateIcon}</span>`;
        list.appendChild(row);
    });

    requestAnimationFrame(() => {
        list.querySelector('.video-episode-row.active')?.scrollIntoView({ block: 'nearest' });
    });
}

function resetVideoControlState(episode) {
    const seek = document.getElementById('videoSeekbar');
    if (seek) seek.value = '0';
    videoMockState.currentSeconds = 0;
    videoMockState.mockPlaying = false;
    updateVideoTimeReadout(0, parseDurationSeconds(episode.duration));
    updateVideoPlaybackButtons();
}

function updateVideoPlaybackButtons() {
    const video = document.getElementById('videoPlayer');
    const actuallyPlaying = video && video.currentSrc && !video.paused && !video.ended;
    const playing = Boolean(actuallyPlaying || videoMockState.mockPlaying);
    const iconClass = playing ? 'fas fa-pause' : 'fas fa-play';

    const playButton = document.getElementById('videoPlayBtn');
    const stageButton = document.getElementById('videoStagePlayBtn');
    if (playButton) playButton.innerHTML = `<i class="${iconClass}"></i>`;
    if (stageButton) {
        stageButton.innerHTML = `<i class="${iconClass}"></i>`;
        stageButton.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    }
}

async function toggleVideoPlayback() {
    const video = document.getElementById('videoPlayer');
    if (!video) return;

    if (!video.currentSrc) {
        videoMockState.mockPlaying = !videoMockState.mockPlaying;
        updateVideoPlaybackButtons();
        showVideoMockToast(
            videoMockState.mockPlaying
                ? 'Frontend demo playback. Add episode.fileUrl later to stream the real VPS video.'
                : 'Demo playback paused.'
        );
        return;
    }

    try {
        if (video.paused) await video.play();
        else video.pause();
    } catch (error) {
        console.warn('Video playback failed:', error);
        showVideoMockToast('The browser could not start this video source.');
    }
    updateVideoPlaybackButtons();
}

function videoPreviousEpisode() {
    const series = getVideoSeries(videoMockState.activeSeriesId);
    const episodes = makeVideoEpisodes(series);
    const currentIndex = episodes.findIndex(episode => episode.number === videoMockState.activeEpisode);
    if (currentIndex <= 0) {
        showVideoMockToast('This is the first available episode.');
        return;
    }
    openVideoWatch(series.id, episodes[currentIndex - 1].number);
}

function videoNextEpisode() {
    const series = getVideoSeries(videoMockState.activeSeriesId);
    const episodes = makeVideoEpisodes(series);
    const currentIndex = episodes.findIndex(episode => episode.number === videoMockState.activeEpisode);
    if (currentIndex < 0 || currentIndex >= episodes.length - 1) {
        showVideoMockToast('This is the last available episode.');
        return;
    }
    openVideoWatch(series.id, episodes[currentIndex + 1].number);
}

function toggleVideoMute() {
    const video = document.getElementById('videoPlayer');
    if (!video) return;
    video.muted = !video.muted;
    const button = document.getElementById('videoMuteBtn');
    if (button) button.innerHTML = `<i class="fas ${video.muted ? 'fa-volume-mute' : 'fa-volume-up'}"></i>`;
}

function toggleVideoFullscreen() {
    const stage = document.getElementById('videoStage');
    if (!stage) return;
    if (document.fullscreenElement) {
        document.exitFullscreen?.();
        return;
    }
    stage.requestFullscreen?.().catch(() => showVideoMockToast('Fullscreen is unavailable in this browser.'));
}

function updateVideoTimeReadout(current, duration) {
    const readout = document.getElementById('videoTimeReadout');
    if (readout) readout.textContent = `${formatVideoTime(current)} / ${formatVideoTime(duration)}`;
}

function removeVideoSubtitleTracks(video) {
    video.querySelectorAll('track').forEach(track => track.remove());
}

function rebuildVideoSubtitleSelector(subtitles = []) {
    const select = document.getElementById('videoSubtitleSelect');
    if (!select) return;

    select.replaceChildren();

    subtitles.forEach(track => {
        const option = document.createElement('option');
        option.value = track.lang;
        option.textContent = track.label;
        option.selected = Boolean(track.default);
        select.appendChild(option);
    });

    const off = document.createElement('option');
    off.value = 'off';
    off.textContent = 'Off';
    if (subtitles.length === 0) off.selected = true;
    select.appendChild(off);
}

function installVideoSubtitleTracks(video, episode) {
    removeVideoSubtitleTracks(video);
    const subtitles = Array.isArray(episode.subtitles) ? episode.subtitles : [];
    rebuildVideoSubtitleSelector(subtitles);

    subtitles.forEach((subtitle, index) => {
        if (!subtitle.src) return;
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.srclang = subtitle.lang;
        track.label = subtitle.label;
        track.src = subtitle.src;
        track.default = Boolean(subtitle.default || (index === 0 && !subtitles.some(item => item.default)));
        video.appendChild(track);
    });

    requestAnimationFrame(applySelectedSubtitle);
}

function applySelectedSubtitle() {
    const video = document.getElementById('videoPlayer');
    const select = document.getElementById('videoSubtitleSelect');
    if (!video || !select) return;

    const selectedLanguage = select.value;
    Array.from(video.textTracks || []).forEach(track => {
        track.mode = selectedLanguage !== 'off' && track.language === selectedLanguage ? 'showing' : 'disabled';
    });

    if (!video.querySelector('track')) {
        showVideoMockToast('No subtitle tracks are available for this episode yet.');
    }
}

function scrollVideoLibraryIntoView() {
    document.getElementById('videoAllSeriesSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showVideoMockToast(message) {
    const toast = document.getElementById('videoMockToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(videoMockState.toastTimer);
    videoMockState.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function escapeVideoHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function initializeVideoMock() {
    renderVideoHome();

    const search = document.getElementById('videoSearchInput');
    if (search) {
        search.addEventListener('input', event => {
            videoMockState.search = event.target.value || '';
            renderVideoSeriesGrid();
        });
    }

    const subtitleSelect = document.getElementById('videoSubtitleSelect');
    subtitleSelect?.addEventListener('change', applySelectedSubtitle);

    const volume = document.getElementById('videoVolume');
    volume?.addEventListener('input', event => {
        const video = document.getElementById('videoPlayer');
        if (video) {
            video.volume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
            if (video.volume > 0) video.muted = false;
        }
    });

    const seek = document.getElementById('videoSeekbar');
    seek?.addEventListener('input', event => {
        const video = document.getElementById('videoPlayer');
        const series = getVideoSeries(videoMockState.activeSeriesId);
        const episode = getVideoEpisode(series, videoMockState.activeEpisode);
        const duration = video?.duration && Number.isFinite(video.duration)
            ? video.duration
            : parseDurationSeconds(episode.duration);
        const target = duration * (Number(event.target.value) / 1000);

        if (video?.currentSrc && Number.isFinite(video.duration)) video.currentTime = target;
        else videoMockState.currentSeconds = target;

        updateVideoTimeReadout(target, duration);
    });

    const video = document.getElementById('videoPlayer');
    if (video) {
        video.addEventListener('play', updateVideoPlaybackButtons);
        video.addEventListener('pause', updateVideoPlaybackButtons);
        video.addEventListener('ended', () => {
            updateVideoPlaybackButtons();
            videoNextEpisode();
        });
        video.addEventListener('timeupdate', () => {
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;
            const seekbar = document.getElementById('videoSeekbar');
            if (seekbar) seekbar.value = String(Math.round((video.currentTime / video.duration) * 1000));
            updateVideoTimeReadout(video.currentTime, video.duration);
        });
    }

    // Keep mock controls visibly alive before a real video source is connected.
    setInterval(() => {
        if (!videoMockState.mockPlaying) return;
        const currentSeries = getVideoSeries(videoMockState.activeSeriesId);
        const currentEpisode = getVideoEpisode(currentSeries, videoMockState.activeEpisode);
        const duration = parseDurationSeconds(currentEpisode.duration);
        videoMockState.currentSeconds = Math.min(duration, videoMockState.currentSeconds + 1);

        const seekbar = document.getElementById('videoSeekbar');
        if (seekbar) seekbar.value = String(Math.round((videoMockState.currentSeconds / duration) * 1000));
        updateVideoTimeReadout(videoMockState.currentSeconds, duration);

        if (videoMockState.currentSeconds >= duration) {
            videoMockState.mockPlaying = false;
            updateVideoPlaybackButtons();
            videoNextEpisode();
        }
    }, 1000);

    // Audio remains the default mode so existing behavior is unchanged on deploy.
    switchMediaMode('audio');
}

document.addEventListener('DOMContentLoaded', initializeVideoMock);
