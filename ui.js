function renderPlaylists() {
    const container = document.getElementById('playlists');
    if (!container) return;

    container.innerHTML = '';

    userPlaylists.forEach((pl, index) => {
        const div = document.createElement('div');
        div.className = `playlist-item ${currentViewPlaylistIndex === index ? 'active' : ''}`;

        const isMine = pl.owner === currentUser;

        if (isMine) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-folder-open';

            const name = document.createElement('span');
            name.style.flex = '1';
            name.style.whiteSpace = 'nowrap';
            name.style.overflow = 'hidden';
            name.style.textOverflow = 'ellipsis';
            name.innerText = pl.name;

            div.appendChild(icon);
            div.appendChild(name);
        } else {
            const icon = document.createElement('i');
            icon.className = 'fas fa-lock';
            icon.style.color = 'var(--error)';
            icon.style.fontSize = '0.85rem';

            const name = document.createElement('span');
            name.style.flex = '1';
            name.style.whiteSpace = 'nowrap';
            name.style.overflow = 'hidden';
            name.style.textOverflow = 'ellipsis';
            name.innerText = pl.name;

            const owner = document.createElement('span');
            owner.style.fontSize = '0.7rem';
            owner.style.color = 'var(--text-sub)';
            owner.style.fontWeight = 'bold';
            owner.style.textTransform = 'uppercase';
            owner.innerText = pl.owner;

            div.appendChild(icon);
            div.appendChild(name);
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
        trackTitle.innerText = track.name;

        const trackMeta = document.createElement('span');
        trackMeta.className = 'track-meta';
        trackMeta.innerText = track.artist;

        trackInfo.appendChild(trackTitle);
        trackInfo.appendChild(trackMeta);

        const trackAction = document.createElement('div');
        trackAction.className = 'track-action';

        if (currentUserRole === 'admin') {
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
                deleteTrack(track.id, track.name);
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
                const name = (track.name || '').toLowerCase();
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
        trackNameInput.value = file.name.replace(/\.(mp3|flac)$/i, '');
    }
}


// =========================================================================
// 4. ADMIN SECURITY HANDLERS
// =========================================================================
async function openAdminModal() {
    document.getElementById('adminModal').classList.remove('hidden');

    const userListDiv = document.getElementById('adminUserList');
    userListDiv.innerHTML = '<div style="text-align:center; color:var(--text-sub); padding:20px;"><i class="fas fa-circle-notch fa-spin"></i> Accessing User Database...</div>';

    const users = await fetchUsersForAdmin();
    userListDiv.innerHTML = '';

    if (users.length === 0) {
        userListDiv.innerHTML = '<div style="padding:15px; color:var(--text-sub); text-align:center;">No standard users found.</div>';
        return;
    }

    users.forEach(user => {
        if (user.role === 'admin') return;

        const div = document.createElement('div');
        div.className = 'user-row';

        const hasAccess = user.uploadAccessUntil
            && Date.now() < Number.parseInt(user.uploadAccessUntil, 10);

        const infoStack = document.createElement('div');
        infoStack.className = 'user-info-stack';
        infoStack.style.padding = '10px 0';

        const username = document.createElement('span');
        username.className = 'username';
        username.innerText = `@${user.username}`;

        const statusIndicator = document.createElement('span');
        statusIndicator.style.fontSize = '0.75rem';
        statusIndicator.style.color = hasAccess ? 'var(--success)' : 'var(--error)';

        const statusIcon = document.createElement('i');
        statusIcon.className = hasAccess ? 'fas fa-check-circle' : 'fas fa-lock';

        statusIndicator.appendChild(statusIcon);
        statusIndicator.append(` ${hasAccess ? 'Upload Active' : 'Upload Locked'}`);

        infoStack.appendChild(username);
        infoStack.appendChild(statusIndicator);

        const grantButton = document.createElement('button');
        grantButton.className = 'btn-grant';
        grantButton.innerText = 'Grant 12H';
        grantButton.onclick = () => handleGrantAccess(user.$id, grantButton);

        div.appendChild(infoStack);
        div.appendChild(grantButton);
        userListDiv.appendChild(div);
    });
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

async function handleGrantAccess(userId, btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    await grantTemporaryUpload(userId, 12);

    btnElement.innerText = 'GRANTED';
    btnElement.style.background = 'var(--success)';
    btnElement.style.color = '#fff';
}
