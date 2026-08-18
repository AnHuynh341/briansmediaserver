// ==========================================================
// W41IT verified-admin inline controls
// ==========================================================
// Full administration is available only when the main login page established
// the verified Appwrite Auth session for APPWRITE_ADMIN_USER_ID.

function isFullAdminSession() {
    return currentUserRole === 'admin'
        && currentAuthMode === 'verified-admin'
        && currentUserAuthId === APPWRITE_ADMIN_USER_ID
        && currentUserVerified === true;
}

function requireFullAdmin() {
    if (isFullAdminSession()) return true;
    alert('Verified administrator access is required.');
    return false;
}

function installInlineAdminStyles() {
    if (document.getElementById('w41it-inline-admin-style')) return;

    const style = document.createElement('style');
    style.id = 'w41it-inline-admin-style';
    style.textContent = `
      #videoCatalogAdmin{display:none!important}
      .w41it-inline-admin-actions{display:flex;align-items:center;gap:5px;z-index:8}
      .w41it-inline-admin-icon{
        width:28px;height:28px;border:1px solid rgba(255,255,255,.18);
        border-radius:7px;background:rgba(7,10,18,.86);color:#e5e7eb;
        display:inline-flex;align-items:center;justify-content:center;
        cursor:pointer;transition:background .16s ease,border-color .16s ease,transform .16s ease;
        box-sizing:border-box
      }
      .w41it-inline-admin-icon:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.38);transform:translateY(-1px)}
      .w41it-inline-admin-icon.danger{color:#fca5a5;border-color:rgba(248,113,113,.3)}
      .w41it-inline-admin-icon.danger:hover{background:rgba(127,29,29,.35);border-color:rgba(248,113,113,.6)}
      .track-action .w41it-inline-admin-icon{background:transparent}
      .video-series-card,.video-youtube-card,.video-episode-row{position:relative}
      .video-series-card>.w41it-inline-admin-actions,
      .video-youtube-card>.w41it-inline-admin-actions{
        position:absolute;top:8px;right:8px;padding:3px;border-radius:9px;
        background:rgba(3,6,12,.74);backdrop-filter:blur(8px)
      }
      .video-series-card>.w41it-inline-admin-actions{top:10px}
      .video-episode-state>.w41it-inline-admin-actions{justify-content:flex-end}
      .video-youtube-channel-actions .w41it-inline-admin-actions,
      .video-youtube-channel-page-header .w41it-inline-admin-actions{margin-left:6px}
      .video-youtube-channel-page-header>.w41it-inline-admin-actions{align-self:flex-start}
      @media(max-width:640px){
        .w41it-inline-admin-icon{width:30px;height:30px}
        .video-series-card>.w41it-inline-admin-actions,
        .video-youtube-card>.w41it-inline-admin-actions{top:6px;right:6px}
      }`;
    document.head.appendChild(style);
}

function makeInlineAdminIcon(iconClass, title, onActivate, { danger = false, button = false } = {}) {
    const element = document.createElement(button ? 'button' : 'span');

    if (button) element.type = 'button';
    else {
        element.setAttribute('role', 'button');
        element.tabIndex = 0;
    }

    element.className = `w41it-inline-admin-icon${danger ? ' danger' : ''}`;
    element.title = title;
    element.setAttribute('aria-label', title);
    element.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;

    const activate = event => {
        event.preventDefault();
        event.stopPropagation();
        void onActivate();
    };

    element.addEventListener('click', activate);

    if (!button) {
        element.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') activate(event);
        });
    }

    return element;
}

async function editTrackInline(trackId) {
    if (!requireFullAdmin()) return;

    const track = allTracks.find(item => item.id === trackId);
    if (!track) return alert('Track not found.');

    const name = prompt('Track name', getDisplayTrackName(track.name));
    if (name === null) return;

    const artist = prompt('Artist', track.artist || 'Unknown Artist');
    if (artist === null) return;

    const genre = prompt('Genre', track.genre || 'Other');
    if (genre === null) return;

    try {
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            track.id,
            {
                name: name.trim() || getDisplayTrackName(track.name),
                artist: artist.trim() || 'Unknown Artist',
                genre: genre.trim() || 'Other'
            }
        );

        await fetchTracks();
    } catch (error) {
        console.error('Track metadata update failed:', error);
        alert('Could not update track metadata: ' + error.message);
    }
}

function decorateTrackAdminActions() {
    if (!isFullAdminSession()) return;

    const rows = document.querySelectorAll('#trackList .track');

    rows.forEach((row, index) => {
        const track = currentPlaylistTracks[index];
        const action = row.querySelector('.track-action');
        if (!track || !action || action.querySelector('.w41it-track-edit')) return;

        const edit = makeInlineAdminIcon(
            'fas fa-pen',
            `Edit ${getDisplayTrackName(track.name)}`,
            () => editTrackInline(track.id),
            { button: true }
        );
        edit.classList.add('w41it-track-edit');
        action.prepend(edit);
    });
}

async function ensureVideoAdminReady() {
    if (!requireFullAdmin()) return false;

    try {
        if (typeof loadVideoTablesSdk === 'function') await loadVideoTablesSdk();
        if (videoTablesAccount?.useCurrentSession) await videoTablesAccount.useCurrentSession();

        if (
            typeof videoCatalogLoadedFromAppwrite !== 'undefined'
            && !videoCatalogLoadedFromAppwrite
            && typeof loadVideoCatalogFromAppwrite === 'function'
        ) {
            await loadVideoCatalogFromAppwrite();
        }

        return true;
    } catch (error) {
        console.error('Video admin session unavailable:', error);
        alert('Video editing is unavailable: ' + error.message);
        return false;
    }
}

async function editVideoGroupInline(kind, groupId) {
    if (!await ensureVideoAdminReady()) return;

    if (typeof editVideoCatalogGroup !== 'function') {
        return alert('Video catalog editor is still loading. Try again in a moment.');
    }

    await editVideoCatalogGroup(kind, groupId);
}

async function editVideoItemInline(kind, groupId, itemId) {
    if (!await ensureVideoAdminReady()) return;

    if (typeof editVideoCatalogItem !== 'function') {
        return alert('Video catalog editor is still loading. Try again in a moment.');
    }

    await editVideoCatalogItem(kind, groupId, itemId);
}

async function removeVideoItemInline(kind, groupId, itemId) {
    if (!await ensureVideoAdminReady()) return;

    if (typeof removeVideoCatalogItem !== 'function') {
        return alert('Video catalog editor is still loading. Try again in a moment.');
    }

    await removeVideoCatalogItem(kind, groupId, itemId);
}

async function removeVideoGroupInline(kind, groupId) {
    if (!await ensureVideoAdminReady()) return;

    if (typeof liveVideoCatalog === 'undefined' || !liveVideoCatalog) {
        return alert('Live Appwrite video catalog is not loaded.');
    }

    const list = kind === 'youtube'
        ? liveVideoCatalog.YOUTUBE_CHANNELS
        : liveVideoCatalog.VIDEO_SERIES;

    const index = list.findIndex(item => item.id === groupId);
    if (index < 0) return;

    const group = list[index];
    const displayName = kind === 'youtube'
        ? (group.displayName || group.name || group.sourceName || group.id)
        : (group.displayTitle || group.title || group.sourceTitle || group.id);

    if (!confirm(
        `Remove "${displayName}" from W41IT?\n\n`
        + 'The R2/VPS media files are kept as a recovery copy.'
    )) return;

    const removed = list.splice(index, 1)[0];

    try {
        await saveLiveVideoCatalog('Removing catalog group…');
    } catch (error) {
        list.splice(index, 0, removed);
        console.error('Video catalog group removal failed:', error);
        alert('Could not remove catalog group: ' + error.message);
    }
}

function appendCardAdminActions(card, actions) {
    if (!isFullAdminSession() || !card || card.querySelector(':scope > .w41it-inline-admin-actions')) {
        return card;
    }

    const wrap = document.createElement('span');
    wrap.className = 'w41it-inline-admin-actions';

    actions.forEach(action => {
        wrap.appendChild(
            makeInlineAdminIcon(
                action.icon,
                action.title,
                action.handler,
                { danger: Boolean(action.danger) }
            )
        );
    });

    card.appendChild(wrap);
    return card;
}

function rawYoutubeGroupId(series) {
    return series?.sourceId || String(series?.id || '').replace(/^youtube:/, '');
}

function installVideoCardDecorators() {
    if (typeof createVideoSeriesCard === 'function' && !createVideoSeriesCard.__w41itInlineAdmin) {
        const originalSeriesCard = createVideoSeriesCard;

        const wrappedSeriesCard = function (series, options) {
            const card = originalSeriesCard(series, options);

            return appendCardAdminActions(card, [
                {
                    icon: 'fas fa-pen',
                    title: `Edit ${series.title}`,
                    handler: () => editVideoGroupInline('anime', series.id)
                },
                {
                    icon: 'fas fa-trash-alt',
                    title: `Remove ${series.title} from catalog`,
                    danger: true,
                    handler: () => removeVideoGroupInline('anime', series.id)
                }
            ]);
        };

        wrappedSeriesCard.__w41itInlineAdmin = true;
        createVideoSeriesCard = wrappedSeriesCard;
    }

    if (typeof createYoutubeVideoCard === 'function' && !createYoutubeVideoCard.__w41itInlineAdmin) {
        const originalYoutubeCard = createYoutubeVideoCard;

        const wrappedYoutubeCard = function (series, episode) {
            const card = originalYoutubeCard(series, episode);
            const groupId = rawYoutubeGroupId(series);
            const itemId = episode.id || episode.number;

            return appendCardAdminActions(card, [
                {
                    icon: 'fas fa-pen',
                    title: `Edit ${episode.title}`,
                    handler: () => editVideoItemInline('youtube', groupId, itemId)
                },
                {
                    icon: 'fas fa-trash-alt',
                    title: `Remove ${episode.title} from catalog`,
                    danger: true,
                    handler: () => removeVideoItemInline('youtube', groupId, itemId)
                }
            ]);
        };

        wrappedYoutubeCard.__w41itInlineAdmin = true;
        createYoutubeVideoCard = wrappedYoutubeCard;
    }
}

function decorateYoutubeChannelHeadings() {
    if (!isFullAdminSession() || typeof getYoutubeChannelSeries !== 'function') return;

    const sections = document.querySelectorAll('#videoYoutubeChannels .video-youtube-channel');
    const channels = getYoutubeChannelSeries();

    sections.forEach((section, index) => {
        const series = channels[index];
        const actions = section.querySelector('.video-youtube-channel-actions');
        if (!series || !actions || actions.querySelector('.w41it-inline-admin-actions')) return;

        const wrap = document.createElement('span');
        wrap.className = 'w41it-inline-admin-actions';
        const groupId = rawYoutubeGroupId(series);

        wrap.append(
            makeInlineAdminIcon(
                'fas fa-pen',
                `Edit channel ${series.title}`,
                () => editVideoGroupInline('youtube', groupId),
                { button: true }
            ),
            makeInlineAdminIcon(
                'fas fa-trash-alt',
                `Remove channel ${series.title} from catalog`,
                () => removeVideoGroupInline('youtube', groupId),
                { danger: true, button: true }
            )
        );

        actions.appendChild(wrap);
    });
}

function decorateYoutubeChannelPage(series) {
    if (!isFullAdminSession() || !series) return;

    const header = document.querySelector('#videoYoutubeChannelView .video-youtube-channel-page-header');
    if (!header || header.querySelector(':scope > .w41it-inline-admin-actions')) return;

    const wrap = document.createElement('span');
    wrap.className = 'w41it-inline-admin-actions';
    const groupId = rawYoutubeGroupId(series);

    wrap.append(
        makeInlineAdminIcon(
            'fas fa-pen',
            `Edit channel ${series.title}`,
            () => editVideoGroupInline('youtube', groupId),
            { button: true }
        ),
        makeInlineAdminIcon(
            'fas fa-trash-alt',
            `Remove channel ${series.title} from catalog`,
            () => removeVideoGroupInline('youtube', groupId),
            { danger: true, button: true }
        )
    );

    header.appendChild(wrap);
}

function decorateVideoEpisodeRows(series, episodes) {
    if (!isFullAdminSession() || !series) return;

    const rows = document.querySelectorAll('#videoEpisodeList .video-episode-row');
    const youtube = typeof isYoutubeSeries === 'function' && isYoutubeSeries(series);
    const groupId = youtube ? rawYoutubeGroupId(series) : series.id;

    rows.forEach((row, index) => {
        const episode = episodes[index];
        const state = row.querySelector('.video-episode-state');
        if (!episode || !state || state.querySelector('.w41it-inline-admin-actions')) return;

        state.replaceChildren();

        const wrap = document.createElement('span');
        wrap.className = 'w41it-inline-admin-actions';
        const itemId = youtube ? (episode.id || episode.number) : episode.number;

        wrap.append(
            makeInlineAdminIcon(
                'fas fa-pen',
                `Edit ${episode.title}`,
                () => editVideoItemInline(youtube ? 'youtube' : 'anime', groupId, itemId)
            ),
            makeInlineAdminIcon(
                'fas fa-trash-alt',
                `Remove ${episode.title} from catalog`,
                () => removeVideoItemInline(youtube ? 'youtube' : 'anime', groupId, itemId),
                { danger: true }
            )
        );

        state.appendChild(wrap);
    });
}

function installRendererHooks() {
    if (typeof renderTrackList === 'function' && !renderTrackList.__w41itInlineAdmin) {
        const original = renderTrackList;
        const wrapped = function (...args) {
            const result = original.apply(this, args);
            decorateTrackAdminActions();
            return result;
        };
        wrapped.__w41itInlineAdmin = true;
        renderTrackList = wrapped;
    }

    if (typeof renderVideoYoutubeLibrary === 'function' && !renderVideoYoutubeLibrary.__w41itInlineAdmin) {
        const original = renderVideoYoutubeLibrary;
        const wrapped = function (...args) {
            const result = original.apply(this, args);
            decorateYoutubeChannelHeadings();
            return result;
        };
        wrapped.__w41itInlineAdmin = true;
        renderVideoYoutubeLibrary = wrapped;
    }

    if (typeof renderVideoYoutubeChannelView === 'function' && !renderVideoYoutubeChannelView.__w41itInlineAdmin) {
        const original = renderVideoYoutubeChannelView;
        const wrapped = function (series, ...rest) {
            const result = original.call(this, series, ...rest);
            decorateYoutubeChannelPage(series);
            return result;
        };
        wrapped.__w41itInlineAdmin = true;
        renderVideoYoutubeChannelView = wrapped;
    }

    if (typeof renderVideoEpisodeList === 'function' && !renderVideoEpisodeList.__w41itInlineAdmin) {
        const original = renderVideoEpisodeList;
        const wrapped = function (series, episodes) {
            const normalizedEpisodes = episodes || makeVideoEpisodes(series);
            const result = original.call(this, series, normalizedEpisodes);
            decorateVideoEpisodeRows(series, normalizedEpisodes);
            return result;
        };
        wrapped.__w41itInlineAdmin = true;
        renderVideoEpisodeList = wrapped;
    }
}

function installAdminGuards() {
    if (typeof openUploadModal === 'function' && !openUploadModal.__w41itVerifiedGuard) {
        const original = openUploadModal;
        const wrapped = function (...args) {
            if (!requireFullAdmin()) return;
            return original.apply(this, args);
        };
        wrapped.__w41itVerifiedGuard = true;
        openUploadModal = wrapped;
    }

    if (typeof triggerUpload === 'function' && !triggerUpload.__w41itVerifiedGuard) {
        const original = triggerUpload;
        const wrapped = async function (...args) {
            if (!requireFullAdmin()) return;
            return original.apply(this, args);
        };
        wrapped.__w41itVerifiedGuard = true;
        triggerUpload = wrapped;
    }

    if (typeof deleteTrack === 'function' && !deleteTrack.__w41itVerifiedGuard) {
        const wrapped = async function (trackId, trackName) {
            if (!requireFullAdmin()) return;

            if (!confirm(
                `Remove "${getDisplayTrackName(trackName)}" from W41IT?\n\n`
                + 'The audio object in R2 is kept as a recovery copy.'
            )) return;

            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, trackId);
                await fetchTracks();
            } catch (error) {
                console.error('Delete Error:', error);
                alert('Failed to remove track: ' + error.message);
            }
        };

        wrapped.__w41itVerifiedGuard = true;
        deleteTrack = wrapped;
    }
}

function initializeInlineAdminTools() {
    installInlineAdminStyles();
    installVideoCardDecorators();
    installRendererHooks();
    installAdminGuards();

    const loginName = document.getElementById('username');
    const loginPassword = document.getElementById('password');

    if (loginName) {
        loginName.placeholder = 'Username or admin email';
        loginName.autocomplete = 'username';
    }
    if (loginPassword) loginPassword.autocomplete = 'current-password';

    decorateTrackAdminActions();
    decorateYoutubeChannelHeadings();
}

initializeInlineAdminTools();
