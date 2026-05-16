// ==========================================
// UI.JS — Render Functions, Views & Search
// ==========================================
// Depends on: config.js, data.js (fetchPlaylists), player.js (loadTrack)

// ==========================================
// UI — VIEWS
// ==========================================

// =========================================================================
// 1. PLAYLIST AND VIEW RENDERING ENGINE
// =========================================================================

function renderPlaylists() {
    const container = document.getElementById('playlists');
    if (!container) return;
    container.innerHTML = '';

    userPlaylists.forEach((pl, index) => {
        const div = document.createElement('div');
        div.className = `playlist-item ${currentViewPlaylistIndex === index ? 'active' : ''}`;

        const isMine = (pl.owner === currentUser);

        if (isMine) {
            div.innerHTML = `<i class="fas fa-folder-open"></i> ${pl.name}`;
        } else {
            div.innerHTML = `
                <i class="fas fa-lock" style="color: var(--error); font-size: 0.85rem;"></i> 
                <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pl.name}</span>
                <span style="font-size: 0.7rem; color: var(--text-sub); font-weight: bold; text-transform: uppercase;">${pl.owner}</span>
            `;
        }

        div.onclick = () => loadPlaylist(index);
        container.appendChild(div);
    });
}

function showAllTracks() {
    currentViewPlaylistIndex = -1;
    const navAll = document.getElementById('navAllTracks');
    if (navAll) navAll.classList.add('active');
    
    const title = document.getElementById('viewTitle');
    if (title) title.innerText = "All Tracks";
    
    const editBtn = document.getElementById('editPlaylistBtn');
    if (editBtn) editBtn.classList.add('hidden');
    
    currentPlaylistTracks = [...allTracks];
    renderPlaylists();
    renderTrackList();
}

function loadPlaylist(index) {
    currentViewPlaylistIndex = index;
    const navAll = document.getElementById('navAllTracks');
    if (navAll) navAll.classList.remove('active');
    
    const pl = userPlaylists[index];
    document.getElementById('viewTitle').innerText = pl.name;

    if (pl.owner === currentUser) {
        document.getElementById('editPlaylistBtn').classList.remove('hidden');
    } else {
        document.getElementById('editPlaylistBtn').classList.add('hidden');
    }

    currentPlaylistTracks = allTracks.filter(track => pl.ids.includes(track.id));
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

        const isPlaying = allTracks[currentTrackIndex] && allTracks[currentTrackIndex].id === track.id;
        if (isPlaying) div.classList.add('active');

        const adminDeleteBtn = (currentUserRole === 'admin')
            ? `<button onclick="event.stopPropagation(); deleteTrack('${track.id}', '${track.name}')"
                       style="background:none; border:none; color:#ef4444; cursor:pointer; padding:5px; margin-left:10px;"
                       title="Permanently Delete Signal">
                   <i class="fas fa-trash-alt"></i>
               </button>`
            : '';

        div.innerHTML = `
            <div class="track-num">${isPlaying ? '<i class="fas fa-volume-up"></i>' : index + 1}</div>
            <div class="track-info">
                <span class="track-title">${track.name}</span>
                <span class="track-meta">${track.artist}</span>
            </div>
            <div class="track-action">
                ${adminDeleteBtn}
            </div>
        `;

        const originalIndex = allTracks.findIndex(t => t.id === track.id);
        div.onclick = () => loadTrack(originalIndex, true);
        list.appendChild(div);
    });
}

// =========================================================================
// 2. MODAL CONTROLLERS (Bridges DOM triggers from index.html)
// =========================================================================

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.classList.remove('hidden');
    
    const status = document.getElementById('uploadStatus');
    if (status) status.innerText = "";
    
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (fileNameDisplay) fileNameDisplay.innerText = "";
    
    const fileInput = document.getElementById('uploadFileInput');
    if (fileInput) fileInput.value = "";
    
    const trackInput = document.getElementById('uploadTrackName');
    if (trackInput) trackInput.value = "";
    
    const artistInput = document.getElementById('uploadArtistName');
    if (artistInput) artistInput.value = "";
    
    const genreInput = document.getElementById('uploadGenre');
    if (genreInput) genreInput.value = "J-POP";
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
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();

            if (query === "") {
                showAllTracks(); 
                return;
            }

            currentViewPlaylistIndex = -1;
            const navAll = document.getElementById('navAllTracks');
            if (navAll) navAll.classList.add('active');
            
            const viewTitle = document.getElementById('viewTitle');
            if (viewTitle) viewTitle.innerText = `Search Results: "${query}"`;
            
            const editBtn = document.getElementById('editPlaylistBtn');
            if (editBtn) editBtn.classList.add('hidden');
            
            currentPlaylistTracks = allTracks.filter(track => {
                const matchName = track.name.toLowerCase().includes(query);
                const matchArtist = track.artist.toLowerCase().includes(query);
                return matchName || matchArtist;
            });

            renderPlaylists(); 
            renderTrackList(); 
        });
    }

    // Bind Upload Drag/Drop elements safely
    const dropZone = document.getElementById('dropZone');
    const uploadFileInput = document.getElementById('uploadFileInput');

    if (dropZone && uploadFileInput) {
        dropZone.addEventListener('click', () => uploadFileInput.click());
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                uploadFileInput.files = e.dataTransfer.files;
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
    if (file) {
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        if (fileNameDisplay) fileNameDisplay.innerText = file.name;
        
        const trackNameInput = document.getElementById('uploadTrackName');
        if (trackNameInput && trackNameInput.value === "") {
            trackNameInput.value = file.name.replace('.mp3', '');
        }
    }
}

// =========================================================================
// 4. ADMIN SECURITY clears HANDLERS
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

    users.forEach(u => {
        if (u.role === 'admin') return;

        const div = document.createElement('div');
        div.className = 'user-row';
        
        const hasAccess = u.uploadAccessUntil && (Date.now() < u.uploadAccessUntil);
        const statusIndicator = hasAccess 
            ? `<span style="color:var(--success); font-size:0.75rem;"><i class="fas fa-check-circle"></i> Upload Active</span>` 
            : `<span style="color:var(--error); font-size:0.75rem;"><i class="fas fa-lock"></i> Upload Locked</span>`;

        div.innerHTML = `
            <div class="user-info-stack" style="display:flex; flex-direction:column; gap:4px; padding:10px 0;">
                <span class="username" style="color:white; font-weight:bold;">@${u.username}</span>
                ${statusIndicator}
            </div>
            <button class="btn-grant" onclick="handleGrantAccess('${u.$id}', this)" style="background:var(--accent); color:black; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Grant 12H</button>
        `;
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
    btnElement.innerHTML = "GRANTED";
    btnElement.style.background = "var(--success)";
    btnElement.style.color = "#fff";
}
