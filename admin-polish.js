// ==========================================================
// W41IT verified-admin UI polish
// ==========================================================
// Replaces browser prompt/confirm dialogs with an in-app editor, adds a small
// verified-admin shield, and keeps destructive actions visually distinct.

function installAdminPolishStyles() {
    if (document.getElementById('w41it-admin-polish-style')) return;

    const style = document.createElement('style');
    style.id = 'w41it-admin-polish-style';
    style.textContent = `
      .w41it-admin-shield{
        position:absolute;top:15px;right:14px;z-index:20;
        width:31px;height:31px;border-radius:10px;
        border:1px solid rgba(82,231,255,.28);
        background:linear-gradient(145deg,rgba(28,34,54,.95),rgba(7,10,18,.96));
        color:#67e8f9;display:none;align-items:center;justify-content:center;
        box-shadow:0 0 0 1px rgba(255,255,255,.025) inset,0 8px 24px rgba(0,0,0,.28);
        cursor:default
      }
      .w41it-admin-shield.visible{display:flex}
      .w41it-admin-shield i{font-size:.82rem;filter:drop-shadow(0 0 7px rgba(103,232,249,.36))}

      .w41it-admin-editor-overlay{
        position:fixed;inset:0;z-index:10050;
        display:flex;align-items:center;justify-content:center;
        padding:22px;background:rgba(2,5,12,.72);
        backdrop-filter:blur(12px) saturate(.88);
        animation:w41it-admin-fade .16s ease-out
      }
      .w41it-admin-editor{
        width:min(520px,100%);max-height:min(720px,calc(100vh - 44px));overflow:auto;
        border:1px solid rgba(255,255,255,.12);border-radius:18px;
        background:
          radial-gradient(circle at 85% 0%,rgba(68,211,255,.10),transparent 38%),
          linear-gradient(160deg,rgba(18,22,36,.985),rgba(7,10,18,.99));
        box-shadow:0 28px 90px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.025) inset;
        color:var(--text-main,#f3f4f6);
        animation:w41it-admin-rise .2s cubic-bezier(.2,.75,.28,1)
      }
      .w41it-admin-editor.danger{
        background:
          radial-gradient(circle at 85% 0%,rgba(248,113,113,.10),transparent 38%),
          linear-gradient(160deg,rgba(25,19,29,.985),rgba(9,8,15,.99))
      }
      .w41it-admin-editor-head{display:flex;gap:13px;align-items:flex-start;padding:20px 20px 13px}
      .w41it-admin-editor-mark{
        flex:0 0 auto;width:38px;height:38px;border-radius:12px;
        display:flex;align-items:center;justify-content:center;
        border:1px solid rgba(103,232,249,.2);background:rgba(103,232,249,.07);color:#67e8f9
      }
      .w41it-admin-editor.danger .w41it-admin-editor-mark{border-color:rgba(248,113,113,.25);background:rgba(248,113,113,.08);color:#fca5a5}
      .w41it-admin-editor-heading{min-width:0;display:grid;gap:3px;flex:1}
      .w41it-admin-editor-kicker{font-size:.66rem;text-transform:uppercase;letter-spacing:.16em;color:#7dd3fc;font-weight:700}
      .w41it-admin-editor.danger .w41it-admin-editor-kicker{color:#fca5a5}
      .w41it-admin-editor-title{margin:0;font-size:1.06rem;line-height:1.35;color:#f8fafc;font-weight:750}
      .w41it-admin-editor-subtitle{margin:2px 0 0;color:var(--text-sub,#98a2b3);font-size:.78rem;line-height:1.55}
      .w41it-admin-editor-close{
        flex:0 0 auto;width:31px;height:31px;border:0;border-radius:9px;
        background:transparent;color:#94a3b8;cursor:pointer
      }
      .w41it-admin-editor-close:hover{background:rgba(255,255,255,.07);color:#fff}
      .w41it-admin-editor-body{display:grid;gap:14px;padding:8px 20px 18px}
      .w41it-admin-field{display:grid;gap:6px}
      .w41it-admin-field label{font-size:.69rem;font-weight:700;letter-spacing:.055em;text-transform:uppercase;color:#aab4c6}
      .w41it-admin-field input,.w41it-admin-field textarea,.w41it-admin-field select{
        width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.11);border-radius:10px;
        background:rgba(2,5,12,.52);color:#f1f5f9;padding:10px 11px;
        font:inherit;font-size:.86rem;outline:none;transition:border-color .15s ease,box-shadow .15s ease,background .15s ease
      }
      .w41it-admin-field textarea{min-height:96px;resize:vertical;line-height:1.5}
      .w41it-admin-field input:focus,.w41it-admin-field textarea:focus,.w41it-admin-field select:focus{
        border-color:rgba(103,232,249,.48);box-shadow:0 0 0 3px rgba(34,211,238,.08);background:rgba(2,5,12,.7)
      }
      .w41it-admin-editor-actions{
        display:flex;justify-content:flex-end;gap:8px;padding:14px 20px 19px;
        border-top:1px solid rgba(255,255,255,.065);background:rgba(0,0,0,.10)
      }
      .w41it-admin-editor-actions button{
        min-height:36px;border-radius:10px;padding:0 14px;font:inherit;font-size:.78rem;font-weight:700;cursor:pointer
      }
      .w41it-admin-cancel{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);color:#cbd5e1}
      .w41it-admin-cancel:hover{background:rgba(255,255,255,.085);color:#fff}
      .w41it-admin-save{border:1px solid rgba(34,211,238,.32);background:linear-gradient(135deg,rgba(8,145,178,.76),rgba(14,116,144,.74));color:#ecfeff;box-shadow:0 7px 20px rgba(8,145,178,.15)}
      .w41it-admin-save:hover{filter:brightness(1.12)}
      .w41it-admin-save.danger{border-color:rgba(248,113,113,.32);background:linear-gradient(135deg,rgba(185,28,28,.78),rgba(127,29,29,.8));color:#fff1f2;box-shadow:0 7px 20px rgba(127,29,29,.2)}
      .w41it-admin-save:disabled{opacity:.55;cursor:wait}

      .w41it-admin-toast-stack{position:fixed;right:18px;bottom:18px;z-index:10100;display:grid;gap:8px;pointer-events:none}
      .w41it-admin-toast{
        display:flex;align-items:center;gap:9px;max-width:min(360px,calc(100vw - 36px));
        padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:11px;
        background:rgba(8,12,21,.94);color:#e5e7eb;font-size:.78rem;
        box-shadow:0 14px 40px rgba(0,0,0,.4);backdrop-filter:blur(10px);
        animation:w41it-toast-in .18s ease-out
      }
      .w41it-admin-toast i{color:#67e8f9}.w41it-admin-toast.error i{color:#fca5a5}

      @media(hover:hover){
        .video-series-card>.w41it-inline-admin-actions,
        .video-youtube-card>.w41it-inline-admin-actions{opacity:.12;transform:translateY(-2px);transition:opacity .16s ease,transform .16s ease}
        .video-series-card:hover>.w41it-inline-admin-actions,
        .video-series-card:focus-within>.w41it-inline-admin-actions,
        .video-youtube-card:hover>.w41it-inline-admin-actions,
        .video-youtube-card:focus-within>.w41it-inline-admin-actions{opacity:1;transform:none}
        #trackList .track .track-action{opacity:.32;transition:opacity .16s ease}
        #trackList .track:hover .track-action,#trackList .track:focus-within .track-action{opacity:1}
      }
      @media(max-width:640px){
        .w41it-admin-editor-overlay{padding:12px;align-items:flex-end}
        .w41it-admin-editor{border-radius:17px 17px 10px 10px;max-height:86vh}
        .w41it-admin-editor-head{padding:17px 16px 11px}.w41it-admin-editor-body{padding:7px 16px 16px}
        .w41it-admin-editor-actions{padding:12px 16px 16px}.w41it-admin-editor-actions button{flex:1}
        .w41it-admin-shield{top:12px;right:11px}
      }
      @keyframes w41it-admin-fade{from{opacity:0}to{opacity:1}}
      @keyframes w41it-admin-rise{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
      @keyframes w41it-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    `;

    document.head.appendChild(style);
}

function showAdminToast(message, kind = 'success') {
    let stack = document.getElementById('w41itAdminToastStack');

    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'w41itAdminToastStack';
        stack.className = 'w41it-admin-toast-stack';
        document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = `w41it-admin-toast${kind === 'error' ? ' error' : ''}`;
    toast.innerHTML = `<i class="fas ${kind === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}" aria-hidden="true"></i>`;

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    stack.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(6px)';
        toast.style.transition = 'opacity .18s ease,transform .18s ease';
        setTimeout(() => toast.remove(), 190);
    }, 2600);
}

function createAdminField(field) {
    const wrapper = document.createElement('div');
    wrapper.className = 'w41it-admin-field';

    const label = document.createElement('label');
    label.textContent = field.label;
    label.htmlFor = `w41it-admin-field-${field.name}`;
    wrapper.appendChild(label);

    let input;

    if (field.type === 'textarea') {
        input = document.createElement('textarea');
    } else if (field.type === 'select') {
        input = document.createElement('select');
        const values = Array.isArray(field.options) ? field.options.slice() : [];
        if (field.value && !values.includes(field.value)) values.unshift(field.value);
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            input.appendChild(option);
        });
    } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
    }

    input.id = `w41it-admin-field-${field.name}`;
    input.name = field.name;
    input.value = field.value ?? '';
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.required) input.required = true;
    wrapper.appendChild(input);

    return { wrapper, input };
}

function openAdminEditor({
    title,
    kicker = 'Verified administrator',
    subtitle = '',
    icon = 'fa-pen',
    fields = [],
    submitLabel = 'Save changes',
    danger = false
}) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'w41it-admin-editor-overlay';

        const form = document.createElement('form');
        form.className = `w41it-admin-editor${danger ? ' danger' : ''}`;
        form.setAttribute('role', 'dialog');
        form.setAttribute('aria-modal', 'true');
        form.setAttribute('aria-label', title);

        const head = document.createElement('div');
        head.className = 'w41it-admin-editor-head';
        head.innerHTML = `
          <span class="w41it-admin-editor-mark"><i class="fas ${icon}" aria-hidden="true"></i></span>
          <div class="w41it-admin-editor-heading">
            <span class="w41it-admin-editor-kicker"></span>
            <h3 class="w41it-admin-editor-title"></h3>
            <p class="w41it-admin-editor-subtitle"></p>
          </div>`;
        head.querySelector('.w41it-admin-editor-kicker').textContent = kicker;
        head.querySelector('.w41it-admin-editor-title').textContent = title;
        const subtitleElement = head.querySelector('.w41it-admin-editor-subtitle');
        subtitleElement.textContent = subtitle;
        if (!subtitle) subtitleElement.style.display = 'none';

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'w41it-admin-editor-close';
        close.setAttribute('aria-label', 'Close');
        close.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
        head.appendChild(close);

        const body = document.createElement('div');
        body.className = 'w41it-admin-editor-body';
        const inputs = {};

        fields.forEach(field => {
            const created = createAdminField(field);
            inputs[field.name] = created.input;
            body.appendChild(created.wrapper);
        });

        if (fields.length === 0 && subtitle) {
            body.style.display = 'none';
        }

        const actions = document.createElement('div');
        actions.className = 'w41it-admin-editor-actions';

        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'w41it-admin-cancel';
        cancel.textContent = 'Cancel';

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = `w41it-admin-save${danger ? ' danger' : ''}`;
        submit.textContent = submitLabel;
        actions.append(cancel, submit);

        form.append(head, body, actions);
        overlay.appendChild(form);
        document.body.appendChild(overlay);

        let settled = false;

        const finish = value => {
            if (settled) return;
            settled = true;
            document.removeEventListener('keydown', onKeydown);
            overlay.remove();
            resolve(value);
        };

        const onKeydown = event => {
            if (event.key === 'Escape') finish(null);
        };

        close.addEventListener('click', () => finish(null));
        cancel.addEventListener('click', () => finish(null));
        overlay.addEventListener('mousedown', event => {
            if (event.target === overlay) finish(null);
        });
        document.addEventListener('keydown', onKeydown);

        form.addEventListener('submit', event => {
            event.preventDefault();
            const values = {};
            Object.entries(inputs).forEach(([name, input]) => {
                values[name] = input.value;
            });
            finish(values);
        });

        const firstInput = Object.values(inputs)[0];
        requestAnimationFrame(() => (firstInput || submit).focus());
    });
}

function openAdminConfirm({ title, message, confirmLabel = 'Remove', icon = 'fa-trash-alt' }) {
    return openAdminEditor({
        title,
        kicker: 'Destructive action',
        subtitle: message,
        icon,
        submitLabel: confirmLabel,
        danger: true,
        fields: []
    });
}

function installAdminShieldBadge() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    let badge = document.getElementById('w41itAdminShield');
    if (!badge) {
        badge = document.createElement('span');
        badge.id = 'w41itAdminShield';
        badge.className = 'w41it-admin-shield';
        badge.title = 'Verified administrator';
        badge.setAttribute('aria-label', 'Verified administrator');
        badge.innerHTML = '<i class="fas fa-shield-alt" aria-hidden="true"></i>';
        sidebar.appendChild(badge);
    }

    badge.classList.toggle('visible', typeof isFullAdminSession === 'function' && isFullAdminSession());
}

function refreshAdminShieldBadge() {
    const badge = document.getElementById('w41itAdminShield');
    if (badge) badge.classList.toggle('visible', typeof isFullAdminSession === 'function' && isFullAdminSession());
}

async function editTrackInlinePolished(trackId) {
    if (!requireFullAdmin()) return;

    const track = allTracks.find(item => item.id === trackId);
    if (!track) return showAdminToast('Track not found.', 'error');

    const values = await openAdminEditor({
        title: 'Edit track',
        kicker: 'Audio metadata',
        subtitle: getDisplayTrackName(track.name),
        icon: 'fa-music',
        fields: [
            {
                name: 'name',
                label: 'Track name',
                value: getDisplayTrackName(track.name),
                required: true
            },
            {
                name: 'artist',
                label: 'Artist',
                value: track.artist || 'Unknown Artist',
                required: true
            },
            {
                name: 'genre',
                label: 'Genre',
                type: 'select',
                value: track.genre || 'Other',
                options: ['J-POP', 'US-UK', 'OST', 'Other']
            }
        ]
    });

    if (!values) return;

    try {
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            track.id,
            {
                name: values.name.trim() || getDisplayTrackName(track.name),
                artist: values.artist.trim() || 'Unknown Artist',
                genre: values.genre || 'Other'
            }
        );

        await fetchTracks();
        showAdminToast('Track metadata updated.');
    } catch (error) {
        console.error('Track metadata update failed:', error);
        showAdminToast(`Could not update track: ${error.message}`, 'error');
    }
}

async function editVideoGroupInlinePolished(kind, groupId) {
    if (!await ensureVideoAdminReady()) return;
    if (typeof liveVideoCatalog === 'undefined' || !liveVideoCatalog) {
        return showAdminToast('Live video catalog is not loaded.', 'error');
    }

    const list = kind === 'youtube'
        ? liveVideoCatalog.YOUTUBE_CHANNELS
        : liveVideoCatalog.VIDEO_SERIES;
    const group = list.find(item => item.id === groupId);
    if (!group) return showAdminToast('Video group not found.', 'error');

    const currentName = kind === 'youtube'
        ? (group.displayName || group.name || group.sourceName || group.id)
        : (group.displayTitle || group.title || group.sourceTitle || group.id);

    const values = await openAdminEditor({
        title: kind === 'youtube' ? 'Edit channel' : 'Edit anime series',
        kicker: kind === 'youtube' ? 'YouTube archive' : 'Anime catalog',
        subtitle: currentName,
        icon: kind === 'youtube' ? 'fa-video' : 'fa-film',
        fields: [
            { name: 'name', label: kind === 'youtube' ? 'Channel name' : 'Series name', value: currentName, required: true },
            { name: 'description', label: 'Description', type: 'textarea', value: group.description || '', placeholder: 'Optional catalog description' }
        ]
    });

    if (!values) return;

    const oldDisplay = kind === 'youtube' ? group.displayName : group.displayTitle;
    const oldDescription = group.description;

    if (kind === 'youtube') group.displayName = values.name.trim() || currentName;
    else group.displayTitle = values.name.trim() || currentName;
    group.description = values.description;

    try {
        await saveLiveVideoCatalog('Saving group metadata…');
        showAdminToast(kind === 'youtube' ? 'Channel updated.' : 'Series updated.');
    } catch (error) {
        if (kind === 'youtube') group.displayName = oldDisplay;
        else group.displayTitle = oldDisplay;
        group.description = oldDescription;
        console.error('Video catalog group update failed:', error);
        showAdminToast(`Could not save changes: ${error.message}`, 'error');
    }
}

async function editVideoItemInlinePolished(kind, groupId, itemId) {
    if (!await ensureVideoAdminReady()) return;
    if (typeof liveVideoCatalog === 'undefined' || !liveVideoCatalog) {
        return showAdminToast('Live video catalog is not loaded.', 'error');
    }

    const groups = kind === 'youtube'
        ? liveVideoCatalog.YOUTUBE_CHANNELS
        : liveVideoCatalog.VIDEO_SERIES;
    const group = groups.find(item => item.id === groupId);
    const items = kind === 'youtube' ? group?.videos : group?.episodes;
    const item = items?.find(entry => String(entry.id || entry.number) === String(itemId));
    if (!item) return showAdminToast('Video item not found.', 'error');

    const originalTitle = item.title || '';
    const values = await openAdminEditor({
        title: kind === 'youtube' ? 'Edit video' : 'Edit episode',
        kicker: kind === 'youtube' ? 'YouTube metadata' : 'Episode metadata',
        subtitle: originalTitle,
        icon: 'fa-pen',
        fields: [
            { name: 'title', label: 'Display title', value: originalTitle, required: true }
        ]
    });

    if (!values) return;

    item.title = values.title.trim() || originalTitle;

    try {
        await saveLiveVideoCatalog('Saving item metadata…');
        showAdminToast(kind === 'youtube' ? 'Video title updated.' : 'Episode title updated.');
    } catch (error) {
        item.title = originalTitle;
        console.error('Video catalog item update failed:', error);
        showAdminToast(`Could not save changes: ${error.message}`, 'error');
    }
}

async function removeVideoItemInlinePolished(kind, groupId, itemId) {
    if (!await ensureVideoAdminReady()) return;
    if (typeof liveVideoCatalog === 'undefined' || !liveVideoCatalog) return;

    const groups = kind === 'youtube'
        ? liveVideoCatalog.YOUTUBE_CHANNELS
        : liveVideoCatalog.VIDEO_SERIES;
    const group = groups.find(item => item.id === groupId);
    const key = kind === 'youtube' ? 'videos' : 'episodes';
    const items = group?.[key];
    if (!Array.isArray(items)) return;

    const index = items.findIndex(entry => String(entry.id || entry.number) === String(itemId));
    if (index < 0) return;

    const item = items[index];
    const accepted = await openAdminConfirm({
        title: `Remove ${kind === 'youtube' ? 'video' : 'episode'}?`,
        message: `“${item.title || itemId}” will disappear from W41IT. The R2/VPS media is kept as a recovery copy.`
    });
    if (!accepted) return;

    const removed = items.splice(index, 1)[0];

    try {
        await saveLiveVideoCatalog('Removing catalog item…');
        showAdminToast('Catalog item removed.');
    } catch (error) {
        items.splice(index, 0, removed);
        console.error('Video catalog item removal failed:', error);
        showAdminToast(`Could not remove item: ${error.message}`, 'error');
    }
}

async function removeVideoGroupInlinePolished(kind, groupId) {
    if (!await ensureVideoAdminReady()) return;
    if (typeof liveVideoCatalog === 'undefined' || !liveVideoCatalog) return;

    const list = kind === 'youtube'
        ? liveVideoCatalog.YOUTUBE_CHANNELS
        : liveVideoCatalog.VIDEO_SERIES;
    const index = list.findIndex(item => item.id === groupId);
    if (index < 0) return;

    const group = list[index];
    const displayName = kind === 'youtube'
        ? (group.displayName || group.name || group.sourceName || group.id)
        : (group.displayTitle || group.title || group.sourceTitle || group.id);

    const accepted = await openAdminConfirm({
        title: `Remove ${kind === 'youtube' ? 'channel' : 'series'}?`,
        message: `“${displayName}” and its catalog entries will disappear from W41IT. The R2/VPS media is kept as a recovery copy.`
    });
    if (!accepted) return;

    const removed = list.splice(index, 1)[0];

    try {
        await saveLiveVideoCatalog('Removing catalog group…');
        showAdminToast(kind === 'youtube' ? 'Channel removed from catalog.' : 'Series removed from catalog.');
    } catch (error) {
        list.splice(index, 0, removed);
        console.error('Video catalog group removal failed:', error);
        showAdminToast(`Could not remove group: ${error.message}`, 'error');
    }
}

async function deleteTrackPolished(trackId, trackName) {
    if (!requireFullAdmin()) return;

    const accepted = await openAdminConfirm({
        title: 'Remove track?',
        message: `“${getDisplayTrackName(trackName)}” will be removed from W41IT. The audio object in R2 is kept as a recovery copy.`
    });
    if (!accepted) return;

    try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, trackId);
        await fetchTracks();
        showAdminToast('Track removed from the library.');
    } catch (error) {
        console.error('Delete Error:', error);
        showAdminToast(`Failed to remove track: ${error.message}`, 'error');
    }
}

function installAdminPolishOverrides() {
    editTrackInline = editTrackInlinePolished;
    editVideoGroupInline = editVideoGroupInlinePolished;
    editVideoItemInline = editVideoItemInlinePolished;
    removeVideoItemInline = removeVideoItemInlinePolished;
    removeVideoGroupInline = removeVideoGroupInlinePolished;
    deleteTrack = deleteTrackPolished;

    if (typeof grantAccess === 'function' && !grantAccess.__w41itAdminPolish) {
        const originalGrantAccess = grantAccess;
        const wrappedGrantAccess = function (...args) {
            const result = originalGrantAccess.apply(this, args);
            setTimeout(() => {
                installAdminShieldBadge();
                refreshAdminShieldBadge();
            }, 460);
            return result;
        };
        wrappedGrantAccess.__w41itAdminPolish = true;
        grantAccess = wrappedGrantAccess;
    }
}

function initializeAdminPolish() {
    installAdminPolishStyles();
    installAdminShieldBadge();
    installAdminPolishOverrides();
    refreshAdminShieldBadge();
}

initializeAdminPolish();
