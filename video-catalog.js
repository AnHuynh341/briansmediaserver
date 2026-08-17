// ==========================================================
// W41IT VIDEO CATALOG — Appwrite-backed live metadata
// ==========================================================
// video.js still contains the last Git-backed catalog as a safety fallback.
// Once these collections are available, this file replaces the in-memory
// VIDEO_SERIES / YOUTUBE_CHANNELS arrays without a GitHub Pages deployment.

const VIDEO_GROUPS_COLLECTION_ID = 'video_groups';
const VIDEO_ITEMS_COLLECTION_ID = 'video_items';
const VIDEO_CATALOG_PAGE_SIZE = 100;

let videoCatalogLoadedFromAppwrite = false;
let videoCatalogGroupDocuments = [];
let videoCatalogItemDocuments = [];

async function listAllVideoCatalogDocuments(collectionId) {
    const documents = [];
    let offset = 0;

    while (true) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            collectionId,
            [Query.limit(VIDEO_CATALOG_PAGE_SIZE), Query.offset(offset)]
        );

        const batch = Array.isArray(response?.documents) ? response.documents : [];
        documents.push(...batch);
        if (batch.length < VIDEO_CATALOG_PAGE_SIZE) break;
        offset += batch.length;
    }

    return documents;
}

function parseVideoCatalogSubtitles(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Ignoring invalid subtitlesJson in Appwrite catalog:', error);
        return [];
    }
}

function sortVideoCatalogDocuments(documents) {
    return documents.slice().sort((left, right) => {
        const leftOrder = Number(left?.sortOrder ?? 0);
        const rightOrder = Number(right?.sortOrder ?? 0);
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;

        const leftNumber = Number(left?.number ?? 0);
        const rightNumber = Number(right?.number ?? 0);
        if (leftNumber !== rightNumber) return leftNumber - rightNumber;

        return String(left?.title || '').localeCompare(String(right?.title || ''));
    });
}

function buildVideoCatalogFromAppwrite(groups, items) {
    const visibleGroups = sortVideoCatalogDocuments(
        groups.filter(group => group?.published !== false)
    );
    const visibleItems = items.filter(item => item?.published !== false);

    const itemsByGroup = new Map();
    visibleItems.forEach(item => {
        const key = `${item.kind}:${item.groupSlug}`;
        if (!itemsByGroup.has(key)) itemsByGroup.set(key, []);
        itemsByGroup.get(key).push(item);
    });

    const anime = [];
    const youtube = [];

    visibleGroups.forEach(group => {
        const key = `${group.kind}:${group.slug}`;
        const groupItems = sortVideoCatalogDocuments(itemsByGroup.get(key) || []);
        const displayTitle = group.title || group.sourceTitle || group.slug;

        if (group.kind === 'anime') {
            anime.push({
                id: group.slug,
                title: displayTitle,
                sourceTitle: group.sourceTitle || displayTitle,
                year: Number(group.year || 0),
                genre: group.genre || 'Anime',
                posterPath: group.posterPath || '',
                backdropPath: group.backdropPath || group.posterPath || '',
                description: group.description || 'Video, artwork and subtitles are served through the W41IT Cloudflare Worker.',
                updatedAt: group.updatedAt || group.$updatedAt || '',
                episodes: groupItems.map((item, index) => ({
                    id: item.itemId || `${group.slug}-e${item.number || index + 1}`,
                    number: Number(item.number || index + 1),
                    title: item.title || `Episode ${item.number || index + 1}`,
                    duration: item.duration || '',
                    quality: item.quality || '',
                    thumbnailPath: item.thumbnailPath || '',
                    videoPath: item.videoPath || '',
                    subtitles: parseVideoCatalogSubtitles(item.subtitlesJson)
                }))
            });
            return;
        }

        if (group.kind === 'youtube') {
            youtube.push({
                id: group.slug,
                name: displayTitle,
                sourceName: group.sourceTitle || displayTitle,
                description: group.description || 'Locally archived YouTube videos served through the W41IT Cloudflare Worker.',
                updatedAt: group.updatedAt || group.$updatedAt || '',
                videos: groupItems.map((item, index) => ({
                    id: item.itemId || `${group.slug}-video-${index + 1}`,
                    title: item.title || `Video ${index + 1}`,
                    duration: item.duration || '',
                    quality: item.quality || '',
                    thumbnailPath: item.thumbnailPath || '',
                    videoPath: item.videoPath || '',
                    subtitles: parseVideoCatalogSubtitles(item.subtitlesJson)
                }))
            });
        }
    });

    return { anime, youtube };
}

function applyAppwriteVideoCatalog(groups, items) {
    const { anime, youtube } = buildVideoCatalogFromAppwrite(groups, items);

    VIDEO_SERIES.splice(0, VIDEO_SERIES.length, ...anime);
    YOUTUBE_CHANNELS.splice(0, YOUTUBE_CHANNELS.length, ...youtube);

    videoCatalogGroupDocuments = groups;
    videoCatalogItemDocuments = items;
    videoCatalogLoadedFromAppwrite = true;

    const currentSeries = typeof getVideoSeries === 'function'
        ? getVideoSeries(videoState?.activeSeriesId)
        : null;
    if (!currentSeries && VIDEO_SERIES.length > 0 && typeof videoState !== 'undefined') {
        videoState.activeSeriesId = VIDEO_SERIES[0].id;
        videoState.activeEpisode = makeVideoEpisodes(VIDEO_SERIES[0])[0]?.number || 1;
    }

    if (typeof renderVideoHome === 'function') renderVideoHome();
    renderVideoCatalogAdmin();
}

async function loadVideoCatalogFromAppwrite({ quiet = false } = {}) {
    try {
        const [groups, items] = await Promise.all([
            listAllVideoCatalogDocuments(VIDEO_GROUPS_COLLECTION_ID),
            listAllVideoCatalogDocuments(VIDEO_ITEMS_COLLECTION_ID)
        ]);

        if (groups.length === 0) {
            throw new Error('Appwrite video catalog is empty. Run video-add --init-appwrite on the VPS first.');
        }

        applyAppwriteVideoCatalog(groups, items);
        if (!quiet) setVideoCatalogAdminStatus(`Live Appwrite catalog loaded: ${groups.length} groups, ${items.length} items.`, false);
        return true;
    } catch (error) {
        videoCatalogLoadedFromAppwrite = false;
        console.warn('Appwrite video catalog unavailable; using embedded video.js fallback.', error);
        if (!quiet) setVideoCatalogAdminStatus(`Appwrite catalog unavailable — using video.js fallback. ${error.message || error}`, true);
        return false;
    }
}

function videoCatalogAdminContainer() {
    return document.getElementById('videoCatalogAdmin');
}

function setVideoCatalogAdminStatus(message, isError = false) {
    const status = document.getElementById('videoCatalogAdminStatus');
    if (!status) return;
    status.textContent = message || '';
    status.style.color = isError ? '#f87171' : '#86efac';
}

function installVideoCatalogAdminUi() {
    const modalContent = document.querySelector('#adminModal .modal-content');
    if (!modalContent || videoCatalogAdminContainer()) return;

    const actions = modalContent.querySelector('.modal-actions');
    const section = document.createElement('section');
    section.id = 'videoCatalogAdmin';
    section.className = 'video-catalog-admin';
    section.innerHTML = `
        <div class="video-catalog-admin-heading">
            <div>
                <strong><i class="fas fa-film"></i> Video Catalog</strong>
                <span>Live metadata from Appwrite. Edits do not require a Git push.</span>
            </div>
            <button id="videoCatalogRefreshBtn" type="button">Refresh</button>
        </div>
        <div id="videoCatalogAdminStatus" class="video-catalog-admin-status" aria-live="polite"></div>
        <div id="videoCatalogAdminList" class="video-catalog-admin-list"></div>
        <p class="video-catalog-admin-note">
            Remove listing deletes only Appwrite metadata. The R2/VPS media is deliberately kept as a recovery copy.
        </p>`;

    if (actions) modalContent.insertBefore(section, actions);
    else modalContent.appendChild(section);

    const style = document.createElement('style');
    style.textContent = `
        .video-catalog-admin{margin:18px 0;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(0,0,0,.18)}
        .video-catalog-admin-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
        .video-catalog-admin-heading>div{display:grid;gap:3px}.video-catalog-admin-heading strong{color:#f3f4f6}.video-catalog-admin-heading span,.video-catalog-admin-note{font-size:.72rem;color:var(--text-sub)}
        .video-catalog-admin-heading button,.video-catalog-admin-row button{border:1px solid rgba(255,255,255,.12);border-radius:6px;background:rgba(255,255,255,.05);color:#e5e7eb;padding:6px 9px;cursor:pointer}
        .video-catalog-admin-heading button:hover,.video-catalog-admin-row button:hover{background:rgba(255,255,255,.1)}
        .video-catalog-admin-status{min-height:18px;margin:6px 0 10px;font-size:.72rem;font-family:monospace}
        .video-catalog-admin-list{display:grid;gap:8px;max-height:330px;overflow:auto;padding-right:3px}
        .video-catalog-admin-group{border:1px solid rgba(255,255,255,.07);border-radius:8px;overflow:hidden}
        .video-catalog-admin-group-title{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;background:rgba(255,255,255,.035)}
        .video-catalog-admin-group-title span{display:grid;gap:2px;min-width:0}.video-catalog-admin-group-title small{color:var(--text-sub)}
        .video-catalog-admin-items{display:grid}.video-catalog-admin-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:7px 10px;border-top:1px solid rgba(255,255,255,.055)}
        .video-catalog-admin-row-copy{min-width:0;display:grid;gap:2px}.video-catalog-admin-row-copy strong,.video-catalog-admin-row-copy span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.video-catalog-admin-row-copy span{font-size:.66rem;color:var(--text-sub)}
        .video-catalog-admin-row-actions{display:flex;gap:5px}.video-catalog-admin-row .danger{color:#fca5a5;border-color:rgba(248,113,113,.25)}
        .video-catalog-admin-note{margin:10px 0 0;line-height:1.45}
    `;
    document.head.appendChild(style);

    document.getElementById('videoCatalogRefreshBtn')?.addEventListener('click', async () => {
        setVideoCatalogAdminStatus('Refreshing catalog…', false);
        await loadVideoCatalogFromAppwrite();
    });
}

async function editVideoCatalogGroup(documentId) {
    if (currentUserRole !== 'admin') return;
    const group = videoCatalogGroupDocuments.find(document => document.$id === documentId);
    if (!group) return;

    const title = window.prompt('Display name', group.title || group.sourceTitle || '');
    if (title === null) return;
    const description = window.prompt('Description', group.description || '');
    if (description === null) return;

    try {
        setVideoCatalogAdminStatus('Saving group metadata…', false);
        await databases.updateDocument(
            DATABASE_ID,
            VIDEO_GROUPS_COLLECTION_ID,
            group.$id,
            { title: title.trim() || group.sourceTitle, description }
        );
        await loadVideoCatalogFromAppwrite();
    } catch (error) {
        console.error('Video catalog group update failed:', error);
        setVideoCatalogAdminStatus(`Edit denied by Appwrite permissions: ${error.message || error}`, true);
    }
}

async function editVideoCatalogItem(documentId) {
    if (currentUserRole !== 'admin') return;
    const item = videoCatalogItemDocuments.find(document => document.$id === documentId);
    if (!item) return;

    const title = window.prompt('Video / episode title', item.title || '');
    if (title === null) return;

    try {
        setVideoCatalogAdminStatus('Saving item metadata…', false);
        await databases.updateDocument(
            DATABASE_ID,
            VIDEO_ITEMS_COLLECTION_ID,
            item.$id,
            { title: title.trim() || item.title }
        );
        await loadVideoCatalogFromAppwrite();
    } catch (error) {
        console.error('Video catalog item update failed:', error);
        setVideoCatalogAdminStatus(`Edit denied by Appwrite permissions: ${error.message || error}`, true);
    }
}

async function removeVideoCatalogItem(documentId) {
    if (currentUserRole !== 'admin') return;
    const item = videoCatalogItemDocuments.find(document => document.$id === documentId);
    if (!item) return;
    if (!window.confirm(`Remove “${item.title}” from the W41IT catalog?\n\nThe R2 and VPS media files will be kept.`)) return;

    try {
        setVideoCatalogAdminStatus('Removing catalog item…', false);
        await databases.deleteDocument(DATABASE_ID, VIDEO_ITEMS_COLLECTION_ID, item.$id);
        await loadVideoCatalogFromAppwrite();
    } catch (error) {
        console.error('Video catalog item removal failed:', error);
        setVideoCatalogAdminStatus(`Delete denied by Appwrite permissions: ${error.message || error}`, true);
    }
}

function renderVideoCatalogAdmin() {
    installVideoCatalogAdminUi();
    const list = document.getElementById('videoCatalogAdminList');
    if (!list) return;

    if (currentUserRole !== 'admin') {
        list.replaceChildren();
        return;
    }

    list.replaceChildren();
    if (!videoCatalogLoadedFromAppwrite) {
        const empty = document.createElement('div');
        empty.className = 'video-catalog-admin-row-copy';
        empty.textContent = 'Appwrite catalog is not active yet.';
        list.appendChild(empty);
        return;
    }

    sortVideoCatalogDocuments(videoCatalogGroupDocuments).forEach(group => {
        const wrapper = document.createElement('div');
        wrapper.className = 'video-catalog-admin-group';

        const heading = document.createElement('div');
        heading.className = 'video-catalog-admin-group-title';
        const headingCopy = document.createElement('span');
        const headingTitle = document.createElement('strong');
        headingTitle.textContent = group.title || group.sourceTitle || group.slug;
        const headingMeta = document.createElement('small');
        headingMeta.textContent = `${group.kind === 'youtube' ? 'YouTube' : 'Anime'} · ${group.slug}`;
        headingCopy.append(headingTitle, headingMeta);
        const editGroup = document.createElement('button');
        editGroup.type = 'button';
        editGroup.textContent = 'Edit';
        editGroup.onclick = () => editVideoCatalogGroup(group.$id);
        heading.append(headingCopy, editGroup);

        const items = document.createElement('div');
        items.className = 'video-catalog-admin-items';
        const matchingItems = sortVideoCatalogDocuments(
            videoCatalogItemDocuments.filter(item => item.kind === group.kind && item.groupSlug === group.slug)
        );
        matchingItems.forEach(item => {
            const row = document.createElement('div');
            row.className = 'video-catalog-admin-row';
            const copy = document.createElement('div');
            copy.className = 'video-catalog-admin-row-copy';
            const title = document.createElement('strong');
            title.textContent = item.title || item.itemId;
            const meta = document.createElement('span');
            meta.textContent = group.kind === 'anime'
                ? `Episode ${item.number || '?'} · ${item.quality || 'unknown quality'}`
                : `${item.duration || 'unknown duration'} · ${item.quality || 'unknown quality'}`;
            copy.append(title, meta);

            const buttons = document.createElement('div');
            buttons.className = 'video-catalog-admin-row-actions';
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.textContent = 'Edit';
            edit.onclick = () => editVideoCatalogItem(item.$id);
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'danger';
            remove.textContent = 'Remove';
            remove.onclick = () => removeVideoCatalogItem(item.$id);
            buttons.append(edit, remove);
            row.append(copy, buttons);
            items.appendChild(row);
        });

        wrapper.append(heading, items);
        list.appendChild(wrapper);
    });
}

function hookVideoCatalogAdminModal() {
    if (typeof openAdminModal !== 'function' || openAdminModal.__videoCatalogHooked) return;
    const originalOpenAdminModal = openAdminModal;
    const hooked = function (...args) {
        const result = originalOpenAdminModal.apply(this, args);
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
