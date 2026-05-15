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
let currentUser = null; 
let currentUserRole = null; 
let currentUserId = null; 

const audio = document.getElementById('audio');
const seekbar = document.getElementById('seekbar');
const volumebar = document.getElementById('volumebar');
const playIcon = document.getElementById('playIcon');

// ==========================================
// AUTHENTICATION
// ==========================================

// ==========================================
// AUTHENTICATION
// ==========================================

function handleKeyPress(e) {
  if (e.key === 'Enter') login();
}

async function login() {
  const btn = document.getElementById('loginBtn');

  // Check inputs directly from the DOM
  if (!document.getElementById('username').value.trim() || !document.getElementById('password').value) return;
  
  btn.style.pointerEvents = 'none';
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> AUTHENTICATING...';

  try {
    const account = new Appwrite.Account(client);
    try { await account.createAnonymousSession(); } catch (e) {
      // Session likely already exists, which is fine.
    }

    // Query the database directly using the input value
    const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal("username", document.getElementById('username').value.trim())
    ]);

    if (response.documents.length === 0) throw new Error("User not found");
    const userDoc = response.documents[0];

    // Validate password directly against the input
    if (userDoc.password !== document.getElementById('password').value) throw new Error("Invalid password");

    currentUser = userDoc.username;
    currentUserRole = userDoc.role;
    currentUserId = userDoc.$id;

    btn.classList.add('btn-success');
    btn.innerHTML = '<i class="fas fa-unlock-alt"></i> ACCESS GRANTED';

    setTimeout(() => {
      // Triggers if the DB boolean is true
      if (userDoc.forceChange) {
        document.getElementById('changePasswordModal').classList.remove('hidden');
      } else {
        grantAccess();
      }
    }, 800);

  } catch (error) {
    console.error("Login Error:", error); 
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
function grantAccess() {
  document.getElementById('loginPage').classList.add('animate-out');
  setTimeout(() => {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainPage').classList.remove('hidden');
    document.getElementById('mainPage').classList.add('animate-in');
    
    // Hide upload for normal users
    if (currentUserRole !== 'admin') {
      const uploadNav = document.querySelector('.nav-links .nav-item:nth-child(2)');
      if(uploadNav) uploadNav.style.display = 'none';
    }

    fetchTracks();
    fetchPlaylists();
  }, 600);
}

async function updatePassword() {
  const btn = document.querySelector('#changePasswordModal .btn-save');

  // Validate directly from the DOM elements
  if (document.getElementById('newPassword').value.length < 6) {
      return alert("Password must be at least 6 characters.");
  }
  if (document.getElementById('newPassword').value !== document.getElementById('confirmPassword').value) {
      return alert("Passwords do not match.");
  }

  btn.innerText = "UPDATING...";
  try {
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, currentUserId, {
      password: document.getElementById('newPassword').value,
      forceChange: false
    });
    
    document.getElementById('changePasswordModal').classList.add('hidden');
    grantAccess(); 
  } catch (error) {
    console.error("Update Document Error:", error);
    alert("Error updating security: " + error.message);
    btn.innerText = "Update Security";
  }
}

// ==========================================
// APPWRITE — FETCHING
// ==========================================

async function fetchTracks() {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderAsc("$createdAt")
    ]);
    
    allTracks = response.documents.map(doc => ({
      id: doc.$id, name: doc.name, artist: doc.artist, genre: doc.genre, file: doc.fileUrl
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
    
    renderPlaylists();
  } catch (error) {
    console.error("Playlist Fetch Error:", error);
  }
}

// ==========================================
// PLAYLIST MODAL LOGIC (Create & Edit)
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
    btn.disabled = true;
    btn.innerText = "SAVING...";

    if (editIndex > -1) {
      // UPDATE
      const playlistId = userPlaylists[editIndex].id;
      await databases.updateDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, playlistId, {
        name: nameInput, trackIds: selectedIds
      });
    } else {
      // CREATE
      await databases.createDocument(DATABASE_ID, PLAYLIST_COLLECTION_ID, ID.unique(), {
        name: nameInput, trackIds: selectedIds, owner: currentUser
      });
    }

    closePlaylistModal();
    await fetchPlaylists(); 
    
    if (editIndex > -1) loadPlaylist(editIndex);
    
    btn.disabled = false;
    btn.innerText = "Save Playlist";
  } catch (error) {
    alert("Database Error: " + error.message);
    document.getElementById('modalSaveBtn').disabled = false;
  }
}

// ==========================================
// UPLOAD LOGIC
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

    status.innerText = "UPLOADING MP3 TO VAULT...";
    status.style.color = "var(--accent)";

    const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), file);
    const fileResult = storage.getFileView(BUCKET_ID, uploadedFile.$id);

    status.innerText = "SYNCING TO DATABASE...";

    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      name: trackName, artist: artistName, genre: genre, fileUrl: fileResult.href
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
// UI — VIEWS
// ==========================================

function renderPlaylists() {
  const container = document.getElementById('playlists');
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
  
  // Show Edit button ONLY if the user owns it
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
// PLAYER ENGINE
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
  repeatMode = (repeatMode + 1) % 3;
  const btn = document.getElementById('repeatBtn');
  const icon = btn.querySelector('i');

  btn.classList.remove('active');
  btn.removeAttribute('data-repeat-one');
  btn.style.color = ''; 
  btn.style.textShadow = '';

  if (repeatMode === 1) {
    btn.classList.add('active');
    icon.className = 'fas fa-redo-alt';
    btn.style.color = 'var(--accent)';
  } else if (repeatMode === 2) {
    btn.classList.add('active');
    icon.className = 'fas fa-redo-alt';
    btn.setAttribute('data-repeat-one', 'true');
    btn.style.color = 'var(--success)'; 
  } else {
    icon.className = 'fas fa-redo-alt';
    btn.style.color = 'var(--text-sub)';
  }
}

function nextTrack(isAutoAdvance = false) {
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
    do {
      nextIndexInPlaylist = Math.floor(Math.random() * currentPlaylistTracks.length);
    } while (nextIndexInPlaylist === currentIndexInPlaylist);
  } else {
    nextIndexInPlaylist = currentIndexInPlaylist + 1;

    if (nextIndexInPlaylist >= currentPlaylistTracks.length) {
      if (repeatMode === 1) {
        nextIndexInPlaylist = 0;
      } else {
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
// AUDIO EVENT LISTENERS
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
