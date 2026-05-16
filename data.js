// ==========================================
// DATA.JS — Appwrite Fetching, Playlists, Upload & Admin
// ==========================================

// ==========================================
// APPWRITE — FETCHING
// ==========================================

// ==========================================
// APPWRITE — FETCHING
// ==========================================


async function fetchTracks() {
    try {
        // 1. Fetch metadata directly from Appwrite database table
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.orderAsc("$createdAt"),
            Query.limit(500)
        ]);

        // 2. Map the data directly
        allTracks = response.documents.map(doc => ({
            id: doc.$id,
            name: doc.name,
            artist: doc.artist,
            genre: doc.genre,
            file: doc.fileUrl, // Direct public Cloudflare R2 streaming resource link
            cover: doc.coverUrl || "https://via.placeholder.com/600x600/0f172a/00ffcc?text=NO+COVER"
        }));

        // ---- The rest of the playback UI ----
        if (allTracks.length > 0 && !audio.src) {
            if (typeof loadTrack === 'function') loadTrack(0, false);
        }

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

// ==========================================
// PLAYLIST MODAL LOGIC
// ==========================================

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

// ==========================================
// UPLOAD LOGIC
// ==========================================

function openUploadModal() {
    document.getElementById('uploadModal').classList.remove('hidden');
    
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
    document.getElementById('uploadModal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
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

// ==========================================
// BULLETPROOF UPLOAD FUNCTION (NO TIMERS)
// ==========================================

// ==========================================
// SWAPPED CLOUDFLARE R2 UPLOAD ENGINE
// ==========================================
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
            
            let trackName;
            if (files.length === 1 && customTrackName !== "") {
                trackName = customTrackName;
            } else {
                trackName = file.name.replace(/\.[^/.]+$/, "");
            }

            if(status) {
                status.innerText = `REQUESTING R2 CLEARANCE [${i + 1}/${files.length}]...`;
                status.style.color = "var(--accent)";
            }

            // 1. Get a secure, temporary pre-signed PUT token from your Worker
            const workerUrl = 'https://main.meochon341.workers.dev'; 
            
            const clearanceResponse = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, contentType: file.type })
            });
            
            if (!clearanceResponse.ok) throw new Error("Worker rejected request");
            const { uploadUrl, publicFileUrl } = await clearanceResponse.json();

            if(status) status.innerText = `BEAMING BINARY DATA TO CLOUDFLARE R2...`;

            // 2. Upload the raw binary stream directly to R2 using the signed path
            await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file 
            });

            if(status) status.innerText = `MATCHING ARTWORK [${i + 1}/${files.length}]: ${trackName}...`;
            let fetchedCover = await fetchCoverArt(trackName, artistName);

            if (!fetchedCover) {
                fetchedCover = "https://via.placeholder.com/600x600/0f172a/00ffcc?text=NO+COVER+DETECTED";
            }

            if(status) status.innerText = `SYNCING WITH APPWRITE METADATA...`;
            
            // 3. Save metadata entries into Appwrite using your persistent Cloudflare R2 address link!
            await databases.createDocument(DATABASE_ID, COLLECTION_ID, Appwrite.ID.unique(), {
                name: trackName,
                artist: artistName,
                genre: genre,
                fileUrl: publicFileUrl, // Stores the R2 public link inside Appwrite
                coverUrl: fetchedCover
            });

            successCount++;
        }

        if(status) {
            status.innerText = `TRANSMISSION COMPLETE. ${successCount} signals added.`;
            status.style.color = "var(--success)";
        }

        setTimeout(() => {
            closeUploadModal();
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



// ==========================================
// iTUNES API ARTWORK MATCHER
// ==========================================

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

// ==========================================
// ADMIN FUNCTIONS (Security Clearance)
// ==========================================

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
// ==========================================
// ADMIN: PERMANENTLY DELETE TRACK
// ==========================================
async function deleteTrack(trackId, trackName) {
    // 1. Security Check: Only admins can do this
    if (currentUserRole !== 'admin') return alert("Security Clearance Required.");
    
    // 2. Final Warning Check
    if (!confirm(`CRITICAL WARNING: Are you absolutely sure you want to PERMANENTLY delete "${trackName}" from the database? This cannot be undone.`)) return;

    try {
        // 3. Vaporize the document from the Appwrite Database
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, trackId);
        
        // 4. Refresh the track list so it vanishes from the screen
        fetchTracks(); 
        
        // Optional: Let the admin know it worked
        console.log(`[SYSTEM] Signal "${trackName}" permanently erased.`);
    } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete signal. Check console.");
    }
}

