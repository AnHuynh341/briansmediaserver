// ==========================================================
// W41IT VIDEO MODE
// ==========================================================
// The UI is currently driven by the real VPS-backed catalog below.
// Later, replace VIDEO_SERIES with Appwrite videoSeries/videoEpisodes
// documents without rebuilding the player or library UI.

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

const VIDEO_SERIES = [
    {
        id: 'smoking-behind-supermarket',
        title: 'Smoking Behind the Supermarket with You',
        year: 2026,
        genre: 'Drama',
        posterPath: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/thumbnail.jpg',
        backdropPath: '/anime/Smoking%20Behind%20the%20Supermarket%20with%20You/S01E06/thumbnail.jpg',
        description: 'VPS-backed video library. Video, artwork and subtitles are served from the W41IT media origin.',
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
    }
];

const VIDEO_EPISODE_DURATIONS = ['23:41', '23:28', '23:17', '23:45', '23:36', '23:36', '23:51', '24:02', '23:44', '24:15', '23:38', '24:30'];
const VIDEO_GENRES = ['All', ...new Set(VIDEO_SERIES.map(series => series.genre).filter(Boolean))];

const videoState = {
    activeSeriesId: 'smoking-behind-supermarket',
    activeEpisode: 6,
    activeGenre: 'All',
    search: '',
    toastTimer: null,
    fallbackPlaying: false,
    currentSeconds: 0,
    subtitleLanguage: null,
    playbackRate: 1,
    loopEpisode: false
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
        thumbnail: getVideoSeriesPoster(series),
        fileUrl: '',
        subtitles: []
    }));
}

function getVideoSeries(seriesId) {
    return VIDEO_SERIES.find(series => series.id === seriesId) || VIDEO_SERIES[0];
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

function updateVideoRangeFill(input, value = input?.value) {
    if (!input) return;
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : min;
    const span = max - min;
    const percent = span > 0
        ? Math.max(0, Math.min(100, ((safeValue - min) / span) * 100))
        : 0;
    input.style.setProperty('--video-range-fill', `${percent}%`);
}

function updateVideoVolumeUi() {
    const video = document.getElementById('videoPlayer');
    const volume = document.getElementById('videoVolume');
    const button = document.getElementById('videoMuteBtn');
    if (!video) return;

    const volumePercent = Math.round(Math.max(0, Math.min(1, video.volume)) * 100);
    if (volume) {
        volume.value = String(volumePercent);
        // Keep the chosen volume value while muted, but visually empty the bar.
        updateVideoRangeFill(volume, video.muted ? 0 : volumePercent);
    }

    if (button) {
        const icon = video.muted || video.volume === 0
            ? 'fa-volume-mute'
            : video.volume < 0.5
                ? 'fa-volume-down'
                : 'fa-volume-up';
        button.innerHTML = `<i class="fas ${icon}"></i>`;
        button.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        button.title = video.muted ? 'Unmute' : 'Mute';
    }
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
        videoState.fallbackPlaying = false;
        updateVideoPlaybackButtons();
        if (typeof showAllTracks === 'function') showAllTracks();
    }

    try {
        sessionStorage.setItem('w41it-media-mode', isVideo ? 'video' : 'audio');
    } catch {}

    if (window.innerWidth <= 900 && typeof closeSidebar === 'function') closeSidebar();
}

function renderVideoHome() {
    const hero = document.querySelector('.video-hero');
    const featuredSeries = VIDEO_SERIES[0];
    if (hero && featuredSeries) {
        hero.style.setProperty('--video-hero-image', `url("${getVideoSeriesBackdrop(featuredSeries)}")`);
    }

    renderVideoGenreFilters();
    renderVideoWhatsNew();
    renderVideoSeriesGrid();
}

function createVideoSeriesCard(series, { compact = false, isNew = false } = {}) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'video-series-card';
    card.dataset.seriesId = series.id;
    const firstEpisode = makeVideoEpisodes(series)[0];
    card.onclick = () => openVideoWatch(series.id, firstEpisode?.number);

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
    VIDEO_SERIES.slice(0, 7).forEach(series => {
        grid.appendChild(createVideoSeriesCard(series, { compact: true, isNew: true }));
    });
}

function renderVideoGenreFilters() {
    const filters = document.getElementById('videoGenreFilters');
    if (!filters) return;
    filters.replaceChildren();

    VIDEO_GENRES.forEach(genre => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `video-filter-chip${videoState.activeGenre === genre ? ' active' : ''}`;
        button.textContent = genre;
        button.onclick = () => {
            videoState.activeGenre = genre;
            renderVideoGenreFilters();
            renderVideoSeriesGrid();
        };
        filters.appendChild(button);
    });
}

function renderVideoSeriesGrid() {
    const grid = document.getElementById('videoSeriesGrid');
    if (!grid) return;

    const query = videoState.search.trim().toLowerCase();
    const activeGenre = videoState.activeGenre;
    const filtered = VIDEO_SERIES.filter(series => {
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
        empty.textContent = 'No series match this filter.';
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

    videoState.activeSeriesId = series.id;
    videoState.activeEpisode = selectedEpisode.number;
    videoState.currentSeconds = 0;
    videoState.fallbackPlaying = false;

    document.getElementById('videoHomeView')?.classList.add('hidden');
    document.getElementById('videoWatchView')?.classList.remove('hidden');
    renderVideoWatchView();

    const page = document.getElementById('videoWatchView');
    if (page) page.scrollTop = 0;
}

function renderVideoWatchView() {
    const series = getVideoSeries(videoState.activeSeriesId);
    const episodes = makeVideoEpisodes(series);
    const episode = getVideoEpisode(series, videoState.activeEpisode);
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
            <span>${episode.fileUrl ? 'VPS stream' : 'No source'}</span>`;
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
    closeVideoSettings();

    if (video) {
        video.playbackRate = videoState.playbackRate;
        video.loop = videoState.loopEpisode;
    }
    updateVideoSettingsUi();
}

function renderVideoEpisodeList(series, episodes = makeVideoEpisodes(series)) {
    const list = document.getElementById('videoEpisodeList');
    if (!list) return;
    list.replaceChildren();

    episodes.forEach(episode => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = `video-episode-row${episode.number === videoState.activeEpisode ? ' active' : ''}`;
        row.dataset.episode = String(episode.number);
        row.onclick = () => openVideoWatch(series.id, episode.number);

        const stateIcon = episode.number < videoState.activeEpisode
            ? '<i class="fas fa-check-circle" title="Watched"></i>'
            : episode.number === videoState.activeEpisode
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
    if (seek) {
        seek.value = '0';
        updateVideoRangeFill(seek, 0);
    }
    videoState.currentSeconds = 0;
    videoState.fallbackPlaying = false;
    updateVideoTimeReadout(0, parseDurationSeconds(episode.duration));
    updateVideoPlaybackButtons();
    updateVideoVolumeUi();
}

function updateVideoPlaybackButtons() {
    const video = document.getElementById('videoPlayer');
    const actuallyPlaying = video && video.currentSrc && !video.paused && !video.ended;
    const playing = Boolean(actuallyPlaying || videoState.fallbackPlaying);
    const iconClass = playing ? 'fas fa-pause' : 'fas fa-play';

    const playButton = document.getElementById('videoPlayBtn');
    const stageButton = document.getElementById('videoStagePlayBtn');
    const qualityBadge = document.querySelector('#videoStage .video-quality-badge');
    if (playButton) playButton.innerHTML = `<i class="${iconClass}"></i>`;
    if (stageButton) {
        stageButton.innerHTML = `<i class="${iconClass}"></i>`;
        stageButton.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
        stageButton.classList.toggle('is-hidden', playing);
    }
    qualityBadge?.classList.toggle('is-hidden', playing);
}

async function toggleVideoPlayback() {
    const video = document.getElementById('videoPlayer');
    if (!video) return;

    if (!video.currentSrc) {
        videoState.fallbackPlaying = !videoState.fallbackPlaying;
        updateVideoPlaybackButtons();
        showVideoToast(
            videoState.fallbackPlaying
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
        showVideoToast('The browser could not start this video source.');
    }
    updateVideoPlaybackButtons();
}

function videoPreviousEpisode() {
    const series = getVideoSeries(videoState.activeSeriesId);
    const episodes = makeVideoEpisodes(series);
    const currentIndex = episodes.findIndex(episode => episode.number === videoState.activeEpisode);
    if (currentIndex <= 0) {
        showVideoToast('This is the first available episode.');
        return;
    }
    openVideoWatch(series.id, episodes[currentIndex - 1].number);
}

function videoNextEpisode() {
    const series = getVideoSeries(videoState.activeSeriesId);
    const episodes = makeVideoEpisodes(series);
    const currentIndex = episodes.findIndex(episode => episode.number === videoState.activeEpisode);
    if (currentIndex < 0 || currentIndex >= episodes.length - 1) {
        showVideoToast('This is the last available episode.');
        return;
    }
    openVideoWatch(series.id, episodes[currentIndex + 1].number);
}

function toggleVideoMute() {
    const video = document.getElementById('videoPlayer');
    if (!video) return;
    video.muted = !video.muted;
    updateVideoVolumeUi();
}

function toggleVideoFullscreen() {
    const stage = document.getElementById('videoStage');
    if (!stage) return;
    if (document.fullscreenElement) {
        document.exitFullscreen?.();
        return;
    }
    stage.requestFullscreen?.().catch(() => showVideoToast('Fullscreen is unavailable in this browser.'));
}

function closeVideoSettings() {
    const menu = document.getElementById('videoSettingsMenu');
    const button = document.getElementById('videoSettingsBtn');
    if (!menu || !button) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
}

function toggleVideoSettings(event) {
    event?.stopPropagation?.();
    const menu = document.getElementById('videoSettingsMenu');
    const button = document.getElementById('videoSettingsBtn');
    if (!menu || !button) return;

    const opening = !menu.classList.contains('is-open');
    closeVideoSettings();
    if (opening) {
        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        button.setAttribute('aria-expanded', 'true');
        updateVideoSettingsUi();
    }
}

function updateVideoSettingsUi() {
    const rate = Number(videoState.playbackRate) || 1;
    document.querySelectorAll('[data-video-rate]').forEach(button => {
        const buttonRate = Number(button.dataset.videoRate);
        button.classList.toggle('active', Math.abs(buttonRate - rate) < 0.001);
        button.setAttribute('aria-pressed', Math.abs(buttonRate - rate) < 0.001 ? 'true' : 'false');
    });

    const loopButton = document.getElementById('videoLoopToggle');
    if (loopButton) {
        loopButton.textContent = videoState.loopEpisode ? 'On' : 'Off';
        loopButton.classList.toggle('active', videoState.loopEpisode);
        loopButton.setAttribute('aria-pressed', videoState.loopEpisode ? 'true' : 'false');
    }
}

function setVideoPlaybackRate(rate) {
    const safeRate = Math.min(2, Math.max(0.5, Number(rate) || 1));
    videoState.playbackRate = safeRate;
    const video = document.getElementById('videoPlayer');
    if (video) video.playbackRate = safeRate;
    updateVideoSettingsUi();
}

function toggleVideoLoop() {
    videoState.loopEpisode = !videoState.loopEpisode;
    const video = document.getElementById('videoPlayer');
    if (video) video.loop = videoState.loopEpisode;
    updateVideoSettingsUi();
}

function updateVideoTimeReadout(current, duration) {
    const readout = document.getElementById('videoTimeReadout');
    if (readout) readout.textContent = `${formatVideoTime(current)} / ${formatVideoTime(duration)}`;
}

function removeVideoSubtitleTracks(video) {
    if (!video) return;

    Array.from(video.textTracks || []).forEach(track => {
        track.mode = 'disabled';
    });

    video.querySelectorAll('track').forEach(track => {
        track.default = false;
        track.remove();
    });
}

function chooseVideoSubtitleLanguage(subtitles = []) {
    const available = new Set(subtitles.map(track => track.lang));
    if (videoState.subtitleLanguage && available.has(videoState.subtitleLanguage)) {
        return videoState.subtitleLanguage;
    }

    const preferred = subtitles.find(track => track.default) || subtitles[0];
    return preferred?.lang || 'off';
}

function rebuildVideoSubtitleSelector(subtitles = []) {
    const select = document.getElementById('videoSubtitleSelect');
    if (!select) return;

    const selectedLanguage = chooseVideoSubtitleLanguage(subtitles);
    select.replaceChildren();

    subtitles.forEach(track => {
        const option = document.createElement('option');
        option.value = track.lang;
        option.textContent = track.label;
        select.appendChild(option);
    });

    const off = document.createElement('option');
    off.value = 'off';
    off.textContent = 'Off';
    select.appendChild(off);

    select.value = selectedLanguage;
    videoState.subtitleLanguage = selectedLanguage;
}

function installVideoSubtitleTracks(video, episode) {
    removeVideoSubtitleTracks(video);
    const subtitles = Array.isArray(episode.subtitles) ? episode.subtitles : [];
    rebuildVideoSubtitleSelector(subtitles);

    subtitles.forEach(subtitle => {
        if (!subtitle.src) return;

        const trackElement = document.createElement('track');
        trackElement.kind = 'subtitles';
        trackElement.srclang = subtitle.lang;
        trackElement.label = subtitle.label;
        trackElement.src = subtitle.src;

        // Do not use the HTML default flag. Some browsers can re-enable the
        // default text track asynchronously and leave two subtitle tracks showing.
        trackElement.default = false;
        trackElement.addEventListener('load', () => applySelectedSubtitle());
        video.appendChild(trackElement);

        if (trackElement.track) trackElement.track.mode = 'disabled';
    });

    requestAnimationFrame(() => applySelectedSubtitle());
}

function applySelectedSubtitle() {
    const video = document.getElementById('videoPlayer');
    const select = document.getElementById('videoSubtitleSelect');
    if (!video || !select) return;

    const selectedLanguage = select.value || 'off';
    videoState.subtitleLanguage = selectedLanguage;
    const trackElements = Array.from(video.querySelectorAll('track'));

    // Control only the track elements that belong to the current episode.
    // Disable all of them first, then enable exactly one. This avoids stale
    // TextTrack entries or browser "default" races leaving two tracks visible.
    trackElements.forEach(trackElement => {
        if (trackElement.track) trackElement.track.mode = 'disabled';
    });

    if (selectedLanguage !== 'off') {
        const selectedTrackElement = trackElements.find(
            trackElement => trackElement.srclang === selectedLanguage
        );
        if (selectedTrackElement?.track) selectedTrackElement.track.mode = 'showing';
    }

    if (trackElements.length === 0) {
        showVideoToast('No subtitle tracks are available for this episode yet.');
    }
}

function scrollVideoLibraryIntoView() {
    document.getElementById('videoAllSeriesSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showVideoToast(message) {
    const toast = document.getElementById('videoToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(videoState.toastTimer);
    videoState.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function escapeVideoHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function initializeVideo() {
    renderVideoHome();

    const search = document.getElementById('videoSearchInput');
    if (search) {
        search.addEventListener('input', event => {
            videoState.search = event.target.value || '';
            renderVideoSeriesGrid();
        });
    }

    const subtitleSelect = document.getElementById('videoSubtitleSelect');
    subtitleSelect?.addEventListener('change', () => {
        applySelectedSubtitle();
        // Re-apply after the browser has processed the select/change event.
        requestAnimationFrame(() => applySelectedSubtitle());
    });

    const volume = document.getElementById('videoVolume');
    if (volume) {
        updateVideoRangeFill(volume, Number(volume.value));
        volume.addEventListener('input', event => {
            const video = document.getElementById('videoPlayer');
            const nextVolume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
            updateVideoRangeFill(volume, Number(event.target.value));
            if (video) {
                video.volume = nextVolume;
                if (nextVolume > 0) video.muted = false;
                updateVideoVolumeUi();
            }
        });
    }

    const seek = document.getElementById('videoSeekbar');
    if (seek) {
        updateVideoRangeFill(seek, Number(seek.value));
        seek.addEventListener('input', event => {
            const video = document.getElementById('videoPlayer');
            const series = getVideoSeries(videoState.activeSeriesId);
            const episode = getVideoEpisode(series, videoState.activeEpisode);
            const duration = video?.duration && Number.isFinite(video.duration)
                ? video.duration
                : parseDurationSeconds(episode.duration);
            const sliderValue = Number(event.target.value);
            const target = duration * (sliderValue / 1000);

            updateVideoRangeFill(seek, sliderValue);
            if (video?.currentSrc && Number.isFinite(video.duration)) video.currentTime = target;
            else videoState.currentSeconds = target;

            updateVideoTimeReadout(target, duration);
        });
    }

    const video = document.getElementById('videoPlayer');
    if (video) {
        video.addEventListener('play', updateVideoPlaybackButtons);
        video.addEventListener('pause', updateVideoPlaybackButtons);
        video.addEventListener('click', event => {
            if (event.button !== 0) return;
            void toggleVideoPlayback();
        });
        video.addEventListener('loadedmetadata', () => {
            video.playbackRate = videoState.playbackRate;
            video.loop = videoState.loopEpisode;
            applySelectedSubtitle();
            const seekbar = document.getElementById('videoSeekbar');
            if (seekbar && Number.isFinite(video.duration) && video.duration > 0) {
                const value = Math.round((video.currentTime / video.duration) * 1000);
                seekbar.value = String(value);
                updateVideoRangeFill(seekbar, value);
            }
            updateVideoVolumeUi();
        });
        video.addEventListener('volumechange', updateVideoVolumeUi);
        video.addEventListener('ended', () => {
            updateVideoPlaybackButtons();
            if (!videoState.loopEpisode) videoNextEpisode();
        });
        video.addEventListener('timeupdate', () => {
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;
            const seekbar = document.getElementById('videoSeekbar');
            if (seekbar) {
                const value = Math.round((video.currentTime / video.duration) * 1000);
                seekbar.value = String(value);
                updateVideoRangeFill(seekbar, value);
            }
            updateVideoTimeReadout(video.currentTime, video.duration);
        });
    }

    document.addEventListener('click', event => {
        const settingsWrap = event.target?.closest?.('.video-settings-wrap');
        if (!settingsWrap) closeVideoSettings();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeVideoSettings();
    });

    // Keep fallback controls functional for catalog entries that do not yet have a source.
    setInterval(() => {
        if (!videoState.fallbackPlaying) return;
        const currentSeries = getVideoSeries(videoState.activeSeriesId);
        const currentEpisode = getVideoEpisode(currentSeries, videoState.activeEpisode);
        const duration = parseDurationSeconds(currentEpisode.duration);
        videoState.currentSeconds = Math.min(duration, videoState.currentSeconds + 1);

        const seekbar = document.getElementById('videoSeekbar');
        if (seekbar) {
            const value = Math.round((videoState.currentSeconds / duration) * 1000);
            seekbar.value = String(value);
            updateVideoRangeFill(seekbar, value);
        }
        updateVideoTimeReadout(videoState.currentSeconds, duration);

        if (videoState.currentSeconds >= duration) {
            videoState.fallbackPlaying = false;
            updateVideoPlaybackButtons();
            videoNextEpisode();
        }
    }, 1000);

    // Audio remains the default mode so existing behavior is unchanged on deploy.
    switchMediaMode('audio');
}

document.addEventListener('DOMContentLoaded', initializeVideo);
