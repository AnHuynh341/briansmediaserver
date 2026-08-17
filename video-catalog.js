// ==========================================================
// W41IT VIDEO CATALOG — live Appwrite TablesDB metadata
// ==========================================================
// video.js keeps the last embedded catalog as a safety fallback. Once the
// Appwrite row exists, this file replaces those in-memory arrays live.

const VIDEO_CATALOG_TABLE_ID = 'video_catalog';
const VIDEO_CATALOG_ROW_ID = 'current';

let videoCatalogLoadedFromAppwrite = false;
let liveVideoCatalog = null;

function normalizeLiveVideoCatalog(raw) {
    const catalog = raw && typeof raw === 'object' ? raw : {};
    const anime = Array.isArray(catalog.VIDEO_SERIES) ? catalog.VIDEO_SERIES : [];
    const youtube = Array.isArray(catalog.YOUTUBE_CHANNELS) ? catalog.YOUTUBE_CHANNELS : [];

    return {
        VIDEO_SERIES: anime.map(series => ({
            ...series,
            sourceTitle: series.sourceTitle || series.title || series.id || '',
            title: series.displayTitle || series.title || series.sourceTitle || series.id || '',
            episodes: Array.isArray(series.episodes) ? series.episodes : []
        })),
        YOUTUBE_CHANNELS: youtube.map(channel => ({
            ...channel,
            sourceName: channel.sourceName || channel.name || channel.id || '',
            name: channel.displayName || channel.name || channel.sourceName || channel.id || '',
            videos: Array.isArray(channel.videos) ? channel.videos : []
        }))
    };
}

function applyLiveVideoCatalog(raw) {
    const normalized = normalizeLiveVideoCatalog(raw);
    VIDEO_SERIES.splice(0, VIDEO_SERIES.length, ...normalized.VIDEO_SERIES);
    YOUTUBE_CHANNELS.splice(0, YOUTUBE_CHANNELS.length, ...normalized.YOUTUBE_CHANNELS);
    liveVideoCatalog = raw;
    videoCatalogLoadedFromAppwrite = true;

    const active = typeof getVideoSeries === 'function'
        ? getVideoSeries(videoState?.activeSeriesId)
        : null;
    if (!active && VIDEO_SERIES.length > 0 && typeof videoState !== 'undefined') {
        videoState.activeSeriesId = VIDEO_SERIES[0].id;
        videoState.activeEpisode = makeVideoEpisodes(VIDEO_SERIES[0])[0]?.number || 1;
    }

    if (typeof renderVideoHome === 'function') renderVideoHome();
    renderVideoCatalogAdmin();
}

async function loadVideoCatalogFromAppwrite({ quiet = false } = {}) {
    try {
        if (!videoTablesDB) throw new Error('Appwrite TablesDB client is not ready.');

        const row = await videoTablesDB.getRow({
            databaseId: DATABASE_ID,
            tableId: VIDEO_CATALOG_TABLE_ID,
            rowId: VIDEO_CATALOG_ROW_ID
        });

        const parsed = JSON.parse(row.payload || '{}');
        if (!Array.isArray(parsed.VIDEO_SERIES) || !Array.isArray(parsed.YOUTUBE_CHANNELS)) {
            throw new Error('Catalog payload is missing VIDEO_SERIES/YOUTUBE_CHANNELS arrays.');
        }

        applyLiveVideoCatalog(parsed);
        if (!quiet) {
            setVideoCatalogAdminStatus(
                `Live TablesDB catalog loaded: ${parsed.VIDEO_SERIES.length} anime groups, ${parsed.YOUTUBE_CHANNELS.length} YouTube channels.`,
                false
            );
        }
        return true;
    } catch (error) {
        videoCatalogLoadedFromAppwrite = false;
        console.warn('Appwrite TablesDB catalog unavailable; using embedded video.js fallback.', error);
        if (!quiet) {
            setVideoCatalogAdminStatus(
                `TablesDB catalog unavailable — using video.js fallback. ${error.message || error}`,
                true
            );
        }
        return false;
    }
}

function setVideoCatalogAdminStatus(message, isError = false) {
    const status = document.getElementById('videoCatalogAdminStatus');
    if (!status) return;
    status.textContent = message || '';
    status.style.color = isError ? '#f87171' : '#86efac';
}

function installVideoCatalogAdminUi() {
    const modalContent = document.querySelector('#adminModal .modal-content');
    if (!modalContent || document.getElementById('videoCatalogAdmin')) return;

    const actions = modalContent.querySelector('.modal-actions');
    const section = document.createElement('section');
    section.id = 'videoCatalogAdmin';
    section.className = 'video-catalog-admin';
    section.innerHTML = `
        <div class="video-catalog-admin-heading">
            <div>
                <strong><i class="fas fa-film"></i> Video Catalog</strong>
                <span>Live metadata from Appwrite TablesDB. No Git push is needed.</span>
            </div>
            <div class="video-catalog-admin-heading-actions">
                <button id="videoCatalogUnlockBtn" type="button">Unlock editing</button>
                <button id="videoCatalogRefreshBtn" type="button">Refresh</button>
            </div>
        </div>
        <div id="videoCatalogUnlockRow" class="video-catalog-unlock-row hidden">
            <input id="videoCatalogAdminEmail" type="email" autocomplete="username" placeholder="Appwrite admin email">
            <input id="videoCatalogAdminPassword" type="password" autocomplete="current-password" placeholder="Appwrite password">
            <button id="videoCatalogUnlockSubmit" type="button">Sign in</button>
        </div>
        <div id="videoCatalogAdminStatus" class="video-catalog-admin-status" aria-live="polite"></div>
        <div id="videoCatalogAdminList" class="video-catalog-admin-list"></div>
        <p class="video-catalog-admin-note">
            Remove listing only removes the catalog entry; R2 and VPS media are kept as a recovery copy.
        </p>`;
    if (actions) modalContent.insertBefore(section, actions);
    else modalContent.appendChild(section);

    const style = document.createElement('style');
    style.textContent = `
      .video-catalog-admin{margin:18px 0;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(0,0,0,.18)}
      .video-catalog-admin-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.video-catalog-admin-heading-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
      .video-catalog-admin-heading>div:first-child{display:grid;gap:3px}.video-catalog-admin-heading strong{color:#f3f4f6}.video-catalog-admin-heading span,.video-catalog-admin-note{font-size:.72rem;color:var(--text-sub)}
      .video-catalog-admin-heading button,.video-catalog-admin-row button,.video-catalog-admin-group-title button,.video-catalog-unlock-row button{border:1px solid rgba(255,255,255,.12);border-radius:6px;background:rgba(255,255,255,.05);color:#e5e7eb;padding:6px 9px;cursor:pointer}
      .video-catalog-unlock-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:7px;margin:8px 0 10px}.video-catalog-unlock-row.hidden{display:none}.video-catalog-unlock-row input{min-width:0;border:1px solid rgba(255,255,255,.12);border-radius:6px;background:rgba(0,0,0,.28);color:#f3f4f6;padding:7px 9px;font:inherit}
      .video-catalog-admin-status{min-height:18px;margin:6px 0 10px;font-size:.72rem;font-family:monospace}.video-catalog-admin-list{display:grid;gap:8px;max-height:340px;overflow:auto;padding-right:3px}
      .video-catalog-admin-group{border:1px solid rgba(255,255,255,.07);border-radius:8px;overflow:hidden}.video-catalog-admin-group-title{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;background:rgba(255,255,255,.035)}
      .video-catalog-admin-group-title span{display:grid;gap:2px;min-width:0}.video-catalog-admin-group-title small{color:var(--text-sub)}.video-catalog-admin-items{display:grid}
      .video-catalog-admin-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:7px 10px;border-top:1px solid rgba(255,255,255,.055)}
      .video-catalog-admin-row-copy{min-width:0;display:grid;gap:2px}.video-catalog-admin-row-copy strong,.video-catalog-admin-row-copy span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.video-catalog-admin-row-copy span{font-size:.66rem;color:var(--text-sub)}
      .video-catalog-admin-row-actions{display:flex;gap:5px}.video-catalog-admin-row .danger{color:#fca5a5;border-color:rgba(248,113,113,.25)}.video-catalog-admin-note{margin:10px 0 0;line-height:1.45}
      @media(max-width:640px){.video-catalog-unlock-row{grid-template-columns:1fr}.video-catalog-admin-heading{align-items:flex-start;flex-direction:column}.video-catalog-admin-heading-actions{justify-content:flex-start}}`;
    document.head.appendChild(style);

    document.getElementById('videoCatalogRefreshBtn')?.addEventListener('click', () => {
        setVideoCatalogAdminStatus('Refreshing catalog…', false);
        void loadVideoCatalogFromAppwrite();
    });
    document.getElementById('videoCatalogUnlockBtn')?.addEventListener('click', () => {
        document.getElementById('videoCatalogUnlockRow')?.classList.toggle('hidden');
    });
    document.getElementById('videoCatalogUnlockSubmit')?.addEventListener('click', () => {
        void unlockVideoCatalogEditing();
    });
}

async function unlockVideoCatalogEditing() {
    if (currentUserRole !== 'admin') return;
    if (!videoTablesAccount) {
        setVideoCatalogAdminStatus('Appwrite TablesDB account client is not ready.', true);
        return;
    }

    const emailInput = document.getElementById('videoCatalogAdminEmail');
    const passwordInput = document.getElementById('videoCatalogAdminPassword');
    const email = emailInput?.value.trim() || '';
    const password = passwordInput?.value || '';
    if (!email || !password) {
        setVideoCatalogAdminStatus('Enter the Appwrite admin email and password first.', true);
        return;
    }

    try {
        setVideoCatalogAdminStatus('Signing in to Appwrite admin writer…', false);
        try { await videoTablesAccount.deleteSession({ sessionId: 'current' }); } catch (_error) { /* guest/no session */ }
        await videoTablesAccount.createEmailPasswordSession({ email, password });
        const authUser = await videoTablesAccount.get();
        if (passwordInput) passwordInput.value = '';
        document.getElementById('videoCatalogUnlockRow')?.classList.add('hidden');
        setVideoCatalogAdminStatus(`Catalog editing unlocked as ${authUser.email || authUser.$id}.`, false);
    } catch (error) {
        console.error('Video catalog admin login failed:', error);
        setVideoCatalogAdminStatus(`Admin unlock failed: ${error.message || error}`, true);
    }
}

async function saveLiveVideoCatalog(message = 'Saving catalog…') {
    if (!liveVideoCatalog) throw new Error('Live Appwrite catalog is not loaded.');
    if (!videoTablesDB) throw new Error('Appwrite TablesDB client is not ready.');

    setVideoCatalogAdminStatus(message, false);
    await videoTablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: VIDEO_CATALOG_TABLE_ID,
        rowId: VIDEO_CATALOG_ROW_ID,
        data: { payload: JSON.stringify(liveVideoCatalog) }
    });
    await loadVideoCatalogFromAppwrite();
}

async function editVideoCatalogGroup(kind, groupId) {
    if (currentUserRole !== 'admin' || !liveVideoCatalog) return;
    const list = kind === 'youtube' ? liveVideoCatalog.YOUTUBE_CHANNELS : liveVideoCatalog.VIDEO_SERIES;
    const group = list.find(item => item.id === groupId);
    if (!group) return;

    const currentName = kind === 'youtube'
        ? (group.displayName || group.name || group.sourceName || '')
        : (group.displayTitle || group.title || group.sourceTitle || '');
    const name = window.prompt('Display name', currentName);
    if (name === null) return;
    const description = window.prompt('Description', group.description || '');
    if (description === null) return;

    if (kind === 'youtube') group.displayName = name.trim() || currentName;
    else group.displayTitle = name.trim() || currentName;
    group.description = description;

    try {
        await saveLiveVideoCatalog('Saving group metadata…');
    } catch (error) {
        console.error('Video catalog group update failed:', error);
        setVideoCatalogAdminStatus(`Edit denied. Click “Unlock editing” and sign in with the Appwrite admin account. ${error.message || error}`, true);
    }
}

async function editVideoCatalogItem(kind, groupId, itemId) {
    if (currentUserRole !== 'admin' || !liveVideoCatalog) return;
    const groups = kind === 'youtube' ? liveVideoCatalog.YOUTUBE_CHANNELS : liveVideoCatalog.VIDEO_SERIES;
    const group = groups.find(item => item.id === groupId);
    const items = kind === 'youtube' ? group?.videos : group?.episodes;
    const item = items?.find(entry => String(entry.id || entry.number) === String(itemId));
    if (!item) return;

    const title = window.prompt('Video / episode title', item.title || '');
    if (title === null) return;
    item.title = title.trim() || item.title;

    try {
        await saveLiveVideoCatalog('Saving item metadata…');
    } catch (error) {
        console.error('Video catalog item update failed:', error);
        setVideoCatalogAdminStatus(`Edit denied. Click “Unlock editing” and sign in with the Appwrite admin account. ${error.message || error}`, true);
    }
}

async function removeVideoCatalogItem(kind, groupId, itemId) {
    if (currentUserRole !== 'admin' || !liveVideoCatalog) return;
    const groups = kind === 'youtube' ? liveVideoCatalog.YOUTUBE_CHANNELS : liveVideoCatalog.VIDEO_SERIES;
    const group = groups.find(item => item.id === groupId);
    const key = kind === 'youtube' ? 'videos' : 'episodes';
    const items = group?.[key];
    if (!Array.isArray(items)) return;
    const index = items.findIndex(entry => String(entry.id || entry.number) === String(itemId));
    if (index < 0) return;
    const item = items[index];
    if (!window.confirm(`Remove “${item.title || itemId}” from W41IT?\n\nR2/VPS media will be kept.`)) return;

    const removed = items.splice(index, 1)[0];
    try {
        await saveLiveVideoCatalog('Removing catalog item…');
    } catch (error) {
        items.splice(index, 0, removed);
        console.error('Video catalog item removal failed:', error);
        setVideoCatalogAdminStatus(`Delete denied. Click “Unlock editing” and sign in with the Appwrite admin account. ${error.message || error}`, true);
    }
}

function renderVideoCatalogAdmin() {
    installVideoCatalogAdminUi();
    const list = document.getElementById('videoCatalogAdminList');
    if (!list) return;
    list.replaceChildren();
    if (currentUserRole !== 'admin') return;
    if (!videoCatalogLoadedFromAppwrite || !liveVideoCatalog) {
        const empty = document.createElement('div');
        empty.className = 'video-catalog-admin-row-copy';
        empty.textContent = 'Appwrite TablesDB catalog is not active yet.';
        list.appendChild(empty);
        return;
    }

    const groups = [
        ...liveVideoCatalog.VIDEO_SERIES.map(group => ({ kind: 'anime', group })),
        ...liveVideoCatalog.YOUTUBE_CHANNELS.map(group => ({ kind: 'youtube', group }))
    ];

    groups.forEach(({ kind, group }) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'video-catalog-admin-group';
        const heading = document.createElement('div');
        heading.className = 'video-catalog-admin-group-title';
        const copy = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = kind === 'youtube'
            ? (group.displayName || group.name || group.id)
            : (group.displayTitle || group.title || group.id);
        const small = document.createElement('small');
        small.textContent = `${kind === 'youtube' ? 'YouTube' : 'Anime'} · ${group.id}`;
        copy.append(strong, small);
        const editGroup = document.createElement('button');
        editGroup.type = 'button';
        editGroup.textContent = 'Edit';
        editGroup.onclick = () => editVideoCatalogGroup(kind, group.id);
        heading.append(copy, editGroup);

        const itemsWrap = document.createElement('div');
        itemsWrap.className = 'video-catalog-admin-items';
        const items = kind === 'youtube' ? (group.videos || []) : (group.episodes || []);
        items.forEach((item, index) => {
            const itemId = String(item.id || item.number || index + 1);
            const row = document.createElement('div');
            row.className = 'video-catalog-admin-row';
            const itemCopy = document.createElement('div');
            itemCopy.className = 'video-catalog-admin-row-copy';
            const title = document.createElement('strong');
            title.textContent = item.title || itemId;
            const meta = document.createElement('span');
            meta.textContent = kind === 'anime'
                ? `Episode ${item.number || index + 1} · ${item.quality || 'unknown quality'}`
                : `${item.duration || 'unknown duration'} · ${item.quality || 'unknown quality'}`;
            itemCopy.append(title, meta);

            const buttons = document.createElement('div');
            buttons.className = 'video-catalog-admin-row-actions';
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.textContent = 'Edit';
            edit.onclick = () => editVideoCatalogItem(kind, group.id, itemId);
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Remove';
            remove.className = 'danger';
            remove.onclick = () => removeVideoCatalogItem(kind, group.id, itemId);
            buttons.append(edit, remove);
            row.append(itemCopy, buttons);
            itemsWrap.appendChild(row);
        });

        wrapper.append(heading, itemsWrap);
        list.appendChild(wrapper);
    });
}

function hookVideoCatalogAdminModal() {
    if (typeof openAdminModal !== 'function' || openAdminModal.__videoCatalogHooked) return;
    const original = openAdminModal;
    const hooked = function (...args) {
        const result = original.apply(this, args);
        installVideoCatalogAdminUi();
        renderVideoCatalogAdmin();
        if (!videoCatalogLoadedFromAppwrite) void loadVideoCatalogFromAppwrite();
        return result;
    };
    hooked.__videoCatalogHooked = true;
    window.openAdminModal = hooked;
}

installVideoCatalogAdminUi();
hookVideoCatalogAdminModal();
void loadVideoCatalogFromAppwrite({ quiet: true });
