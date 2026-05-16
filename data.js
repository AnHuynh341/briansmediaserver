// ==========================================
// DATA.JS — Appwrite Fetching, Playlists, Upload & Admin
// ==========================================

// =========================================================================
// 1. CORE METADATA FETCH ENGINES
// =========================================================================

// =========================================================================
// 1. CORE METADATA FETCH ENGINES
// =========================================================================

async function fetchTracks() {
    try {
        // Fetch metadata directly from Appwrite database table
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.orderAsc("$createdAt"),
            Query.limit(500)
        ]);

        // Map the database documents to our playback array structure
        allTracks = response.documents.map(doc => ({
            id: doc.$id,
            name: doc.name,
            artist: doc.artist,
            genre: doc.genre,
            file: doc.fileUrl, // Direct public Cloudflare R2 streaming resource link
            cover: doc.coverUrl || "https://via.placeholder.com/600x600/0f172a/00ffcc?text=NO+COVER"
        }));

        // Failsafe: Load the first track into the audio player if nothing is playing yet
        if (allTracks.length > 0 && !audio.src) {
            if (typeof loadTrack === 'function') loadTrack(0, false);
        }

        // Maintain the active track view depending on whether we are viewing a playlist or the core database
        if (currentViewPlaylistIndex === -1) {
            currentPlaylistTracks = [...allTracks];
        } else {
            if (typeof loadPlaylist === 'function') loadPlaylist(currentViewPlaylistIndex);
        }

        if (typeof renderTrackList === 'function') renderTrackList();
    } catch (error) {
        console.error("Appwrite Fetch Error:", error);
    }
}

async function fetchPlaylists() {
    try {
        let queries = [];
        // Standard users can only view collections they created
        if (currentUserRole !== 'admin') {
            queries.push(Query.equal("owner", currentUser));
        }

        const response = await databases.listDocuments(DATABASE_ID, PLAYLIST_COLLECTION_ID, queries);

        userPlaylists = response.documents.map(doc => ({
            id: doc.$id, name: doc.name, ids: doc.trackIds, owner: doc.owner || 'unknown'
        }));

        if (typeof renderPlaylists === 'function') renderPlaylists();
    } catch (error) {
        console.error("Playlist Fetch Error:", error);
    }
}

// =========================================================================
// 2. PLAYLIST BUILDER MODALS
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
                name: nameInput, trackIds: selectedIds
            });
        } else {
            await databases.createDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, ID.unique(), {
                name: nameInput, trackIds: selectedIds, owner: currentUser
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
// 3. SECURE BULLETPROOF R2 TRANSMISSION ENGINE
// =========================================================================

async function triggerUpload() {
    const btn = document.getElementById('startUploadBtn');
    if (btn) btn.disabled = true;

    const fileInput = document.getElementById('uploadFileInput');
    const files = fileInput ? fileInput.files : [];
    
    const artistInput = document.getElementById('uploadArtistName');
    const artistName = artistInput && artistInput.value.trim() !== "" ? artistInput.value.trim() : "Unknown Artist";
    
    const genreInput = document.getElementById('uploadGenre');
    const genre = genreInput ? genreInput.value : "J-POP";
    
    const trackInput = document.getElementById('uploadTrackName');
    const customTrackName = trackInput ? trackInput.value.trim() : "";

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
            let trackName = files.length === 1 && customTrackName !== "" ? customTrackName : file.name.replace(/\.[^/.]+$/, "");

            if(status) {
                status.innerText = `REQUESTING R2 CLEARANCE [${i + 1}/${files.length}]...`;
                status.style.color = "var(--accent)";
            }

            const workerUrl = 'https://main.meochon341.workers.dev'; 
            const cleanMimeType = file.type || "audio/mpeg";

            // 🛡️ Safe Alphanumeric Key Transformation to prevent 403 cryptographic calculation mismatches
            const fileExtension = file.name.split('.').pop();
            const safeStorageName = `track-${Date.now()}-${i}.${fileExtension}`;

            // Step 1: Handshake with Worker using the safe alphanumeric string layout
            const clearanceResponse = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: safeStorageName, contentType: cleanMimeType })
            });

            if (!clearanceResponse.ok) throw new Error("Worker rejected request");
            const { uploadUrl, publicFileUrl } = await clearanceResponse.json();

            if(status) status.innerText = `BEAMING BINARY DATA TO CLOUDFLARE R2...`;

            // Step 2: Binary Push Directly to R2 matching content-type headers exactly
            await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': cleanMimeType }, 
                body: file 
            });

            if(status) status.innerText = `MATCHING ARTWORK: ${trackName}...`;
            let fetchedCover = await fetchCoverArt(trackName, artistName);

            if (!fetchedCover) {
                fetchedCover = "https://via.placeholder.com/600x600/0f172a/00ffcc?text=NO+COVER+DETECTED";
            }

            if(status) status.innerText = `SYNCING WITH APPWRITE METADATA...`;
            
            // Step 3: Register Metadata inside Appwrite Database using original presentation name strings
            await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                name: trackName,
                artist: artistName,
                genre: genre,
                fileUrl: publicFileUrl, 
                coverUrl: fetchedCover
            });

            successCount++;
        }

        if(status) {
            status.innerText = `TRANSMISSION COMPLETE. ${successCount} signals added.`;
            status.style.color = "var(--success)";
        }

        setTimeout(() => {
            if (typeof closeUploadModal === 'function') closeUploadModal();
            fetchTracks(); 
            if (btn) btn.disabled = false;
            if (fileInput) fileInput.value = "";
            if (trackInput) trackInput.value = ""; 
        }, 2000);

    } catch (error) {
        console.error("BATCH UPLOAD ERROR:", error);
        if(status) {
            status.innerText = "FAILED: " + (error.message || "Connection Lost");
            status.style.color = "var(--error)";
        }
        if (btn) btn.disabled = false;
    }
}

async function fetchCoverArt(trackName, artistName) {
    try {
        const query = encodeURIComponent(`${trackName} ${artistName}`);
        const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const lowResUrl = data.results[0].artworkUrl100;
            return lowResUrl.replace('100x100bb.jpg', '600x600bb.jpg');
        }
        return null;
    } catch (error) {
        console.error("iTunes Match Failed:", error);
        return null;
    }
}

// =========================================================================
// 4. MANAGEMENT ADMIN ACCESS QUERIES
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
            uploadAccessUntil: expirationTime
        });
        alert("Clearance granted for " + hours + " hours.");
    } catch (error) {
        console.error("Grant Access Error:", error);
        alert("Failed to grant clearance. Check console.");
    }
}

async function deleteTrack(trackId, trackName) {
    if (currentUserRole !== 'admin') return alert("Security Clearance Required.");
    if (!confirm(`CRITICAL WARNING: Are you absolutely sure you want to PERMANENTLY delete "${trackName}"?`)) return;

    try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, trackId);
        fetchTracks(); 
        console.log(`[SYSTEM] Signal "${trackName}" permanently erased.`);
    } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete signal.");
    }
}
