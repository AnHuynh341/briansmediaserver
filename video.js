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
    if (seek) seek.value = '0';
    videoState.currentSeconds = 0;
    videoState.fallbackPlaying = false;
    updateVideoTimeReadout(0, parseDurationSeconds(episode.duration));
    updateVideoPlaybackButtons();
}

function updateVideoPlaybackButtons() {
    const video = document.getElementById('videoPlayer');
    const actuallyPlaying = video && video.currentSrc && !video.paused && !video.ended;
    const playing = Boolean(actuallyPlaying || videoState.fallbackPlaying);
    const iconClass = playing ? 'fas fa-pause' : 'fas fa-play';

    const playButton = document.getElementById('videoPlayBtn');
    const stageButton = document.getElementById('videoStagePlayBtn');
    if (playButton) playButton.innerHTML = `<i class="${iconClass}"></i>`;
    if (stageButton) {
        stageButton.innerHTML = `<i class="${iconClass}"></i>`;
        stageButton.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
        stageButton.classList.toggle('is-hidden', playing);
    }
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
    stage.requestFullscreen?.().catch(() => showVideoToast('Fullscreen is unavailable in this browser.'));
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
        const series = getVideoSeries(videoState.activeSeriesId);
        const episode = getVideoEpisode(series, videoState.activeEpisode);
        const duration = video?.duration && Number.isFinite(video.duration)
            ? video.duration
            : parseDurationSeconds(episode.duration);
        const target = duration * (Number(event.target.value) / 1000);

        if (video?.currentSrc && Number.isFinite(video.duration)) video.currentTime = target;
        else videoState.currentSeconds = target;

        updateVideoTimeReadout(target, duration);
    });

    const video = document.getElementById('videoPlayer');
    if (video) {
        video.addEventListener('play', updateVideoPlaybackButtons);
        video.addEventListener('pause', updateVideoPlaybackButtons);
        video.addEventListener('click', event => {
            if (event.button !== 0) return;
            void toggleVideoPlayback();
        });
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

    // Keep fallback controls functional for catalog entries that do not yet have a source.
    setInterval(() => {
        if (!videoState.fallbackPlaying) return;
        const currentSeries = getVideoSeries(videoState.activeSeriesId);
        const currentEpisode = getVideoEpisode(currentSeries, videoState.activeEpisode);
        const duration = parseDurationSeconds(currentEpisode.duration);
        videoState.currentSeconds = Math.min(duration, videoState.currentSeconds + 1);

        const seekbar = document.getElementById('videoSeekbar');
        if (seekbar) seekbar.value = String(Math.round((videoState.currentSeconds / duration) * 1000));
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
