// ==========================================================
// W41IT playlist editor polish
// ==========================================================
// Makes the add/edit playlist dialog roomier, adds live title/artist search,
// and keeps the hero action label concise.

(() => {
    const SEARCH_INPUT_ID = 'playlistTrackSearch';
    const SEARCH_META_ID = 'playlistTrackSearchMeta';
    const SEARCH_EMPTY_ID = 'playlistTrackSearchEmpty';

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

        list.querySelectorAll('.track-checkbox-item').forEach(label => {
            const checkbox = label.querySelector('.playlist-checkbox');
            if (!checkbox) return;

            const track = allTracks.find(item => item.id === checkbox.value);
            if (!track) return;

            label.dataset.playlistSearch = normalizeSearchText(
                `${getDisplayTrackName(track.name)} ${track.artist || ''}`
            );

            if (label.querySelector('.playlist-track-copy')) return;

            const children = Array.from(label.children);
            const originalTitle = children.find(element =>
                element !== checkbox && !element.classList.contains('track-genre')
            );
            const genre = label.querySelector('.track-genre');

            const copy = document.createElement('span');
            copy.className = 'playlist-track-copy';

            const title = document.createElement('strong');
            title.className = 'playlist-track-title';
            title.textContent = getDisplayTrackName(track.name);

            const artist = document.createElement('small');
            artist.className = 'playlist-track-artist';
            artist.textContent = track.artist || 'Unknown Artist';

            copy.append(title, artist);

            if (originalTitle) originalTitle.replaceWith(copy);
            else if (genre) label.insertBefore(copy, genre);
            else label.appendChild(copy);
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

        content.classList.add('playlist-edit-modal');

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

            const empty = document.createElement('div');
            empty.id = SEARCH_EMPTY_ID;
            empty.className = 'playlist-track-search-empty hidden';
            empty.innerHTML = '<i class="fas fa-search"></i><span>No matching tracks.</span>';
            list.insertAdjacentElement('afterend', empty);

            search.querySelector('input')?.addEventListener('input', applyPlaylistTrackSearch);
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
            width:min(760px,calc(100vw - 32px));
            max-height:min(88vh,820px);
            padding:26px;
            overflow:hidden;
          }
          #playlistModal .playlist-edit-modal>h3{margin-bottom:18px}
          #playlistModal #newPlaylistName{flex:0 0 auto;margin-bottom:12px}
          .playlist-track-search{
            position:relative;display:flex;align-items:center;gap:9px;flex:0 0 auto;
            margin-bottom:12px;border:1px solid rgba(255,255,255,.09);border-radius:9px;
            background:rgba(2,5,12,.52);transition:border-color .16s ease,box-shadow .16s ease
          }
          .playlist-track-search:focus-within{
            border-color:rgba(0,229,255,.42);box-shadow:0 0 0 3px rgba(0,229,255,.07)
          }
          .playlist-track-search>i{position:absolute;left:13px;color:var(--text-sub);font-size:.8rem;pointer-events:none}
          #playlistModal .playlist-track-search input[type="search"]{
            min-width:0;flex:1;margin:0;padding:11px 8px 11px 38px;border:0;outline:0;
            background:transparent;color:var(--text-main);font:inherit;font-size:.86rem
          }
          #playlistModal .playlist-track-search input[type="search"]::-webkit-search-cancel-button{cursor:pointer}
          .playlist-track-search-meta{
            flex:0 0 auto;padding-right:12px;color:var(--text-sub);font-size:.68rem;white-space:nowrap
          }
          #playlistModal .track-selection-area{
            min-height:280px;max-height:none;flex:1 1 430px;margin-bottom:12px;padding:8px 9px;
            overscroll-behavior:contain
          }
          #playlistModal .track-checkbox-item{
            min-height:48px;padding:8px 10px;box-sizing:border-box
          }
          #playlistModal .track-checkbox-item.playlist-track-filtered-out{display:none}
          .playlist-track-copy{min-width:0;flex:1;display:grid;gap:3px}
          .playlist-track-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-main);font-size:.82rem;font-weight:650}
          .playlist-track-artist{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-sub);font-size:.69rem}
          #playlistModal .track-genre{flex:0 0 auto;margin-left:auto}
          .playlist-track-search-empty{
            flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:8px;
            min-height:44px;margin:-4px 0 8px;color:var(--text-sub);font-size:.76rem
          }
          .playlist-track-search-empty.hidden{display:none}
          #playlistModal .modal-actions{
            padding-top:12px;margin-top:0;border-top:1px solid rgba(255,255,255,.06)
          }
          @media(max-width:640px){
            #playlistModal{padding:10px;align-items:flex-end}
            #playlistModal .playlist-edit-modal{
              width:100%;max-height:90vh;padding:18px 15px max(15px,env(safe-area-inset-bottom));
              border-radius:15px 15px 8px 8px
            }
            #playlistModal .track-selection-area{min-height:220px;flex-basis:48vh}
            .playlist-track-search-meta{display:none}
            #playlistModal .track-genre{display:none}
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
