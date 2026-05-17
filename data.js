// =========================================================================
// 1. CORE DATA FETCHING
// =========================================================================
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
            cover: doc.coverUrl || "https://via.placeholder.com/600x600/0f172a/00ffcc?text=NO+COVER"
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
        let queries = currentUserRole !== 'admin' ? [Query.equal("owner", currentUser)] : [];
        const response = await databases.listDocuments(DATABASE_ID, PLAYLIST_COLLECTION_ID, queries);

        userPlaylists = response.documents.map(doc => ({
            id: doc.$id,
            name: doc.name,
            ids: doc.trackIds,
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
    if (currentViewPlaylistIndex === -1) return alert("Please select a collection first.");
    const pl = userPlaylists[currentViewPlaylistIndex];
    document.getElementById('modalTitle').innerText = `EDITING: ${pl.name.toUpperCase()}`;
    document.getElementById('newPlaylistName').value = pl.name;
    document.getElementById('editPlaylistIndex').value = currentViewPlaylistIndex;
    buildModalTrackList(pl.ids);
    document.getElementById('playlistModal').classList.remove('hidden');
}

function buildModalTrackList(selectedIds) {
    const trackArea = document.getElementById('modalTrackSelection');
    if (!trackArea) return;
    trackArea.innerHTML = '';

    allTracks.forEach((track) => {
        const isChecked = selectedIds.includes(track.id) ? 'checked' : '';
        const label = document.createElement('label');
        label.className = 'track-checkbox-item';
        label.innerHTML = `
          <input type="checkbox" class="playlist-checkbox" value="${track.id}" ${isChecked}>
          <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${track.name}</span>
          <span class="track-genre">${track.genre}</span>
        `;
        trackArea.appendChild(label);
    });
}

function closePlaylistModal() {
    document.getElementById('playlistModal').classList.add('hidden');
}

async function savePlaylist() {
    const nameInput = document.getElementById('newPlaylistName').value.trim();
    const editIndex = parseInt(document.getElementById('editPlaylistIndex').value);
    const checkboxes = document.querySelectorAll('.playlist-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    if (!nameInput) return alert("Collection name is required.");
    if (selectedIds.length === 0) return alert("Please select at least one signal.");

    try {
        const btn = document.getElementById('modalSaveBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "SAVING...";
        }

        if (editIndex > -1) {
            const playlistId = userPlaylists[editIndex].id;
            await databases.updateDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, playlistId, {
                name: nameInput,
                trackIds: selectedIds
            });
        } else {
            await databases.createDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, ID.unique(), {
                name: nameInput,
                trackIds: selectedIds,
                owner: currentUser
            });
        }

        closePlaylistModal();
        await fetchPlaylists();
        if (editIndex > -1 && typeof loadPlaylist === 'function') loadPlaylist(editIndex);

        if (btn) {
            btn.disabled = false;
            btn.innerText = "Save Playlist";
        }
    } catch (error) {
        alert("Database Error: " + error.message);
        const btn = document.getElementById('modalSaveBtn');
        if (btn) btn.disabled = false;
    }
}


// =========================================================================
// 3. UPLOAD ENGINE
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
            const trackName = (files.length === 1 && customTrackName) ? customTrackName : file.name.replace(/\.[^/.]+$/, "");

            if (status) status.innerText = `REQUESTING CLEARANCE [${i + 1}/${files.length}]...`;

            const workerUrl = 'https://main.meochon341.workers.dev';
            let cleanMimeType = file.type || (file.name.toLowerCase().endsWith('.flac') ? "audio/flac" : "audio/mpeg");

            const fileExtension = file.name.split('.').pop().toLowerCase();
            const safeStorageName = `track-${Date.now()}-${i}.${fileExtension}`;

            const clearanceResponse = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: safeStorageName, contentType: cleanMimeType })
            });

            if (!clearanceResponse.ok) throw new Error("Worker rejected request");

            const { uploadUrl, publicFileUrl } = await clearanceResponse.json();

            if (status) status.innerText = `UPLOADING ${trackName}...`;

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': cleanMimeType },
                body: file
            });

            if (!uploadResponse.ok) throw new Error(`R2 Upload Failed: ${uploadResponse.status}`);

            if (status) status.innerText = `MATCHING COVER ART...`;
            let fetchedCover = await fetchCoverArt(trackName, artistName);

            if (!fetchedCover) {
                fetchedCover = `https://via.placeholder.com/600x600/0f172a/00ffcc?text=${encodeURIComponent(trackName.substring(0, 10))}`;
            }

            if (status) status.innerText = `SAVING METADATA...`;

            await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                name: trackName,
                artist: artistName,
                genre: genre,
                fileUrl: publicFileUrl,
                coverUrl: fetchedCover
            });

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
// IMPROVED COVER ART FUNCTION
// =========================================================================
async function fetchCoverArt(trackName, artistName) {
    try {
        const query = encodeURIComponent(`${trackName} ${artistName || ''}`.trim());
        const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=2`);

        if (!response.ok) return null;

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg');
        }
        return null;
    } catch (error) {
        console.warn("Cover art failed for:", trackName);
        return null;
    }
}



// =========================================================================
// 4. ADMIN FUNCTIONS (Fixed timestamp handling)
// =========================================================================
async function fetchUsersForAdmin() {
    if (currentUserRole !== 'admin') return [];
    try {
        const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID);
        return response.documents;
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        return [];
    }
}

async function grantTemporaryUpload(targetUserId, hours) {
    try {
        const expirationTime = Date.now() + (hours * 60 * 60 * 1000);
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, targetUserId, {
            uploadAccessUntil: expirationTime.toString()   // Must be string
        });
    } catch (error) {
        console.error("Grant Access Error:", error);
        alert("Failed to grant clearance.");
    }
}

async function adminActionGrant(targetUserId, hours) {
    try {
        const newTime = Date.now() + (hours * 60 * 60 * 1000);
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, targetUserId, {
            uploadAccessUntil: newTime.toString()
        });
       
        loadAdminUserList();
    } catch (error) {
        console.error("Grant Access Error:", error);
        alert("Failed to grant clearance.");
    }
}

async function adminActionRevoke(targetUserId) {
    try {
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, targetUserId, {
            uploadAccessUntil: null
        });
       
        loadAdminUserList();
    } catch (error) {
        console.error("Revoke Access Error:", error);
        alert("Failed to revoke clearance.");
    }
}

async function deleteTrack(trackId, trackName) {
    if (currentUserRole !== 'admin') return alert("Security Clearance Required.");
    if (!confirm(`Delete "${trackName}" permanently?`)) return;
    try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, trackId);
        fetchTracks();
    } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete signal.");
    }
}
