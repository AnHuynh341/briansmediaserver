const USERNAME = 'admin';
const PASSWORD = 'admin';

let allTracks = [];
let currentPlaylistTracks = [];
let currentTrackIndex = 0;
let currentViewPlaylistIndex = -1; // -1 = All Tracks

// --- NEW STATE VARIABLES ---
let isShuffle = false;
let repeatMode = 0; // 0: Off, 1: Repeat All, 2: Repeat One

let userPlaylists = [
  { name: "Tony", ids: [0, 1] },
  { name: "Prime Directives", ids: [2] } 
];

const audio = document.getElementById('audio');
const seekbar = document.getElementById('seekbar');
const volumebar = document.getElementById('volumebar');
const playIcon = document.getElementById('playIcon');

// Allow pressing Enter to login
function handleKeyPress(e) {
  if (e.key === 'Enter') login();
}

function login() {
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');
  const loginBox = document.querySelector('.login-box');

  if (btn.style.pointerEvents === 'none') return;

  btn.style.pointerEvents = 'none';
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> AUTHENTICATING...';

  setTimeout(() => {
    if (u === USERNAME && p === PASSWORD) {
      btn.classList.add('btn-success');
      btn.innerHTML = '<i class="fas fa-unlock-alt"></i> ACCESS GRANTED';
      
      setTimeout(() => {
        document.getElementById('loginPage').classList.add('animate-out');
        setTimeout(() => {
          document.getElementById('loginPage').style.display = 'none';
          const mainPage = document.getElementById('mainPage');
          mainPage.classList.remove('hidden');
          mainPage.classList.add('animate-in');
          fetchTracks();
        }, 600);
      }, 800);
    } else {
      btn.classList.add('btn-error');
      btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ACCESS DENIED';
      loginBox.classList.add('shake-error');
      
      setTimeout(() => {
        btn.classList.remove('btn-error');
        loginBox.classList.remove('shake-error');
        btn.innerHTML = 'Enter System';
        btn.style.pointerEvents = 'auto';
        document.getElementById('password').value = ''; 
      }, 1500);
    }
  }, 1200); 
}

// Identify Genre based on Filename Characters
function identifyGenre(filename) {
  // Regex matches common Japanese characters (Kanji, Hiragana, Katakana)
  const japaneseRegex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\uFAFF\uFF66-\uFF9F]/;
  if (japaneseRegex.test(filename)) {
    return "J-Pop";
  }
  return "US-UK"; // Default assumption for English-based titles
}

async function fetchTracks() {
  try {
    const response = await fetch('files/tracks.json');
    const data = await response.json();
    
    allTracks = data.map(t => {
      const rawName = t.name || t.file.split('/').pop().replace('.mp3', '');
      return {
        name: rawName,
        artist: t.artist || "Unknown Source",
        genre: identifyGenre(rawName),
        file: t.file
      };
    });

    currentPlaylistTracks = [...allTracks];
    renderPlaylists();
    showAllTracks();
    
    if (allTracks.length > 0) {
      loadTrack(0, false);
    }
  } catch (err) {
    console.error('Failed to load track list', err);
    // Fallback Data matching your screenshot examples
    const dummyFiles = [
      "(15) 5 Seconds Of Summer - Youngblood (Lyrics) 5SOS - YouTube",
      "(15) Aaron Smith - Dancin (KRONO Remix) Lyrics - YouTube",
      "(15) AEAO By Dynamic Duo With DJ Premier",
      "Ainekleine_kanade",
      "YOASOBITabun (Có lẽ) Official",
      "King Gnu - 逆夢 - YouTube",
      "Deep Purple - Smoke On the Water"
    ];
    
    allTracks = dummyFiles.map(name => ({
      name: name,
      artist: "Unknown Source",
      genre: identifyGenre(name),
      file: "" 
    }));

    currentPlaylistTracks = [...allTracks];
    renderPlaylists();
    showAllTracks();
  }
}

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
  document.getElementById('editPlaylistBtn').classList.add('hidden'); // Hide edit button
  currentPlaylistTracks = [...allTracks];
  renderPlaylists(); // update active states
  renderTrackList();
}

function loadPlaylist(index) {
  currentViewPlaylistIndex = index;
  document.getElementById('navAllTracks').classList.remove('active');
  const pl = userPlaylists[index];
  document.getElementById('viewTitle').innerText = pl.name;
  document.getElementById('editPlaylistBtn').classList.remove('hidden'); // Show edit button
  currentPlaylistTracks = pl.ids.map(id => allTracks[id]).filter(t => t);
  renderPlaylists(); // update active states
  renderTrackList();
}

// --- Modal Functions (Create & Edit) ---

function openPlaylistModal() {
  document.getElementById('modalTitle').innerText = 'CREATE NEW PLAYLIST';
  document.getElementById('newPlaylistName').value = '';
  document.getElementById('editPlaylistIndex').value = -1;
  document.getElementById('modalSaveBtn').innerText = 'Create Playlist';
  
  buildModalTrackList([]); // No pre-selected tracks
  document.getElementById('playlistModal').classList.remove('hidden');
}

function openEditModal() {
  if (currentViewPlaylistIndex === -1) return;
  const pl = userPlaylists[currentViewPlaylistIndex];
  
  document.getElementById('modalTitle').innerText = 'EDIT PLAYLIST';
  document.getElementById('newPlaylistName').value = pl.name;
  document.getElementById('editPlaylistIndex').value = currentViewPlaylistIndex;
  document.getElementById('modalSaveBtn').innerText = 'Update Playlist';
  
  buildModalTrackList(pl.ids); // Pre-check existing tracks
  document.getElementById('playlistModal').classList.remove('hidden');
}

function buildModalTrackList(selectedIds) {
  const trackArea = document.getElementById('modalTrackSelection');
  trackArea.innerHTML = '';

  allTracks.forEach((track, index) => {
    const isChecked = selectedIds.includes(index) ? 'checked' : '';
    const label = document.createElement('label');
    label.className = 'track-checkbox-item';
    label.innerHTML = `
      <input type="checkbox" class="playlist-checkbox" value="${index}" ${isChecked}>
      <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
        ${track.name}
      </span>
      <span class="track-genre">${track.genre}</span>
    `;
    trackArea.appendChild(label);
  });
}

function closePlaylistModal() {
  document.getElementById('playlistModal').classList.add('hidden');
}

function savePlaylist() {
  const nameInput = document.getElementById('newPlaylistName').value.trim();
  if (!nameInput) {
    alert("Designation required.");
    return;
  }

  const checkboxes = document.querySelectorAll('.playlist-checkbox:checked');
  const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
  const editIndex = parseInt(document.getElementById('editPlaylistIndex').value);

  if (editIndex > -1) {
    // Update Existing Playlist
    userPlaylists[editIndex].name = nameInput;
    userPlaylists[editIndex].ids = selectedIds;
    loadPlaylist(editIndex); // Refresh view
  } else {
    // Create New Playlist
    const newPlaylist = { name: nameInput, ids: selectedIds };
    userPlaylists.push(newPlaylist);
    renderPlaylists(); 
  }
  closePlaylistModal(); 
}

// --- NEW TOGGLE FUNCTIONS ---
function toggleShuffle() {
  isShuffle = !isShuffle;
  const btn = document.getElementById('shuffleBtn');
  if (btn) {
    if (isShuffle) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }
}

function toggleRepeat() {
  // Cycle through modes: 0 -> 1 -> 2 -> 0
  repeatMode = (repeatMode + 1) % 3;
  const btn = document.getElementById('repeatBtn');
  if (!btn) return;
  const icon = btn.querySelector('i');

  btn.classList.remove('active');
  
  if (repeatMode === 0) {
    icon.className = 'fas fa-redo-alt'; // Off
  } else if (repeatMode === 1) {
    btn.classList.add('active');
    icon.className = 'fas fa-redo-alt'; // Repeat All
  } else if (repeatMode === 2) {
    btn.classList.add('active');
    icon.className = 'fas fa-redo-alt'; // Repeat 1
  }
}

// --- Track Listing & Player ---

function renderTrackList() {
  const list = document.getElementById('trackList');
  list.innerHTML = '';
  
  if (currentPlaylistTracks.length === 0) {
    list.innerHTML = '<div style="color:var(--text-sub); padding:16px;">No signals detected in this collection. Click "Add/Edit Songs" to append.</div>';
    return;
  }

  currentPlaylistTracks.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'track';
    
    const isPlaying = (allTracks[currentTrackIndex] === t);
    if(isPlaying) div.classList.add('active');

    div.innerHTML = `
      <div class="track-num">${isPlaying ? '<i class="fas fa-volume-up"></i>' : i + 1}</div>
      <div class="track-info">
        <span class="track-title">${t.name}</span>
        <span class="track-meta">${t.artist} <span class="track-genre">${t.genre}</span></span>
      </div>
      <div class="track-duration">--:--</div>
    `;
    
    const originalIndex = allTracks.indexOf(t);
    div.onclick = () => loadTrack(originalIndex, true);
    list.appendChild(div);
  });
}

function loadTrack(i, autoplay = false) {
  if(i < 0 || i >= allTracks.length) return;
  currentTrackIndex = i;
  const track = allTracks[i];
  
  audio.src = track.file;
  
  document.getElementById('npTitle').innerText = track.name;
  document.getElementById('npArtist').innerText = `${track.artist} • ${track.genre}`;
  
  renderTrackList(); 

  if (autoplay) {
    audio.play();
    playIcon.className = 'fas fa-pause';
  } else {
    playIcon.className = 'fas fa-play';
  }
}

function togglePlay() {
  if(!audio.src) return;
  if (audio.paused) {
    audio.play();
    playIcon.className = 'fas fa-pause';
  } else {
    audio.pause();
    playIcon.className = 'fas fa-play';
  }
}

function nextTrack(isAutoAdvance = false) {
  // Handle "Repeat One"
  if (repeatMode === 2 && isAutoAdvance) {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  // Find where we currently are in the ACTIVE playlist
  let currentIndexInPlaylist = currentPlaylistTracks.indexOf(allTracks[currentTrackIndex]);
  if (currentIndexInPlaylist === -1) currentIndexInPlaylist = 0; // Fallback

  let nextIndexInPlaylist;

  // Handle Shuffle
  if (isShuffle && currentPlaylistTracks.length > 1) {
    do {
      nextIndexInPlaylist = Math.floor(Math.random() * currentPlaylistTracks.length);
    } while (nextIndexInPlaylist === currentIndexInPlaylist); // Don't play the exact same song twice
  } else {
    // Handle Sequential Play
    nextIndexInPlaylist = currentIndexInPlaylist + 1;

    // Check if we reached the end of the playlist
    if (nextIndexInPlaylist >= currentPlaylistTracks.length) {
      if (repeatMode === 0 && isAutoAdvance) {
        // Repeat is OFF: Stop playing
        audio.pause();
        playIcon.className = 'fas fa-play';
        loadTrack(allTracks.indexOf(currentPlaylistTracks[0]), false); // Reset to track 1
        return;
      } else {
        // Repeat is ON (or user manually clicked Next): Loop to start
        nextIndexInPlaylist = 0;
      }
    }
  }

  // Map back to the global index to load the audio
  const originalIndex = allTracks.indexOf(currentPlaylistTracks[nextIndexInPlaylist]);
  loadTrack(originalIndex, true);
}

function prevTrack() {
  // If playing for more than 3 seconds, just restart the song
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  let currentIndexInPlaylist = currentPlaylistTracks.indexOf(allTracks[currentTrackIndex]);
  if (currentIndexInPlaylist === -1) currentIndexInPlaylist = 0;

  // Go backward in the current playlist
  let prevIndexInPlaylist = (currentIndexInPlaylist - 1 + currentPlaylistTracks.length) % currentPlaylistTracks.length;
  
  const originalIndex = allTracks.indexOf(currentPlaylistTracks[prevIndexInPlaylist]);
  loadTrack(originalIndex, true);
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const progress = (audio.currentTime / audio.duration) * 100;
    seekbar.value = progress;
    document.getElementById('currentTime').innerText = formatTime(audio.currentTime);
    seekbar.style.background = `linear-gradient(to right, var(--accent) ${progress}%, rgba(255,255,255,0.1) ${progress}%)`;
  }
});

audio.addEventListener('loadedmetadata', () => {
  document.getElementById('totalTime').innerText = formatTime(audio.duration);
});

// Pass true to indicate auto-advance triggers the "ended" event
audio.addEventListener('ended', () => nextTrack(true));

seekbar.addEventListener('input', () => {
  if (audio.duration) {
    audio.currentTime = (seekbar.value / 100) * audio.duration;
  }
});

volumebar.addEventListener('input', () => {
  audio.volume = volumebar.value / 100;
});