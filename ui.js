
let activeLibraryView = 'all';
let activeSearchQuery = '';

const RECENT_UPLOAD_LIMIT = 7;

function getRecentlyUploadedTracks(limit = RECENT_UPLOAD_LIMIT) {
    return allTracks
        .map((track, index) => ({
            track,
            index,
            uploadedAt: new Date(track.createdAt || 0).getTime() || 0
        }))
        .sort((a, b) => (b.uploadedAt - a.uploadedAt) || (b.index - a.index))
        .slice(0, limit)
        .map(entry => entry.track);
}

function updateRecentlyUploadedVisibility() {
    const section = document.getElementById('recentlyUploadedSection');
    const allSongsHeading = document.getElementById('allSongsHeading');
    const shouldShow = activeLibraryView === 'all' && allTracks.length > 0;

    if (section) section.classList.toggle('hidden', !shouldShow);
    if (allSongsHeading) allSongsHeading.classList.toggle('hidden', !shouldShow);
}

function updateRecentlyUploadedActiveState() {
    const currentTrackId = allTracks[currentTrackIndex]?.id || '';

    document.querySelectorAll('.recent-upload-card[data-track-id]').forEach(card => {
        const active = card.dataset.trackId === currentTrackId;
        card.classList.toggle('active', active);
        card.setAttribute('aria-current', active ? 'true' : 'false');
    });
}

function renderRecentlyUploaded() {
    const section = document.getElementById('recentlyUploadedSection');
    const grid = document.getElementById('recentlyUploadedGrid');

    if (!section || !grid) return;

    const recentTracks = getRecentlyUploadedTracks();
    grid.replaceChildren();

    recentTracks.forEach(track => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'recent-upload-card';
        card.dataset.trackId = track.id;
        card.title = `Play ${getDisplayTrackName(track.name)}`;
        card.setAttribute('aria-label', `Play ${getDisplayTrackName(track.name)} by ${track.artist || 'Unknown Artist'}`);

        const coverWrap = document.createElement('span');
        coverWrap.className = 'recent-upload-cover-wrap';

        const cover = document.createElement('img');
        cover.className = 'recent-upload-cover';
        cover.alt = '';
        cover.loading = 'eager';
        cover.decoding = 'async';

        if (typeof setCoverImage === 'function') {
            setCoverImage(cover, track.cover, getDisplayTrackName(track.name));
        } else {
            cover.src = track.cover || createCoverPlaceholder(track.name);
        }

        const playBadge = document.createElement('span');
        playBadge.className = 'recent-upload-play-badge';
        playBadge.setAttribute('aria-hidden', 'true');
        playBadge.innerHTML = '<i class="fas fa-play"></i>';

        coverWrap.appendChild(cover);
        coverWrap.appendChild(playBadge);

        const title = document.createElement('span');
        title.className = 'recent-upload-title';
        title.textContent = getDisplayTrackName(track.name);

        const artist = document.createElement('span');
        artist.className = 'recent-upload-artist';
        artist.textContent = track.artist || 'Unknown Artist';

        card.appendChild(coverWrap);
        card.appendChild(title);
        card.appendChild(artist);

        card.addEventListener('click', () => {
            const originalIndex = allTracks.findIndex(item => item.id === track.id);
            if (originalIndex < 0) return;

            // What's New behaves as its own dynamic seven-track playlist. Its order
            // is newest -> oldest, while shuffle still randomizes only inside this set.
            setPlaybackQueueOverride(recentTracks, 'whats-new', track.id);
            void loadTrack(originalIndex, true, 'whats-new-direct');
        });

        grid.appendChild(card);
    });

    updateRecentlyUploadedVisibility();
    updateRecentlyUploadedActiveState();
}

function formatHeroRuntime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    }

    return `${Math.max(1, minutes)} min`;
}

function getHeroRuntimeSummary(tracks) {
    let knownSeconds = 0;
    let missingDurations = 0;

    tracks.forEach(track => {
        const duration = getKnownTrackDuration(track);
        if (duration) knownSeconds += duration;
        else missingDurations += 1;
    });

    if (tracks.length === 0) return '0 min';
    if (knownSeconds <= 0) return 'runtime scanning';

    const formatted = formatHeroRuntime(knownSeconds);
    return missingDurations > 0 ? `${formatted}+` : formatted;
}

function getHeroViewDetails() {
    if (activeLibraryView === 'playlist' && currentViewPlaylistIndex > -1) {
        const playlist = userPlaylists[currentViewPlaylistIndex];
        if (playlist) {
            const isMine = playlist.owner === currentUser;
            return {
                title: playlist.name,
                eyebrow: isMine ? 'Your Playlist' : `Shared by ${playlist.owner}`
            };
        }
    }

    if (activeLibraryView === 'search') {
        return {
            title: activeSearchQuery ? `Results for “${activeSearchQuery}”` : 'Search Results',
            eyebrow: 'Signal Search'
        };
    }

    return {
        title: 'All Tracks',
        eyebrow: 'Database Index'
    };
}

function updateHeroMosaic(tracks) {
    const fallbackTrack = tracks[0] || allTracks[0] || null;

    for (let index = 0; index < 4; index += 1) {
        const image = document.getElementById(`heroCover${index}`);
        if (!image) continue;

        const track = tracks[index] || fallbackTrack;
        const trackName = track ? getDisplayTrackName(track.name) : 'No Signals';
        const coverUrl = track ? track.cover : '';
        const coverKey = track ? `${track.id}|${coverUrl}` : 'empty';

        // Runtime totals update repeatedly while metadata is scanned. Avoid
        // reassigning identical image URLs on every telemetry refresh.
        if (image.dataset.coverKey === coverKey) continue;
        image.dataset.coverKey = coverKey;

        if (typeof setCoverImage === 'function') {
            setCoverImage(image, coverUrl, trackName);
        } else {
            image.src = coverUrl || '';
        }
    }
}

function updateLibraryHero() {
    const titleElement = document.getElementById('viewTitle');
    const eyebrowElement = document.getElementById('heroEyebrow');
    const metaElement = document.getElementById('heroMeta');
    const details = getHeroViewDetails();
    const tracks = Array.isArray(currentPlaylistTracks) ? currentPlaylistTracks : [];

    if (titleElement) titleElement.textContent = details.title;
    if (eyebrowElement) eyebrowElement.textContent = details.eyebrow;

    const artistCount = new Set(
        tracks
            .map(track => String(track.artist || 'Unknown Artist').trim().toLocaleLowerCase())
            .filter(Boolean)
    ).size;

    if (metaElement) {
        metaElement.textContent = `${tracks.length} songs • ${artistCount} artists • ${getHeroRuntimeSummary(tracks)}`;
    }

    updateHeroMosaic(tracks);
}

async function playCurrentView() {
    if (!currentPlaylistTracks.length) {
        return alert('No signals are available in this view.');
    }

    const currentTrack = allTracks[currentTrackIndex];
    const currentTrackIsVisible = currentTrack
        && currentPlaylistTracks.some(track => track.id === currentTrack.id);

    if (currentTrackIsVisible && audio.src) {
        if (audio.paused) await togglePlay();
        return;
    }

    const firstTrack = currentPlaylistTracks[0];
    const originalIndex = allTracks.findIndex(track => track.id === firstTrack.id);
    if (originalIndex > -1) await loadTrack(originalIndex, true, 'hero-play');
}

async function shuffleCurrentView() {
    if (!currentPlaylistTracks.length) {
        return alert('No signals are available in this view.');
    }

    isShuffle = true;
    localStorage.setItem('shuffleEnabled', 'true');

    const randomTrack = currentPlaylistTracks[
        Math.floor(Math.random() * currentPlaylistTracks.length)
    ];

    if (typeof resetShuffleState === 'function') resetShuffleState(randomTrack.id);
    if (typeof updatePlaybackModeButtons === 'function') updatePlaybackModeButtons();
    if (typeof updateSessionInfo === 'function') updateSessionInfo();

    const originalIndex = allTracks.findIndex(track => track.id === randomTrack.id);
    if (originalIndex > -1) await loadTrack(originalIndex, true, 'hero-shuffle');
}

function appendPlaylistSectionLabel(container, label, iconClass, shared = false) {
    const section = document.createElement('div');
    section.className = `playlist-section-label ${shared ? 'shared' : 'mine'}`;

    const icon = document.createElement('i');
    icon.className = iconClass;

    const text = document.createElement('span');
    text.innerText = label;

    section.appendChild(icon);
    section.appendChild(text);
    container.appendChild(section);
}

function renderPlaylists() {
    const container = document.getElementById('playlists');
    if (!container) return;

    container.innerHTML = '';

    if (userPlaylists.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'playlist-empty-state';
        empty.innerText = 'No playlists detected.';
        container.appendChild(empty);
        return;
    }

    let renderedMineHeader = false;
    let renderedSharedHeader = false;

    userPlaylists.forEach((pl, index) => {
        const isMine = pl.owner === currentUser;

        if (isMine && !renderedMineHeader) {
            appendPlaylistSectionLabel(container, 'Your Playlists', 'fas fa-star');
            renderedMineHeader = true;
        }

        if (!isMine && !renderedSharedHeader) {
            appendPlaylistSectionLabel(container, 'Shared Playlists', 'fas fa-users', true);
            renderedSharedHeader = true;
        }

        const div = document.createElement('div');
        div.className = [
            'playlist-item',
            isMine ? 'playlist-mine' : 'playlist-shared',
            currentViewPlaylistIndex === index ? 'active' : ''
        ].filter(Boolean).join(' ');

        div.title = isMine
            ? `${pl.name} — your playlist`
            : `${pl.name} — shared by ${pl.owner} (play only)`;

        const icon = document.createElement('i');
        icon.className = isMine ? 'fas fa-folder-open' : 'fas fa-headphones';
        icon.classList.add('playlist-icon');

        const name = document.createElement('span');
        name.className = 'playlist-name';
        name.innerText = pl.name;

        div.appendChild(icon);
        div.appendChild(name);

        if (!isMine) {
            const owner = document.createElement('span');
            owner.className = 'playlist-owner-badge';
            owner.innerText = pl.owner;
            div.appendChild(owner);
        }

        div.onclick = () => loadPlaylist(index);
        container.appendChild(div);
    });
}

function setPlaylistActionVisibility(show) {
    const editBtn = document.getElementById('editPlaylistBtn');
    const sortBtn = document.getElementById('sortPlaylistBtn');

    if (editBtn) editBtn.classList.toggle('hidden', !show);
    if (sortBtn) sortBtn.classList.toggle('hidden', !show);
}

function showAllTracks() {
    currentViewPlaylistIndex = -1;
    activeLibraryView = 'all';
    activeSearchQuery = '';

    const navAll = document.getElementById('navAllTracks');
    if (navAll) navAll.classList.add('active');

    const title = document.getElementById('viewTitle');
    if (title) title.innerText = 'All Tracks';

    setPlaylistActionVisibility(false);

    currentPlaylistTracks = [...allTracks];
    renderPlaylists();
    renderTrackList();
}

function loadPlaylist(index) {
    const pl = userPlaylists[index];
    if (!pl) {
        console.warn('Playlist index not found:', index);
        return;
    }

    currentViewPlaylistIndex = index;
    activeLibraryView = 'playlist';
    activeSearchQuery = '';

    const navAll = document.getElementById('navAllTracks');
    if (navAll) navAll.classList.remove('active');

    const title = document.getElementById('viewTitle');
    if (title) title.innerText = pl.name;

    // Only the owner can add/remove songs or save a new order.
    setPlaylistActionVisibility(pl.owner === currentUser);

    // playlist.ids is the source of truth for playlist order.
    // Using allTracks.filter(...) here would silently restore upload order.
    currentPlaylistTracks = pl.ids
        .map(trackId => allTracks.find(track => track.id === trackId))
        .filter(Boolean);

    renderPlaylists();
    renderTrackList();
}

const TRACK_DURATION_CACHE_KEY = 'w41it-track-durations-v1';
const trackDurationQueue = [];
const queuedTrackDurationIds = new Set();
let activeTrackDurationProbes = 0;
const MAX_TRACK_DURATION_PROBES = 4;

function readTrackDurationCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(TRACK_DURATION_CACHE_KEY) || '{}');
        return cached && typeof cached === 'object' ? cached : {};
    } catch (error) {
        console.warn('Could not read duration cache:', error);
        return {};
    }
}

const trackDurationCache = readTrackDurationCache();

function getTrackDurationCacheKey(track) {
    return `${track.id}|${track.file || ''}`;
}

function getKnownTrackDuration(track) {
    const directDuration = Number(track.duration);
    if (Number.isFinite(directDuration) && directDuration > 0) return directDuration;

    const cachedDuration = Number(trackDurationCache[getTrackDurationCacheKey(track)]);
    if (Number.isFinite(cachedDuration) && cachedDuration > 0) {
        track.duration = cachedDuration;
        return cachedDuration;
    }

    return null;
}

function formatTrackDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatTrackAddedTime(createdAt) {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '—';

    try {
        return new Intl.DateTimeFormat(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date).replace(',', ' ·');
    } catch (error) {
        return date.toLocaleString();
    }
}

function updateDurationCells(trackId, duration) {
    document.querySelectorAll('.track-duration[data-track-id]').forEach(cell => {
        if (cell.dataset.trackId === trackId) {
            cell.innerText = formatTrackDuration(duration);
            cell.classList.remove('duration-loading');
        }
    });
}

function storeTrackDuration(track, duration) {
    if (!Number.isFinite(duration) || duration <= 0) return;

    track.duration = duration;
    trackDurationCache[getTrackDurationCacheKey(track)] = Math.round(duration * 10) / 10;

    try {
        localStorage.setItem(TRACK_DURATION_CACHE_KEY, JSON.stringify(trackDurationCache));
    } catch (error) {
        console.warn('Could not save duration cache:', error);
    }

    updateDurationCells(track.id, duration);
    updateLibraryHero();
}

function queueTrackDurationProbe(track) {
    if (!track || !track.id || !track.file || getKnownTrackDuration(track)) return;
    if (queuedTrackDurationIds.has(track.id)) return;

    queuedTrackDurationIds.add(track.id);
    trackDurationQueue.push(track);
    pumpTrackDurationQueue();
}

function pumpTrackDurationQueue() {
    while (activeTrackDurationProbes < MAX_TRACK_DURATION_PROBES && trackDurationQueue.length > 0) {
        const track = trackDurationQueue.shift();
        activeTrackDurationProbes += 1;

        probeTrackDuration(track)
            .then(duration => {
                if (duration) storeTrackDuration(track, duration);
            })
            .catch(error => {
                console.debug(`Duration metadata unavailable for ${track.name}:`, error.message);
            })
            .finally(() => {
                queuedTrackDurationIds.delete(track.id);
                activeTrackDurationProbes -= 1;
                pumpTrackDurationQueue();
            });
    }
}

function probeTrackDuration(track) {
    return new Promise((resolve, reject) => {
        const metadataAudio = new Audio();
        let settled = false;

        const finish = (callback, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            metadataAudio.removeAttribute('src');
            metadataAudio.load();
            callback(value);
        };

        const resolveDuration = () => {
            const duration = Number(metadataAudio.duration);
            if (Number.isFinite(duration) && duration > 0) {
                finish(resolve, duration);
            }
        };

        const timeoutId = setTimeout(() => {
            finish(reject, new Error('metadata request timed out'));
        }, 12000);

        metadataAudio.preload = 'metadata';
        metadataAudio.crossOrigin = 'anonymous';
        metadataAudio.addEventListener('loadedmetadata', resolveDuration, { once: true });
        metadataAudio.addEventListener('durationchange', resolveDuration);
        metadataAudio.addEventListener('error', () => {
            finish(reject, new Error('audio metadata could not be loaded'));
        }, { once: true });
        metadataAudio.src = track.file;
        metadataAudio.load();
    });
}

function renderTrackList() {
    const list = document.getElementById('trackList');
    const header = document.getElementById('trackListHeader');
    if (!list) return;

    const isAdmin = currentUserRole === 'admin';
    if (header) header.classList.toggle('admin-mode', isAdmin);

    list.innerHTML = '';

    if (currentPlaylistTracks.length === 0) {
        list.innerHTML = '<div class="track-empty-state">No signals detected.</div>';
        updateRecentlyUploadedVisibility();
        updateRecentlyUploadedActiveState();
        updateLibraryHero();
        return;
    }

    currentPlaylistTracks.forEach((track, index) => {
        const div = document.createElement('div');
        div.className = `track${isAdmin ? ' admin-mode' : ''}`;

        const isPlaying = allTracks[currentTrackIndex]
            && allTracks[currentTrackIndex].id === track.id;

        if (isPlaying) div.classList.add('active');

        const trackNumber = document.createElement('div');
        trackNumber.className = 'track-num';

        if (isPlaying) {
            const playingIcon = document.createElement('i');
            playingIcon.className = 'fas fa-volume-up';
            trackNumber.appendChild(playingIcon);
        } else {
            trackNumber.innerText = String(index + 1);
        }

        const artCell = document.createElement('div');
        artCell.className = 'track-art-cell';

        const cover = document.createElement('img');
        cover.className = 'track-cover-thumb';
        cover.src = track.cover || createCoverPlaceholder(track.name);
        cover.alt = '';
        cover.loading = 'lazy';
        cover.onerror = () => {
            cover.onerror = null;
            cover.src = createCoverPlaceholder(track.name);
        };
        artCell.appendChild(cover);

        const titleCell = document.createElement('div');
        titleCell.className = 'track-title-cell';

        const trackTitle = document.createElement('span');
        trackTitle.className = 'track-title';
        trackTitle.innerText = getDisplayTrackName(track.name);

        const mobileArtist = document.createElement('span');
        mobileArtist.className = 'mobile-track-artist';
        mobileArtist.innerText = track.artist || 'Unknown Artist';

        titleCell.appendChild(trackTitle);
        titleCell.appendChild(mobileArtist);

        const artistCell = document.createElement('div');
        artistCell.className = 'track-artist';
        artistCell.innerText = track.artist || 'Unknown Artist';

        const addedCell = document.createElement('div');
        addedCell.className = 'track-added-time';
        addedCell.innerText = formatTrackAddedTime(track.createdAt);
        addedCell.title = track.createdAt ? new Date(track.createdAt).toLocaleString() : '';

        const durationCell = document.createElement('div');
        durationCell.className = 'track-duration';
        durationCell.dataset.trackId = track.id;

        const knownDuration = getKnownTrackDuration(track);
        if (knownDuration) {
            durationCell.innerText = formatTrackDuration(knownDuration);
        } else {
            durationCell.innerText = '--:--';
            durationCell.classList.add('duration-loading');
            queueTrackDurationProbe(track);
        }

        const trackAction = document.createElement('div');
        trackAction.className = 'track-action';

        if (isAdmin) {
            const refreshCoverButton = document.createElement('button');
            refreshCoverButton.className = 'cover-refresh-btn';
            refreshCoverButton.title = 'Refetch Cover Art';
            refreshCoverButton.setAttribute('aria-label', `Refetch cover for ${getDisplayTrackName(track.name)}`);

            const refreshCoverIcon = document.createElement('i');
            refreshCoverIcon.className = 'fas fa-image';
            refreshCoverButton.appendChild(refreshCoverIcon);

            refreshCoverButton.onclick = event => {
                event.stopPropagation();
                refetchTrackCover(track.id, refreshCoverButton);
            };

            trackAction.appendChild(refreshCoverButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'track-delete-btn';
            deleteButton.title = 'Permanently Delete Signal';
            deleteButton.setAttribute('aria-label', `Delete ${getDisplayTrackName(track.name)}`);

            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-trash-alt';
            deleteButton.appendChild(deleteIcon);

            deleteButton.onclick = event => {
                event.stopPropagation();
                deleteTrack(track.id, getDisplayTrackName(track.name));
            };

            trackAction.appendChild(deleteButton);
        }

        div.appendChild(trackNumber);
        div.appendChild(artCell);
        div.appendChild(titleCell);
        div.appendChild(artistCell);
        div.appendChild(addedCell);
        div.appendChild(durationCell);
        div.appendChild(trackAction);

        const originalIndex = allTracks.findIndex(item => item.id === track.id);
        div.onclick = () => loadTrack(originalIndex, true);
        list.appendChild(div);
    });

    updateRecentlyUploadedVisibility();
    updateRecentlyUploadedActiveState();
    updateLibraryHero();
}



// =========================================================================
// 2. MODAL CONTROLLERS
// =========================================================================
function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.classList.remove('hidden');

    const status = document.getElementById('uploadStatus');
    if (status) {
        status.innerText = '';
        status.style.color = '';
    }

    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (fileNameDisplay) fileNameDisplay.innerText = '';

    const fileInput = document.getElementById('uploadFileInput');
    if (fileInput) fileInput.value = '';

    const trackInput = document.getElementById('uploadTrackName');
    if (trackInput) trackInput.value = '';

    const artistInput = document.getElementById('uploadArtistName');
    if (artistInput) artistInput.value = '';

    const genreInput = document.getElementById('uploadGenre');
    if (genreInput) genreInput.value = 'J-POP';
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.classList.add('hidden');
}


// =========================================================================
// 3. EVENT LISTENERS AND INITIALIZATION
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.addEventListener('input', event => {
            const query = event.target.value.toLowerCase().trim();

            if (query === '') {
                showAllTracks();
                return;
            }

            currentViewPlaylistIndex = -1;
            activeLibraryView = 'search';
            activeSearchQuery = event.target.value.trim();

            const navAll = document.getElementById('navAllTracks');
            if (navAll) navAll.classList.add('active');

            setPlaylistActionVisibility(false);

            currentPlaylistTracks = allTracks.filter(track => {
                const name = getDisplayTrackName(track.name, '').toLowerCase();
                const artist = (track.artist || '').toLowerCase();
                return name.includes(query) || artist.includes(query);
            });

            renderPlaylists();
            renderTrackList();
        });
    }

    const dropZone = document.getElementById('dropZone');
    const uploadFileInput = document.getElementById('uploadFileInput');

    if (dropZone && uploadFileInput) {
        dropZone.addEventListener('click', () => uploadFileInput.click());

        dropZone.addEventListener('dragover', event => {
            event.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', event => {
            event.preventDefault();
            dropZone.classList.remove('dragover');

            if (event.dataTransfer.files.length > 0) {
                uploadFileInput.files = event.dataTransfer.files;
                handleFileSelection();
            }
        });

        uploadFileInput.addEventListener('change', handleFileSelection);
    }
});

function handleFileSelection() {
    const uploadFileInput = document.getElementById('uploadFileInput');
    if (!uploadFileInput) return;

    const file = uploadFileInput.files[0];
    if (!file) return;

    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (fileNameDisplay) fileNameDisplay.innerText = file.name;

    const trackNameInput = document.getElementById('uploadTrackName');
    if (trackNameInput && trackNameInput.value === '') {
        trackNameInput.value = getDisplayTrackName(file.name, '');
    }
}



// =========================================================================
// 4. ADMIN TERMINAL CONTROLLERS
// =========================================================================
function openAdminModal() {
    if (currentUserRole !== 'admin') return;

    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.remove('hidden');
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.add('hidden');
}
