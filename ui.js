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

function renderTrackList() {
    const list = document.getElementById('trackList');
    if (!list) return;

    list.innerHTML = '';

    if (currentPlaylistTracks.length === 0) {
        list.innerHTML = '<div style="color:var(--text-sub); padding:16px;">No signals detected.</div>';
        return;
    }

    currentPlaylistTracks.forEach((track, index) => {
        const div = document.createElement('div');
        div.className = 'track';

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

        const trackInfo = document.createElement('div');
        trackInfo.className = 'track-info';

        const trackTitle = document.createElement('span');
        trackTitle.className = 'track-title';
        trackTitle.innerText = getDisplayTrackName(track.name);

        const trackMeta = document.createElement('span');
        trackMeta.className = 'track-meta';
        trackMeta.innerText = track.artist;

        trackInfo.appendChild(trackTitle);
        trackInfo.appendChild(trackMeta);

        const trackAction = document.createElement('div');
        trackAction.className = 'track-action';

        if (currentUserRole === 'admin') {
            trackAction.classList.add('admin-track-actions');

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
            deleteButton.style.background = 'none';
            deleteButton.style.border = 'none';
            deleteButton.style.color = '#ef4444';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.padding = '5px';
            deleteButton.style.marginLeft = '10px';
            deleteButton.title = 'Permanently Delete Signal';

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
        div.appendChild(trackInfo);
        div.appendChild(trackAction);

        const originalIndex = allTracks.findIndex(item => item.id === track.id);
        div.onclick = () => loadTrack(originalIndex, true);
        list.appendChild(div);
    });
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

            const navAll = document.getElementById('navAllTracks');
            if (navAll) navAll.classList.add('active');

            const viewTitle = document.getElementById('viewTitle');
            if (viewTitle) viewTitle.innerText = `Search Results: "${query}"`;

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
