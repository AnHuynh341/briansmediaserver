// ==========================================================
// W41IT playlist editor polish
// ==========================================================
// Makes the add/edit playlist dialog mirror the playlist sorter: one clean
// table with Select / Track / Artist columns, while keeping live search.

(() => {
    const SEARCH_INPUT_ID = 'playlistTrackSearch';
    const SEARCH_META_ID = 'playlistTrackSearchMeta';
    const SEARCH_EMPTY_ID = 'playlistTrackSearchEmpty';
    const HEADER_ID = 'playlistTrackSelectionHeader';

    function normalizeSearchText(value) {
        return String(value || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getSearchInput() {
        return document.getElementById(SEARCH_INPUT_ID);
    }

    function decoratePlaylistTrackRows() {
        const list = document.getElementById('modalTrackSelection');
        if (!list) return;

        list.classList.add('sort-playlist-list', 'playlist-select-list');

        list.querySelectorAll('.track-checkbox-item').forEach(label => {
            const checkbox = label.querySelector('.playlist-checkbox');
            if (!checkbox) return;

            const track = allTracks.find(item => item.id === checkbox.value);
            if (!track) return;

            label.dataset.playlistSearch = normalizeSearchText(
                `${getDisplayTrackName(track.name)} ${track.artist || ''}`
            );

            // Rebuild the original compact checkbox row into the exact same
            // three-column structure used by the sort modal.
            label.classList.add('sort-track-row', 'playlist-select-row');

            const selectCell = document.createElement('span');
            selectCell.className = 'sort-track-position playlist-select-check';
            selectCell.appendChild(checkbox);

            const titleCell = document.createElement('span');
            titleCell.className = 'sort-track-title playlist-select-title';
            const titleText = document.createElement('span');
            titleText.textContent = getDisplayTrackName(track.name);
            titleCell.appendChild(titleText);

            const artistCell = document.createElement('span');
            artistCell.className = 'sort-track-artist playlist-select-artist';
            artistCell.textContent = track.artist || 'Unknown Artist';

            label.replaceChildren(selectCell, titleCell, artistCell);
        });
    }

    function applyPlaylistTrackSearch() {
        const list = document.getElementById('modalTrackSelection');
        const input = getSearchInput();
        const meta = document.getElementById(SEARCH_META_ID);
        const empty = document.getElementById(SEARCH_EMPTY_ID);
        if (!list) return;

        decoratePlaylistTrackRows();

        const query = normalizeSearchText(input?.value || '');
        const rows = Array.from(list.querySelectorAll('.track-checkbox-item'));
        let visible = 0;

        rows.forEach(row => {
            const matches = !query || (row.dataset.playlistSearch || '').includes(query);
            row.classList.toggle('playlist-track-filtered-out', !matches);
            if (matches) visible++;
        });

        if (meta) {
            meta.textContent = query
                ? `${visible} of ${rows.length} tracks`
                : `${rows.length} track${rows.length === 1 ? '' : 's'}`;
        }

        if (empty) {
            empty.classList.toggle('hidden', visible !== 0 || rows.length === 0);
        }
    }

    function resetPlaylistTrackSearch() {
        const input = getSearchInput();
        if (input) input.value = '';
        applyPlaylistTrackSearch();
    }

    function installPlaylistSearchUi() {
        const modal = document.getElementById('playlistModal');
        const content = modal?.querySelector('.modal-content');
        const nameInput = document.getElementById('newPlaylistName');
        const list = document.getElementById('modalTrackSelection');
        if (!modal || !content || !nameInput || !list) return;

        // Reuse the sort modal's sizing and visual language instead of keeping
        // a second, unrelated playlist-editor layout.
        content.classList.add('playlist-edit-modal', 'sort-playlist-modal');

        if (!document.getElementById(SEARCH_INPUT_ID)) {
            const search = document.createElement('div');
            search.className = 'playlist-track-search';
            search.innerHTML = `
                <i class="fas fa-search" aria-hidden="true"></i>
                <input id="${SEARCH_INPUT_ID}"
                       type="search"
                       placeholder="Search songs or artists..."
                       autocomplete="off"
                       aria-label="Search songs or artists">
                <span id="${SEARCH_META_ID}" class="playlist-track-search-meta"></span>
            `;
            nameInput.insertAdjacentElement('afterend', search);
            search.querySelector('input')?.addEventListener('input', applyPlaylistTrackSearch);
        }

        if (!document.getElementById(HEADER_ID)) {
            const header = document.createElement('div');
            header.id = HEADER_ID;
            header.className = 'sort-list-header playlist-select-header';
            header.innerHTML = '<span>SELECT</span><span>TRACK</span><span>ARTIST</span>';
            list.insertAdjacentElement('beforebegin', header);
        }

        if (!document.getElementById(SEARCH_EMPTY_ID)) {
            const empty = document.createElement('div');
            empty.id = SEARCH_EMPTY_ID;
            empty.className = 'playlist-track-search-empty hidden';
            empty.innerHTML = '<i class="fas fa-search"></i><span>No matching tracks.</span>';
            list.insertAdjacentElement('afterend', empty);
        }

        decoratePlaylistTrackRows();
        applyPlaylistTrackSearch();
    }

    function installPlaylistPolishStyles() {
        if (document.getElementById('w41it-playlist-modal-polish-style')) return;

        const style = document.createElement('style');
        style.id = 'w41it-playlist-modal-polish-style';
        style.textContent = `
          #playlistModal .playlist-edit-modal{
            overflow:hidden;
          }
          #playlistModal .playlist-edit-modal>h3{
            margin-bottom:12px;
          }
          #playlistModal #newPlaylistName{
            flex:0 0 auto;
            margin-bottom:12px;
          }

          .playlist-track-search{
            position:relative;
            display:flex;
            align-items:center;
            gap:9px;
            flex:0 0 auto;
            margin-bottom:12px;
            border:1px solid rgba(255,255,255,.09);
            border-radius:8px;
            background:rgba(0,0,0,.12);
            transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;
          }
          .playlist-track-search:focus-within{
            border-color:rgba(0,229,255,.36);
            box-shadow:0 0 0 3px rgba(0,229,255,.06);
            background:rgba(0,229,255,.025);
          }
          .playlist-track-search>i{
            position:absolute;
            left:13px;
            color:var(--text-sub);
            font-size:.8rem;
            pointer-events:none;
          }
          #playlistModal .playlist-track-search input[type="search"]{
            min-width:0;
            flex:1;
            margin:0;
            padding:11px 8px 11px 38px;
            border:0;
            outline:0;
            background:transparent;
            color:var(--text-main);
            font:inherit;
            font-size:.86rem;
          }
          .playlist-track-search-meta{
            flex:0 0 auto;
            padding-right:12px;
            color:var(--text-sub);
            font-size:.68rem;
            white-space:nowrap;
          }

          #playlistModal .playlist-select-header,
          #playlistModal .playlist-select-row{
            display:grid;
            grid-template-columns:70px minmax(220px,1.6fr) minmax(180px,1fr);
            align-items:center;
            column-gap:14px;
            box-sizing:border-box;
          }
          #playlistModal .playlist-select-header{
            margin:0;
          }
          #playlistModal .playlist-select-list{
            flex:1;
            min-height:0;
            max-height:none;
            margin:0 0 12px;
            padding:0;
            border:0;
            border-radius:0;
            background:rgba(0,0,0,.12);
          }
          #playlistModal .playlist-select-row{
            min-height:44px;
            margin:0;
            padding:11px 12px;
            border-radius:0;
            cursor:pointer;
            user-select:none;
            color:var(--text-main);
            text-transform:none;
            letter-spacing:normal;
          }
          #playlistModal .playlist-select-row:active{
            cursor:pointer;
          }
          #playlistModal .playlist-select-row.playlist-track-filtered-out{
            display:none;
          }
          #playlistModal .playlist-select-check{
            display:flex;
            align-items:center;
            justify-content:flex-start;
            min-width:0;
          }
          #playlistModal .playlist-select-check input[type="checkbox"]{
            width:16px;
            height:16px;
            margin:0;
            accent-color:var(--accent);
            cursor:pointer;
            flex:0 0 auto;
          }
          #playlistModal .playlist-select-title{
            display:flex;
            align-items:center;
            min-width:0;
            gap:0;
            font-size:.86rem;
            font-weight:500;
          }
          #playlistModal .playlist-select-title>span,
          #playlistModal .playlist-select-artist{
            min-width:0;
            overflow:hidden;
            white-space:nowrap;
            text-overflow:ellipsis;
          }
          #playlistModal .playlist-select-artist{
            display:block;
            font-size:.86rem;
          }
          .playlist-track-search-empty{
            flex:0 0 auto;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            min-height:44px;
            margin:-4px 0 8px;
            color:var(--text-sub);
            font-size:.76rem;
          }
          .playlist-track-search-empty.hidden{display:none}
          #playlistModal .modal-actions{
            padding-top:12px;
            margin-top:0;
            border-top:1px solid rgba(255,255,255,.06);
          }

          @media(max-width:600px){
            #playlistModal .playlist-edit-modal{
              width:100%;
              height:90vh;
              max-height:90vh;
            }
            #playlistModal .playlist-select-header,
            #playlistModal .playlist-select-row{
              grid-template-columns:48px minmax(0,1.35fr) minmax(0,1fr);
              column-gap:8px;
            }
            #playlistModal .playlist-select-header{
              padding:7px 6px;
              font-size:.62rem;
            }
            #playlistModal .playlist-select-row{
              padding:11px 6px;
              font-size:.78rem;
            }
            #playlistModal .playlist-select-title,
            #playlistModal .playlist-select-artist{
              font-size:.78rem;
            }
            .playlist-track-search-meta{display:none}
            #playlistModal .modal-actions button{flex:1}
          }
        `;
        document.head.appendChild(style);
    }

    function patchPlaylistFunctions() {
        if (typeof buildModalTrackList === 'function' && !buildModalTrackList.__w41itSearchPatched) {
            const originalBuild = buildModalTrackList;
            const wrappedBuild = function (...args) {
                const result = originalBuild.apply(this, args);
                installPlaylistSearchUi();
                applyPlaylistTrackSearch();
                return result;
            };
            wrappedBuild.__w41itSearchPatched = true;
            buildModalTrackList = wrappedBuild;
        }

        if (typeof openPlaylistModal === 'function' && !openPlaylistModal.__w41itSearchPatched) {
            const originalOpen = openPlaylistModal;
            const wrappedOpen = function (...args) {
                const result = originalOpen.apply(this, args);
                installPlaylistSearchUi();
                resetPlaylistTrackSearch();
                return result;
            };
            wrappedOpen.__w41itSearchPatched = true;
            openPlaylistModal = wrappedOpen;
        }

        if (typeof openEditModal === 'function' && !openEditModal.__w41itSearchPatched) {
            const originalEdit = openEditModal;
            const wrappedEdit = function (...args) {
                const result = originalEdit.apply(this, args);
                installPlaylistSearchUi();
                resetPlaylistTrackSearch();
                return result;
            };
            wrappedEdit.__w41itSearchPatched = true;
            openEditModal = wrappedEdit;
        }
    }

    function initializePlaylistModalPolish() {
        installPlaylistPolishStyles();
        installPlaylistSearchUi();
        patchPlaylistFunctions();

        const editButton = document.getElementById('editPlaylistBtn');
        if (editButton) {
            editButton.innerHTML = '<i class="fas fa-pen"></i> Edit Playlist';
        }
    }

    initializePlaylistModalPolish();
})();
