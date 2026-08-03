function handleKeyPress(event) {
    if (event.key === 'Enter') login();
}

async function login() {
    const btn = document.getElementById('loginBtn');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) return;

    btn.style.pointerEvents = 'none';
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> AUTHENTICATING...';

    try {
        const sessionAccount = new Appwrite.Account(client);

        try {
            await sessionAccount.createAnonymousSession();
        } catch (error) {
            // An anonymous session may already exist.
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Appwrite.Query.equal('username', username)]
        );

        if (response.documents.length === 0) {
            throw new Error('User not found');
        }

        const userDoc = response.documents[0];

        if (userDoc.password !== password) {
            throw new Error('Invalid password');
        }

        currentUser = userDoc.username;
        currentUserRole = userDoc.role;
        currentUserId = userDoc.$id;
        currentUploadAccess = userDoc.uploadAccessUntil;

        btn.classList.add('btn-success');
        btn.innerHTML = '<i class="fas fa-unlock-alt"></i> ACCESS GRANTED';

        setTimeout(() => {
            if (userDoc.forceChange) {
                document.getElementById('changePasswordModal').classList.remove('hidden');
            } else {
                grantAccess();
            }
        }, 800);
    } catch (error) {
        console.error('Login Error:', error);

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

        const uploadNav = document.getElementById('uploadNavBtn');
        const adminNav = document.getElementById('navAdminPanel');
        const userWelcome = document.getElementById('userWelcome');
        const userWelcomeText = document.getElementById('userWelcomeText');

        // Standard users receive a personal sidebar greeting.
        // textContent prevents usernames from being interpreted as HTML.
        if (currentUserRole !== 'admin' && currentUser) {
            if (userWelcomeText) {
                userWelcomeText.textContent = `WELCOME, ${String(currentUser).toUpperCase()}`;
            }
            if (userWelcome) userWelcome.classList.remove('hidden');
        } else {
            if (userWelcome) userWelcome.classList.add('hidden');
        }

        const isAccessValid = currentUploadAccess
            && Date.now() < Number.parseInt(currentUploadAccess, 10);

        if (currentUserRole === 'admin') {
            if (uploadNav) uploadNav.style.display = 'flex';
            if (adminNav) adminNav.style.display = 'flex';
        } else if (isAccessValid) {
            if (uploadNav) uploadNav.style.display = 'flex';
            if (adminNav) adminNav.style.display = 'none';
        } else {
            if (uploadNav) uploadNav.style.display = 'none';
            if (adminNav) adminNav.style.display = 'none';
        }

        fetchTracks();
        fetchPlaylists();
    }, 600);
}

async function updatePassword() {
    const btn = document.querySelector('#changePasswordModal .btn-save');
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword.length < 6) {
        return alert('Password must be at least 6 characters.');
    }

    if (newPassword !== confirmPassword) {
        return alert('Passwords do not match.');
    }

    btn.innerText = 'UPDATING...';

    try {
        await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            currentUserId,
            {
                password: newPassword,
                forceChange: false
            }
        );

        document.getElementById('changePasswordModal').classList.add('hidden');
        grantAccess();
    } catch (error) {
        alert('Error updating security: ' + error.message);
        btn.innerText = 'Update Security';
    }
}

// ==========================================
// ADMIN DASHBOARD & USER LIST UI
// ==========================================
function openAdminModal() {
    document.getElementById('adminModal').classList.remove('hidden');
    loadAdminUserList();
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

async function loadAdminUserList() {
    const listContainer = document.getElementById('adminUserList');
    listContainer.innerHTML = '<div style="padding: 15px; text-align: center; color: var(--text-sub);"><i class="fas fa-circle-notch fa-spin"></i> Fetching user database...</div>';

    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Appwrite.Query.limit(100)]
        );

        listContainer.innerHTML = '';

        if (response.documents.length === 0) {
            listContainer.innerHTML = '<div style="padding: 15px; text-align: center; color: var(--text-sub);">No users found.</div>';
            return;
        }

        response.documents.forEach(user => {
            if (user.role === 'admin') return;

            const now = Date.now();
            const hasAccess = user.uploadAccessUntil
                && now < Number.parseInt(user.uploadAccessUntil, 10);

            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '12px 15px';
            row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

            const userInfo = document.createElement('div');
            userInfo.style.display = 'flex';
            userInfo.style.flexDirection = 'column';
            userInfo.style.gap = '4px';

            const username = document.createElement('span');
            username.style.fontWeight = '600';
            username.style.color = 'white';
            username.style.fontSize = '0.95rem';
            username.innerText = `@${user.username}`;

            const statusBadge = document.createElement('span');
            statusBadge.style.fontSize = '0.75rem';
            statusBadge.style.padding = '2px 6px';
            statusBadge.style.borderRadius = '4px';
            statusBadge.style.color = hasAccess ? 'var(--success)' : '#ff4d4d';
            statusBadge.style.background = hasAccess
                ? 'rgba(0, 255, 136, 0.1)'
                : 'rgba(255, 77, 77, 0.1)';
            statusBadge.innerText = hasAccess ? '● ACTIVE' : '● LOCKED';

            userInfo.appendChild(username);
            userInfo.appendChild(statusBadge);

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '8px';

            const grantButton = document.createElement('button');
            grantButton.innerText = '+3h';
            grantButton.style.background = 'var(--accent)';
            grantButton.style.color = 'black';
            grantButton.style.border = 'none';
            grantButton.style.padding = '6px 12px';
            grantButton.style.borderRadius = '4px';
            grantButton.style.cursor = 'pointer';
            grantButton.style.fontSize = '0.8rem';
            grantButton.style.fontWeight = 'bold';
            grantButton.onclick = () => adminActionGrant(user.$id, 3);

            const revokeButton = document.createElement('button');
            revokeButton.innerHTML = '<i class="fas fa-times"></i>';
            revokeButton.style.background = 'transparent';
            revokeButton.style.color = '#ff4d4d';
            revokeButton.style.border = '1px solid #ff4d4d';
            revokeButton.style.padding = '6px 12px';
            revokeButton.style.borderRadius = '4px';
            revokeButton.style.cursor = 'pointer';
            revokeButton.style.fontSize = '0.8rem';
            revokeButton.style.fontWeight = 'bold';
            revokeButton.onclick = () => adminActionRevoke(user.$id);

            actions.appendChild(grantButton);
            actions.appendChild(revokeButton);

            row.appendChild(userInfo);
            row.appendChild(actions);
            listContainer.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load users:', error);
        listContainer.innerHTML = '<div style="padding: 15px; text-align: center; color: #ff4d4d;">Failed to connect to database.</div>';
    }
}
