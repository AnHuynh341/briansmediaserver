async function fetchTracks() {
    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.orderAsc("$createdAt"),
            Query.limit(500)
        ]);

        allTracks = response.documents.map(doc => ({
            id: doc.$id,
            name: doc.name,
            artist: doc.artist,
            genre: doc.genre,
            file: doc.fileUrl,
            cover: doc.coverUrl || "https://via.placeholder.com/600x600/0f172a/00ffcc?text=NO+COVER",
            createdAt: doc.$createdAt
        }));

        if (allTracks.length > 0 && !audio.src) {
            if (typeof loadTrack === 'function') loadTrack(0, false);
        }

        if (currentViewPlaylistIndex === -1) {
            currentPlaylistTracks = [...allTracks];
        } else if (typeof loadPlaylist === 'function') {
            loadPlaylist(currentViewPlaylistIndex);
        }

        if (typeof renderTrackList === 'function') renderTrackList();
    } catch (error) {
        console.error("Appwrite Fetch Error:", error);
    }
}

async function fetchPlaylists() {
    try {
        const queries = currentUserRole !== 'admin'
            ? [Query.equal("owner", currentUser), Query.limit(500)]
            : [Query.limit(500)];

        const response = await databases.listDocuments(
            DATABASE_ID,
            PLAYLIST_COLLECTION_ID,
            queries
        );

        userPlaylists = response.documents.map(doc => ({
            id: doc.$id,
            name: doc.name,
            ids: Array.isArray(doc.trackIds) ? doc.trackIds : [],
            owner: doc.owner || 'unknown'
        }));

        if (typeof renderPlaylists === 'function') renderPlaylists();
    } catch (error) {
        console.error("Playlist Fetch Error:", error);
    }
}


// =========================================================================
// 2. PLAYLIST MODALS
// =========================================================================
function openPlaylistModal() {
    document.getElementById('modalTitle').innerText = 'CREATE NEW PLAYLIST';
    document.getElementById('newPlaylistName').value = '';
    document.getElementById('editPlaylistIndex').value = -1;
    buildModalTrackList([]);
    document.getElementById('playlistModal').classList.remove('hidden');
}

function openEditModal() {
    if (currentViewPlaylistIndex === -1) {
        return alert("Please select a collection first.");
    }

    const pl = userPlaylists[currentViewPlaylistIndex];

    if (!pl || pl.owner !== currentUser) {
        return alert("You can only edit your own collection.");
    }

    document.getElementById('modalTitle').innerText = `EDITING: ${pl.name.toUpperCase()}`;
    document.getElementById('newPlaylistName').value = pl.name;
    document.getElementById('editPlaylistIndex').value = currentViewPlaylistIndex;
    buildModalTrackList(pl.ids);
    document.getElementById('playlistModal').classList.remove('hidden');
}

function buildModalTrackList(selectedIds) {
    const trackArea = document.getElementById('modalTrackSelection');
    if (!trackArea) return;

    const selectedSet = new Set(selectedIds);
    trackArea.innerHTML = '';

    allTracks.forEach(track => {
        const label = document.createElement('label');
        label.className = 'track-checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'playlist-checkbox';
        checkbox.value = track.id;
        checkbox.checked = selectedSet.has(track.id);

        const trackName = document.createElement('span');
        trackName.style.flex = '1';
        trackName.style.whiteSpace = 'nowrap';
        trackName.style.overflow = 'hidden';
        trackName.style.textOverflow = 'ellipsis';
        trackName.innerText = track.name;

        const genre = document.createElement('span');
        genre.className = 'track-genre';
        genre.innerText = track.genre || 'Other';

        label.appendChild(checkbox);
        label.appendChild(trackName);
        label.appendChild(genre);
        trackArea.appendChild(label);
    });
}

function closePlaylistModal() {
    document.getElementById('playlistModal').classList.add('hidden');
}

async function savePlaylist() {
    const nameInput = document.getElementById('newPlaylistName').value.trim();
    const editIndex = Number.parseInt(document.getElementById('editPlaylistIndex').value, 10);
    const checkboxes = document.querySelectorAll('.playlist-checkbox:checked');
    const checkedIds = Array.from(checkboxes, checkbox => checkbox.value);

    if (!nameInput) return alert("Collection name is required.");
    if (checkedIds.length === 0) return alert("Please select at least one signal.");

    let selectedIds;

    if (editIndex > -1) {
        const existingPlaylist = userPlaylists[editIndex];

        if (!existingPlaylist || existingPlaylist.owner !== currentUser) {
            return alert("You can only edit your own collection.");
        }

        const existingIds = Array.isArray(existingPlaylist.ids)
            ? existingPlaylist.ids
            : [];

        // Preserve the playlist's existing manual order for songs that remain checked.
        const preservedExistingOrder = existingIds.filter(trackId =>
            checkedIds.includes(trackId)
        );

        // Newly selected songs are appended to the end in database/upload order.
        const newlyAddedIds = checkedIds.filter(trackId =>
            !existingIds.includes(trackId)
        );

        selectedIds = [
            ...preservedExistingOrder,
            ...newlyAddedIds
        ];
    } else {
        selectedIds = checkedIds;
    }

    const btn = document.getElementById('modalSaveBtn');
    let savedPlaylistId = null;

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerText = "SAVING...";
        }

        if (editIndex > -1) {
            savedPlaylistId = userPlaylists[editIndex].id;

            await databases.updateDocument(
                DATABASE_ID,
                PLAYLIST_COLLECTION_ID,
                savedPlaylistId,
                {
                    name: nameInput,
                    trackIds: selectedIds
                }
            );
        } else {
            const createdPlaylist = await databases.createDocument(
                DATABASE_ID,
                PLAYLIST_COLLECTION_ID,
                ID.unique(),
                {
                    name: nameInput,
                    trackIds: selectedIds,
                    owner: currentUser
                }
            );

            savedPlaylistId = createdPlaylist.$id;
        }

        closePlaylistModal();
        await fetchPlaylists();

        if (editIndex > -1 && savedPlaylistId && typeof loadPlaylist === 'function') {
            const refreshedIndex = userPlaylists.findIndex(pl => pl.id === savedPlaylistId);
            if (refreshedIndex > -1) loadPlaylist(refreshedIndex);
        }
    } catch (error) {
        console.error("Playlist Save Error:", error);
        alert("Database Error: " + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "Save Playlist";
        }
    }
}


// =========================================================================
// 3. PLAYLIST SORTING
// =========================================================================
let playlistSortDraft = [];
let playlistSortKey = null;
let playlistSortDirection = 1;
let draggedPlaylistTrackId = null;

function openSortPlaylistModal() {
    if (currentViewPlaylistIndex === -1) {
        return alert("Please select a collection first.");
    }

    const playlist = userPlaylists[currentViewPlaylistIndex];

    if (!playlist) {
        return alert("Playlist could not be found.");
    }

    if (playlist.owner !== currentUser) {
        return alert("You can only sort your own collection.");
    }

    // Map through playlist.ids so the currently saved manual order is preserved.
    playlistSortDraft = playlist.ids
        .map(trackId => allTracks.find(track => track.id === trackId))
        .filter(Boolean);

    playlistSortKey = null;
    playlistSortDirection = 1;
    draggedPlaylistTrackId = null;

    const title = document.getElementById('sortPlaylistTitle');
    if (title) title.innerText = `SORTING: ${playlist.name.toUpperCase()}`;

    updateSortButtonLabels();
    renderSortPlaylistList();
    document.getElementById('sortPlaylistModal').classList.remove('hidden');
}

function closeSortPlaylistModal() {
    document.getElementById('sortPlaylistModal').classList.add('hidden');

    // Closing without Save discards the draft and leaves Appwrite untouched.
    playlistSortDraft = [];
    playlistSortKey = null;
    playlistSortDirection = 1;
    draggedPlaylistTrackId = null;
}

function quickSortPlaylist(key) {
    if (playlistSortKey === key) {
        playlistSortDirection *= -1;
    } else {
        playlistSortKey = key;
        playlistSortDirection = 1;
    }

    const direction = playlistSortDirection;
    const textCompare = new Intl.Collator(undefined, {
        sensitivity: 'base',
        numeric: true
    });

    playlistSortDraft.sort((trackA, trackB) => {
        let result = 0;

        if (key === 'name') {
            result = textCompare.compare(trackA.name || '', trackB.name || '');
        } else if (key === 'artist') {
            result = textCompare.compare(trackA.artist || '', trackB.artist || '');

            if (result === 0) {
                result = textCompare.compare(trackA.name || '', trackB.name || '');
            }
        } else if (key === 'createdAt') {
            const dateA = Date.parse(trackA.createdAt || '') || 0;
            const dateB = Date.parse(trackB.createdAt || '') || 0;
            result = dateA - dateB;

            if (result === 0) {
                result = textCompare.compare(trackA.name || '', trackB.name || '');
            }
        }

        return result * direction;
    });

    updateSortButtonLabels();
    renderSortPlaylistList();
}

function updateSortButtonLabels() {
    const nameButton = document.getElementById('sortByNameBtn');
    const artistButton = document.getElementById('sortByArtistBtn');
    const uploadedButton = document.getElementById('sortByUploadedBtn');

    const arrowFor = key => {
        if (playlistSortKey !== key) return '↑';
        return playlistSortDirection === 1 ? '↑' : '↓';
    };

    if (nameButton) nameButton.innerText = `A-Z ${arrowFor('name')}`;
    if (artistButton) artistButton.innerText = `Artist ${arrowFor('artist')}`;
    if (uploadedButton) uploadedButton.innerText = `Uploaded Time ${arrowFor('createdAt')}`;
}

function renderSortPlaylistList() {
    const list = document.getElementById('sortPlaylistList');
    if (!list) return;

    list.innerHTML = '';

    if (playlistSortDraft.length === 0) {
        list.innerHTML = `
            <div style="padding:25px; text-align:center; color:var(--text-sub);">
                This playlist contains no available tracks.
            </div>
        `;
        return;
    }

    playlistSortDraft.forEach((track, index) => {
        const row = document.createElement('div');
        row.className = 'sort-track-row';
        row.draggable = true;
        row.dataset.trackId = track.id;

        const position = document.createElement('span');
        position.className = 'sort-track-position';
        position.innerText = String(index + 1);

        const title = document.createElement('span');
        title.className = 'sort-track-title';

        const handle = document.createElement('i');
        handle.className = 'fas fa-grip-lines';
        handle.setAttribute('aria-hidden', 'true');

        const titleText = document.createElement('span');
        titleText.innerText = track.name || 'Unknown Track';

        title.appendChild(handle);
        title.appendChild(titleText);

        const artist = document.createElement('span');
        artist.className = 'sort-track-artist';
        artist.innerText = track.artist || 'Unknown Artist';

        row.appendChild(position);
        row.appendChild(title);
        row.appendChild(artist);

        row.addEventListener('dragstart', handlePlaylistDragStart);
        row.addEventListener('dragover', handlePlaylistDragOver);
        row.addEventListener('drop', handlePlaylistDrop);
        row.addEventListener('dragend', handlePlaylistDragEnd);

        list.appendChild(row);
    });
}

function handlePlaylistDragStart(event) {
    const row = event.currentTarget;

    draggedPlaylistTrackId = row.dataset.trackId;
    row.classList.add('dragging');

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedPlaylistTrackId);
}

function handlePlaylistDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handlePlaylistDrop(event) {
    event.preventDefault();

    const targetRow = event.currentTarget;
    const targetTrackId = targetRow.dataset.trackId;
    const draggedTrackId =
        event.dataTransfer.getData('text/plain') || draggedPlaylistTrackId;

    if (!draggedTrackId || !targetTrackId || draggedTrackId === targetTrackId) {
        return;
    }

    const draggedIndex = playlistSortDraft.findIndex(
        track => track.id === draggedTrackId
    );

    if (draggedIndex === -1) return;

    const targetBox = targetRow.getBoundingClientRect();
    const insertAfter = event.clientY > targetBox.top + targetBox.height / 2;
    const [movedTrack] = playlistSortDraft.splice(draggedIndex, 1);

    // Find the target again after removing the dragged track because indexes may shift.
    const newTargetIndex = playlistSortDraft.findIndex(
        track => track.id === targetTrackId
    );

    if (newTargetIndex === -1) {
        playlistSortDraft.push(movedTrack);
    } else {
        const insertionIndex = newTargetIndex + (insertAfter ? 1 : 0);
        playlistSortDraft.splice(insertionIndex, 0, movedTrack);
    }

    // Manual dragging breaks the strict automatic-sort state.
    playlistSortKey = null;
    playlistSortDirection = 1;

    updateSortButtonLabels();
    renderSortPlaylistList();
}

function handlePlaylistDragEnd() {
    draggedPlaylistTrackId = null;

    document.querySelectorAll('.sort-track-row.dragging').forEach(row => {
        row.classList.remove('dragging');
    });
}

async function saveSortedPlaylist() {
    const playlist = userPlaylists[currentViewPlaylistIndex];

    if (!playlist) {
        return alert("Playlist could not be found.");
    }

    if (playlist.owner !== currentUser) {
        return alert("You can only sort your own collection.");
    }

    const sortedTrackIds = playlistSortDraft.map(track => track.id);

    if (sortedTrackIds.length === 0) {
        return alert("The playlist cannot be saved empty.");
    }

    const saveButton = document.getElementById('saveSortPlaylistBtn');

    try {
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerText = 'SAVING...';
        }

        await databases.updateDocument(
            DATABASE_ID,
            PLAYLIST_COLLECTION_ID,
            playlist.id,
            { trackIds: sortedTrackIds }
        );

        // Keep the local state synchronized immediately.
        playlist.ids = [...sortedTrackIds];
        currentPlaylistTracks = sortedTrackIds
            .map(trackId => allTracks.find(track => track.id === trackId))
            .filter(Boolean);

        closeSortPlaylistModal();

        if (typeof renderPlaylists === 'function') renderPlaylists();
        if (typeof renderTrackList === 'function') renderTrackList();
    } catch (error) {
        console.error('Playlist Sort Save Error:', error);
        alert('Failed to save playlist order: ' + error.message);
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerText = 'Save Order';
        }
    }
}


// =========================================================================
// 4. UPLOAD ENGINE
// =========================================================================
async function triggerUpload() {
    const btn = document.getElementById('startUploadBtn');
    if (btn) btn.disabled = true;

    const fileInput = document.getElementById('uploadFileInput');
    const files = fileInput ? fileInput.files : [];

    const artistName = document.getElementById('uploadArtistName').value.trim() || "Unknown Artist";
    const genre = document.getElementById('uploadGenre').value || "J-POP";
    const customTrackName = document.getElementById('uploadTrackName').value.trim();

    const status = document.getElementById('uploadStatus');

    if (files.length === 0) {
        alert("Please select at least one file.");
        if (btn) btn.disabled = false;
        return;
    }

    try {
        let successCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const trackName = (files.length === 1 && customTrackName)
                ? customTrackName
                : file.name.replace(/\.[^/.]+$/, "");

            if (status) status.innerText = `REQUESTING CLEARANCE [${i + 1}/${files.length}]...`;

            const workerUrl = 'https://main.meochon341.workers.dev';
            const cleanMimeType = file.type || (
                file.name.toLowerCase().endsWith('.flac')
                    ? "audio/flac"
                    : "audio/mpeg"
            );

            const fileExtension = file.name.split('.').pop().toLowerCase();
            const safeStorageName = `track-${Date.now()}-${i}.${fileExtension}`;

            const clearanceResponse = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: safeStorageName,
                    contentType: cleanMimeType
                })
            });

            if (!clearanceResponse.ok) throw new Error("Worker rejected request");

            const { uploadUrl, publicFileUrl } = await clearanceResponse.json();

            if (status) status.innerText = `UPLOADING ${trackName}...`;

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': cleanMimeType },
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error(`R2 Upload Failed: ${uploadResponse.status}`);
            }

            if (status) status.innerText = `MATCHING COVER ART...`;
            let fetchedCover = await fetchCoverArt(trackName, artistName);

            if (!fetchedCover) {
                fetchedCover = `https://via.placeholder.com/600x600/0f172a/00ffcc?text=${encodeURIComponent(trackName.substring(0, 10))}`;
            }

            if (status) status.innerText = `SAVING METADATA...`;

            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                {
                    name: trackName,
                    artist: artistName,
                    genre: genre,
                    fileUrl: publicFileUrl,
                    coverUrl: fetchedCover
                }
            );

            successCount++;
        }

        if (status) {
            status.innerText = `✅ SUCCESS! ${successCount} track(s) added.`;
            status.style.color = "var(--success)";
        }

        setTimeout(() => {
            closeUploadModal();
            fetchTracks();
            if (btn) btn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error("UPLOAD ERROR:", error);

        if (status) {
            status.innerText = `❌ ERROR: ${error.message}`;
            status.style.color = "var(--error)";
        }

        if (btn) btn.disabled = false;
    }
}


// =========================================================================
// 5. COVER ART
// =========================================================================
async function fetchCoverArt(trackName, artistName) {
    try {
        const query = encodeURIComponent(`${trackName} ${artistName || ''}`.trim());
        const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=2`);

        if (!response.ok) return null;

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].artworkUrl100.replace(
                '100x100bb.jpg',
                '600x600bb.jpg'
            );
        }

        return null;
    } catch (error) {
        console.warn("Cover art failed for:", trackName);
        return null;
    }
}


// =========================================================================
// 6. ADMIN FUNCTIONS
// =========================================================================
async function fetchUsersForAdmin() {
    if (currentUserRole !== 'admin') return [];

    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.limit(100)]
        );

        return response.documents;
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        return [];
    }
}

async function grantTemporaryUpload(targetUserId, hours) {
    try {
        const expirationTime = Date.now() + (hours * 60 * 60 * 1000);

        await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            targetUserId,
            { uploadAccessUntil: expirationTime.toString() }
        );
    } catch (error) {
        console.error("Grant Access Error:", error);
        alert("Failed to grant clearance.");
    }
}

async function adminActionGrant(targetUserId, hours) {
    try {
        const newTime = Date.now() + (hours * 60 * 60 * 1000);

        await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            targetUserId,
            { uploadAccessUntil: newTime.toString() }
        );

        loadAdminUserList();
    } catch (error) {
        console.error("Grant Access Error:", error);
        alert("Failed to grant clearance.");
    }
}

async function adminActionRevoke(targetUserId) {
    try {
        await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            targetUserId,
            { uploadAccessUntil: null }
        );

        loadAdminUserList();
    } catch (error) {
        console.error("Revoke Access Error:", error);
        alert("Failed to revoke clearance.");
    }
}

async function deleteTrack(trackId, trackName) {
    if (currentUserRole !== 'admin') {
        return alert("Security Clearance Required.");
    }

    if (!confirm(`Delete "${trackName}" permanently?`)) return;

    try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, trackId);
        fetchTracks();
    } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete signal.");
    }
}
