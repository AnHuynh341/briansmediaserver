

const { Client, Databases, Storage, ID, Query } = Appwrite;

const client = new Client();
client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('6a05cc27002debbf6591');

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = '6a05cc43000fdc34115a';
const BUCKET_ID = '6a05cdb0000bc961b45f';
const COLLECTION_ID = 'tracks';
const PLAYLIST_COLLECTION_ID = 'playlists';
const USERS_COLLECTION_ID = 'users';

let allTracks = [];
let currentPlaylistTracks = [];
let currentTrackIndex = 0;
let currentViewPlaylistIndex = -1;
let isShuffle = false;
let repeatMode = 0; // 0: Off, 1: Repeat All, 2: Repeat One
let userPlaylists = [];
let currentUser = null; // Store the logged-in user's name
let currentUserRole = null; // Store if they are admin or user
let currentUserId = null; // Store the DB document ID for the user

const audio = document.getElementById('audio');
const seekbar = document.getElementById('seekbar');
const volumebar = document.getElementById('volumebar');
const playIcon = document.getElementById('playIcon');

// ==========================================
// AUTH
// ==========================================

function handleKeyPress(e) {
  if (e.key === 'Enter') login();
}

async function login() {
  const u = document.getElementById('username').value.trim().toLowerCase();
  const p = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');

  if (!u || !p) return;
  btn.style.pointerEvents = 'none';
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> AUTHENTICATING...';

  try {
    // 1. Establish Anonymous Session to talk to DB
    const account = new Appwrite.Account(client);
    try { await account.createAnonymousSession(); } catch (e) {}

    // 2. Find the user in the database
    const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal("username", u)
    ]);

    if (response.documents.length === 0) throw new Error("User not found");
    const userDoc = response.documents[0];

    // 3. Check password
    if (userDoc.password !== p) throw new Error("Invalid password");

    // 4. Set global variables
    currentUser = userDoc.username;
    currentUserRole = userDoc.role;
    currentUserId = userDoc.$id;

    btn.classList.add('btn-success');
    btn.innerHTML = '<i class="fas fa-unlock-alt"></i> ACCESS GRANTED';

    setTimeout(() => {
      // 5. Force Password Change check
      if (userDoc.forceChange) {
        document.getElementById('changePasswordModal').classList.remove('hidden');
      } else {
        grantAccess();
      }
    }, 800);

  } catch (error) {
    btn.classList.add('btn-error');
    btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ACCESS DENIED';
    document.querySelector('.login-box').classList.add('shake-error');
    setTimeout(() => {
      btn.classList.remove('btn-error');
      document.querySelector('.login-box').classList.remove('shake-error');
      btn.innerHTML = 'Enter System';
      btn.style.pointerEvents = 'auto';
      document.getElementById('password').value = '';
    }, 1500);
  }
}

// Helper to transition into the app
function grantAccess() {
  document.getElementById('loginPage').classList.add('animate-out');
  setTimeout(() => {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainPage').classList.remove('hidden');
    document.getElementById('mainPage').classList.add('animate-in');
    
    // Check Role: Hide the upload button if it's a standard user
    if (currentUserRole !== 'admin') {
      const uploadNav = document.querySelector('.nav-links .nav-item:nth-child(2)');
      if(uploadNav) uploadNav.style.display = 'none';
    }

    fetchTracks();
    fetchPlaylists();
  }, 600);
}

async function updatePassword() {
  const p1 = document.getElementById('newPassword').value;
  const p2 = document.getElementById('confirmPassword').value;
  const btn = document.querySelector('#changePasswordModal .btn-save');

  if (p1.length < 6) return alert("Password must be at least 6 characters.");
  if (p1 !== p2) return alert("Passwords do not match.");

  btn.innerText = "UPDATING...";
  try {
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, currentUserId, {
      password: p1,
      forceChange: false
    });
    
    document.getElementById('changePasswordModal').classList.add('hidden');
    grantAccess(); // Let them in!
  } catch (error) {
    alert("Error updating security: " + error.message);
    btn.innerText = "Update Security";
  }
}

// ==========================================
// APPWRITE — TRACKS
// ==========================================

async function fetchTracks() {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderAsc("$createdAt")
    ]);
    const account = new Appwrite.Account(client);
    try { await account.createAnonymousSession(); } catch (e) {}

    allTracks = response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      artist: doc.artist,
      genre: doc.genre,
      file: doc.fileUrl
    }));

    if (allTracks.length > 0 && !audio.src) {
      loadTrack(0, false);
    }

    if (currentViewPlaylistIndex === -1) {
      currentPlaylistTracks = [...allTracks];
    } else {
      loadPlaylist(currentViewPlaylistIndex);
    }

    renderTrackList();
  } catch (error) {
    console.error("Appwrite Fetch Error:", error);
  }
}

// ==========================================
// APPWRITE — PLAYLISTS
// ==========================================

async function fetchPlaylists() {
  try {
    const response = await databases.listDocuments(DATABASE_ID, PLAYLIST_COLLECTION_ID);
    userPlaylists = response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      ids: doc.trackIds
    }));
    renderPlaylists();
  } catch (error) {
    console.error("Playlist Fetch Error:", error);
  }
}

async function savePlaylist() {
  const nameInput = document.getElementById('newPlaylistName').value.trim();
  if (!nameInput) return alert("Designation required.");

  const checkboxes = document.querySelectorAll('.playlist-checkbox:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);
  const editIndex = parseInt(document.getElementById('editPlaylistIndex').value);

  try {
    if (editIndex > -1) {
      const playlistId = userPlaylists[editIndex].id;
      await databases.updateDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, playlistId, {
        name: nameInput,
        trackIds: selectedIds
      });
    } else {
      await databases.createDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, ID.unique(), {
        name: nameInput,
        trackIds: selectedIds
      });
    }
    closePlaylistModal();
    fetchPlaylists();
  } catch (error) {
    alert("Failed to save playlist: " + error.message);
  }
}

// ==========================================
// UPLOAD
// ==========================================

function openUploadModal() {
  document.getElementById('uploadModal').classList.remove('hidden');
  document.getElementById('uploadStatus').innerText = "";
  if (fileNameDisplay) fileNameDisplay.innerText = "";
  document.getElementById('uploadFileInput').value = "";
  document.getElementById('uploadTrackName').value = "";
  document.getElementById('uploadArtistName').value = "";
  document.getElementById('uploadGenre').value = "J-POP";
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.add('hidden');
}

const dropZone = document.getElementById('dropZone');
const uploadFileInput = document.getElementById('uploadFileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');

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

function handleFileSelection() {
  const file = uploadFileInput.files[0];
  if (file) {
    if (fileNameDisplay) fileNameDisplay.innerText = file.name;
    const trackNameInput = document.getElementById('uploadTrackName');
    if (trackNameInput && trackNameInput.value === "") {
      trackNameInput.value = file.name.replace('.mp3', '');
    }
  }
}

document.getElementById('startUploadBtn').addEventListener('click', async function () {
  const file = uploadFileInput.files[0];
  const trackName = document.getElementById('uploadTrackName').value.trim();
  const artistName = document.getElementById('uploadArtistName').value.trim() || "Unknown Artist";
  const genre = document.getElementById('uploadGenre').value;
  const status = document.getElementById('uploadStatus');

  if (!file || !trackName) return alert("Please select a file and enter a name.");

  try {
    status.innerText = "AUTHENTICATING SESSION...";
    this.disabled = true;

    const account = new Appwrite.Account(client);
    try { await account.createAnonymousSession(); } catch (e) {}

    status.innerText = "UPLOADING MP3 TO VAULT...";
    status.style.color = "var(--accent)";

    const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), file);
    const fileResult = storage.getFileView(BUCKET_ID, uploadedFile.$id);

    status.innerText = "SYNCING TO DATABASE...";

    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      name: trackName,
      artist: artistName,
      genre: genre,
      fileUrl: fileResult.href
    });

    status.innerText = "TRANSMISSION COMPLETE.";
    status.style.color = "var(--success)";

    setTimeout(() => {
      closeUploadModal();
      fetchTracks();
      this.disabled = false;
    }, 1500);
  } catch (error) {
    console.error("DEBUG ERROR:", error);
    status.innerText = "FAILED: " + (error.message || "Connection Lost");
    status.style.color = "var(--error)";
    this.disabled = false;
  }
});

// ==========================================
// UI — PLAYLIST SIDEBAR
// ==========================================

function renderPlaylists() {
  const container = document.getElementById('playlists');
  container.innerHTML = '';
  userPlaylists.forEach((pl, index) => {
    const div = document.createElement('div');
    div.className = `playlist-item ${currentViewPlaylistIndex === index ? 'active' : ''}`;
    div.innerHTML = `<i class="fas fa-folder-open"></i> ${pl.name}`;
    div.onclick = () => loadPlaylist(index);
    container.appendChild(div);
  });
}

function showAllTracks() {
  currentViewPlaylistIndex = -1;
  document.getElementById('navAllTracks').classList.add('active');
  document.getElementById('viewTitle').innerText = "All Tracks";
  document.getElementById('editPlaylistBtn').classList.add('hidden');
  currentPlaylistTracks = [...allTracks];
  renderPlaylists();
  renderTrackList();
}

function loadPlaylist(index) {
  currentViewPlaylistIndex = index;
  document.getElementById('navAllTracks').classList.remove('active');
  const pl = userPlaylists[index];
  document.getElementById('viewTitle').innerText = pl.name;
  document.getElementById('editPlaylistBtn').classList.remove('hidden');
  currentPlaylistTracks = allTracks.filter(track => pl.ids.includes(track.id));
  renderPlaylists();
  renderTrackList();
}

function openPlaylistModal() {
  document.getElementById('modalTitle').innerText = 'CREATE NEW PLAYLIST';
  document.getElementById('newPlaylistName').value = '';
  document.getElementById('editPlaylistIndex').value = -1;
  buildModalTrackList([]);
  document.getElementById('playlistModal').classList.remove('hidden');
}

function openEditModal() {
  if (currentViewPlaylistIndex === -1) return;
  const pl = userPlaylists[currentViewPlaylistIndex];
  document.getElementById('modalTitle').innerText = 'EDIT PLAYLIST';
  document.getElementById('newPlaylistName').value = pl.name;
  document.getElementById('editPlaylistIndex').value = currentViewPlaylistIndex;
  buildModalTrackList(pl.ids);
  document.getElementById('playlistModal').classList.remove('hidden');
}

function buildModalTrackList(selectedIds) {
  const trackArea = document.getElementById('modalTrackSelection');
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

// ==========================================
// ADD SONGS TO EXISTING PLAYLIST
// ==========================================

function openAddSongsModal(playlistIndex) {
  const idx = playlistIndex !== undefined ? playlistIndex : currentViewPlaylistIndex;
  if (idx === -1) return alert("No playlist selected.");

  const pl = userPlaylists[idx];
  document.getElementById('addSongsModalTitle').innerText = `ADD TO: ${pl.name.toUpperCase()}`;
  document.getElementById('addSongsPlaylistIndex').value = idx;

  const trackArea = document.getElementById('addSongsTrackSelection');
  trackArea.innerHTML = '';

  allTracks.forEach((track) => {
    const alreadyIn = pl.ids.includes(track.id);
    const label = document.createElement('label');
    label.className = `track-checkbox-item ${alreadyIn ? 'already-in-playlist' : ''}`;
    label.innerHTML = `
      <input type="checkbox" class="addsongs-checkbox" value="${track.id}" ${alreadyIn ? 'checked disabled' : ''}>
      <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${track.name}</span>
      <span class="track-genre" style="${alreadyIn ? 'color:var(--success,#50fa7b);' : ''}">${alreadyIn ? '✓ IN LIST' : track.genre}</span>
    `;
    trackArea.appendChild(label);
  });

  document.getElementById('addSongsModal').classList.remove('hidden');
}

function closeAddSongsModal() {
  document.getElementById('addSongsModal').classList.add('hidden');
}

async function confirmAddSongs() {
  const idx = parseInt(document.getElementById('addSongsPlaylistIndex').value);
  const pl = userPlaylists[idx];

  const allChecked = document.querySelectorAll('.addsongs-checkbox:checked');
  const newIds = Array.from(allChecked).map(cb => cb.value);

  // Merge with existing IDs, deduplicated
  const mergedIds = [...new Set([...pl.ids, ...newIds])];

  if (mergedIds.length === pl.ids.length) {
    closeAddSongsModal();
    return; // Nothing new added
  }

  try {
    await databases.updateDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, pl.id, {
      trackIds: mergedIds
    });
    closeAddSongsModal();
    await fetchPlaylists();
    if (currentViewPlaylistIndex === idx) loadPlaylist(idx);
  } catch (error) {
    alert("Failed to update playlist: " + error.message);
  }
}

// ==========================================
// UI — TRACK LIST
// ==========================================

function renderTrackList() {
  const list = document.getElementById('trackList');
  list.innerHTML = '';

  if (currentPlaylistTracks.length === 0) {
    list.innerHTML = '<div style="color:var(--text-sub); padding:16px;">No signals detected.</div>';
    return;
  }

  currentPlaylistTracks.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'track';
    const isPlaying = (allTracks[currentTrackIndex] && allTracks[currentTrackIndex].id === t.id);
    if (isPlaying) div.classList.add('active');

    div.innerHTML = `
      <div class="track-num">${isPlaying ? '<i class="fas fa-volume-up"></i>' : i + 1}</div>
      <div class="track-info">
        <span class="track-title">${t.name}</span>
        <span class="track-meta">${t.artist} <span class="track-genre">${t.genre}</span></span>
      </div>
      <div class="track-duration">--:--</div>
    `;
    const originalIndex = allTracks.findIndex(track => track.id === t.id);
    div.onclick = () => loadTrack(originalIndex, true);
    list.appendChild(div);
  });
}

// ==========================================
// PLAYER CORE
// ==========================================

function loadTrack(i, autoplay = false) {
  if (i < 0 || i >= allTracks.length) return;
  currentTrackIndex = i;
  const track = allTracks[i];
  audio.src = track.file;
  document.getElementById('npTitle').innerText = track.name;
  document.getElementById('npArtist').innerText = track.artist;
  renderTrackList();
  if (autoplay) { audio.play(); playIcon.className = 'fas fa-pause'; }
  else { playIcon.className = 'fas fa-play'; }
}

function togglePlay() {
  if (!audio.src) return;
  if (audio.paused) { audio.play(); playIcon.className = 'fas fa-pause'; }
  else { audio.pause(); playIcon.className = 'fas fa-play'; }
}

// ==========================================
// SHUFFLE & REPEAT
// ==========================================

function toggleShuffle() {
  isShuffle = !isShuffle;
  const btn = document.getElementById('shuffleBtn');
  if (isShuffle) {
    btn.classList.add('active');
    btn.style.color = 'var(--accent, #00ffcc)';
    btn.style.textShadow = '0 0 8px var(--accent, #00ffcc)';
  } else {
    btn.classList.remove('active');
    btn.style.color = '';
    btn.style.textShadow = '';
  }
}

function toggleRepeat() {
  // Cycle: 0 (Off) -> 1 (Repeat All) -> 2 (Repeat One)
  repeatMode = (repeatMode + 1) % 3;
  const btn = document.getElementById('repeatBtn');
  const icon = btn.querySelector('i');

  // Reset all states
  btn.classList.remove('active');
  btn.removeAttribute('data-repeat-one');
  btn.style.color = ''; // Clear manual overrides
  btn.style.textShadow = '';

  if (repeatMode === 1) {
    // REPEAT ALL
    btn.classList.add('active');
    icon.className = 'fas fa-redo-alt';
    // Use your accent color from CSS
    btn.style.color = 'var(--accent)';
  } else if (repeatMode === 2) {
    // REPEAT ONE
    btn.classList.add('active');
    icon.className = 'fas fa-redo-alt';
    btn.setAttribute('data-repeat-one', 'true');
    // Change color slightly to distinguish from "Repeat All"
    btn.style.color = 'var(--success)'; 
  } else {
    // OFF
    icon.className = 'fas fa-redo-alt';
    btn.style.color = 'var(--text-sub)';
  }
}

// ==========================================
// NEXT / PREV
// ==========================================

function nextTrack(isAutoAdvance = false) {
  // Repeat One: only replay when the track naturally ends
  if (repeatMode === 2 && isAutoAdvance) {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  const currentIndexInPlaylist = currentPlaylistTracks.findIndex(
    t => t.id === allTracks[currentTrackIndex]?.id
  );

  let nextIndexInPlaylist;

  if (isShuffle && currentPlaylistTracks.length > 1) {
    // Pick a random track that isn't the current one
    do {
      nextIndexInPlaylist = Math.floor(Math.random() * currentPlaylistTracks.length);
    } while (nextIndexInPlaylist === currentIndexInPlaylist);
  } else {
    nextIndexInPlaylist = currentIndexInPlaylist + 1;

    if (nextIndexInPlaylist >= currentPlaylistTracks.length) {
      if (repeatMode === 1) {
        // Repeat All: wrap to start
        nextIndexInPlaylist = 0;
      } else {
        // No repeat: stop
        audio.pause();
        playIcon.className = 'fas fa-play';
        return;
      }
    }
  }

  const originalIndex = allTracks.findIndex(
    t => t.id === currentPlaylistTracks[nextIndexInPlaylist].id
  );
  loadTrack(originalIndex, true);
}

function prevTrack() {
  // Restart current track if more than 3 seconds in
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  const currentIndexInPlaylist = currentPlaylistTracks.findIndex(
    t => t.id === allTracks[currentTrackIndex]?.id
  );
  const prevIndexInPlaylist =
    (currentIndexInPlaylist - 1 + currentPlaylistTracks.length) % currentPlaylistTracks.length;

  const originalIndex = allTracks.findIndex(
    t => t.id === currentPlaylistTracks[prevIndexInPlaylist].id
  );
  loadTrack(originalIndex, true);
}

// ==========================================
// AUDIO EVENT LISTENERS (declared once)
// ==========================================

audio.addEventListener('ended', () => nextTrack(true));

audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    seekbar.value = (audio.currentTime / audio.duration) * 100;
    document.getElementById('currentTime').innerText = formatTime(audio.currentTime);
  }
});

audio.addEventListener('loadedmetadata', () => {
  document.getElementById('totalTime').innerText = formatTime(audio.duration);
});

seekbar.addEventListener('input', () => {
  audio.currentTime = (seekbar.value / 100) * audio.duration;
});

volumebar.addEventListener('input', () => {
  audio.volume = volumebar.value / 100;
});

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// This function runs when you click your "Add/Edit Songs" button
function openEditModal() {
  // 1. Safety check: make sure we are actually looking at a playlist
  if (currentViewPlaylistIndex === -1) return alert("Please select a collection first.");

  const pl = userPlaylists[currentViewPlaylistIndex];

  // 2. Change the modal title to reflect the current playlist
  document.getElementById('modalTitle').innerText = `EDITING: ${pl.name.toUpperCase()}`;
  
  // 3. Pre-fill the name input with the playlist's current name
  document.getElementById('newPlaylistName').value = pl.name;
  
  // 4. Tell the Save button which playlist we are editing (using the hidden input)
  document.getElementById('editPlaylistIndex').value = currentViewPlaylistIndex;
  
  // 5. Build the list of tracks and check the ones already in the playlist
  buildModalTrackList(pl.ids);
  
  // 6. Show the modal
  document.getElementById('playlistModal').classList.remove('hidden');
}

async function savePlaylist() {
  const nameInput = document.getElementById('newPlaylistName').value.trim();
  const editIndex = parseInt(document.getElementById('editPlaylistIndex').value);
  
  // Get all checked IDs from the modal
  const checkboxes = document.querySelectorAll('.playlist-checkbox:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);

  if (!nameInput) return alert("Collection name is required.");
  if (selectedIds.length === 0) return alert("Please select at least one signal.");

  try {
    const btn = document.getElementById('modalSaveBtn');
    btn.disabled = true;
    btn.innerText = "SAVING...";

    if (editIndex > -1) {
      // --- UPDATE EXISTING PLAYLIST ---
      const playlistId = userPlaylists[editIndex].id;
      
      await databases.updateDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, playlistId, {
        name: nameInput,
        trackIds: selectedIds
      });
      
      console.log("Collection Updated successfully.");
    } else {
      // --- CREATE NEW PLAYLIST ---
      await databases.createDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, ID.unique(), {
        name: nameInput,
        trackIds: selectedIds
      });
      
      console.log("New Collection Created.");
    }

    // Refresh everything
    closePlaylistModal();
    await fetchPlaylists(); // Reload the sidebar from Appwrite
    
    // If we were editing, stay on that playlist view to see the changes
    if (editIndex > -1) loadPlaylist(editIndex);
    
    btn.disabled = false;
    btn.innerText = "Save Playlist";

  } catch (error) {
    alert("Database Error: " + error.message);
    document.getElementById('modalSaveBtn').disabled = false;
  }
}
