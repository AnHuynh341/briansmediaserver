function handleKeyPress(event) {
    if (event.key === 'Enter') login();
}

async function clearCurrentAppwriteSession() {
    try {
        await account.deleteSession('current');
    } catch (_error) {
        // No active Appwrite session.
    }
}

function setLoginButtonState(kind, message) {
    const btn = document.getElementById('loginBtn');
    if (!btn) return;

    btn.classList.remove('btn-success', 'btn-error');
    if (kind === 'success') btn.classList.add('btn-success');
    if (kind === 'error') btn.classList.add('btn-error');
    btn.innerHTML = message;
}

async function loginVerifiedAdmin(email, password) {
    await clearCurrentAppwriteSession();
    await account.createEmailPasswordSession(email, password);

    const authUser = await account.get();

    if (!isVerifiedAdminAccount(authUser)) {
        await clearCurrentAppwriteSession();

        if (authUser?.$id === APPWRITE_ADMIN_USER_ID && authUser?.emailVerification !== true) {
            throw new Error('Admin email is not verified');
        }

        throw new Error('This Appwrite account is not the W41IT administrator');
    }

    currentUser = String(authUser.name || authUser.email || 'admin').trim();
    currentUserRole = 'admin';
    currentUserId = authUser.$id;
    currentUserAuthId = authUser.$id;
    currentAuthMode = 'verified-admin';
    currentUserVerified = true;

    try {
        await loadVideoTablesSdk();
        await videoTablesAccount.useCurrentSession();
    } catch (error) {
        console.warn('Video catalog admin JWT could not be prepared yet:', error);
    }

    return authUser;
}

async function loginLegacyUser(username, password) {
    await clearCurrentAppwriteSession();
    await account.createAnonymousSession();

    const anonymousAccount = await account.get();

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

    // Legacy users can still use their playlists, but they can never acquire
    // full administration from a client-readable role field.
    currentUserRole = 'user';
    currentUserId = userDoc.$id;
    currentUserAuthId = anonymousAccount.$id;
    currentAuthMode = 'legacy';
    currentUserVerified = false;

    return userDoc;
}

async function login() {
    const btn = document.getElementById('loginBtn');
    const usernameOrEmail = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!usernameOrEmail || !password) return;

    btn.style.pointerEvents = 'none';
    setLoginButtonState(
        'idle',
        '<i class="fas fa-circle-notch fa-spin"></i> AUTHENTICATING...'
    );

    try {
        let forceChange = false;

        if (usernameOrEmail.includes('@')) {
            await loginVerifiedAdmin(usernameOrEmail, password);
        } else {
            const userDoc = await loginLegacyUser(usernameOrEmail, password);
            forceChange = Boolean(userDoc.forceChange);
        }

        setLoginButtonState(
            'success',
            '<i class="fas fa-unlock-alt"></i> ACCESS GRANTED'
        );

        setTimeout(() => {
            if (forceChange && currentAuthMode === 'legacy') {
                document.getElementById('changePasswordModal').classList.remove('hidden');
            } else {
                grantAccess();
            }
        }, 500);
    } catch (error) {
        console.error('Login Error:', error);

        await clearCurrentAppwriteSession();

        currentUser = null;
        currentUserRole = null;
        currentUserId = null;
        currentUserAuthId = null;
        currentAuthMode = 'none';
        currentUserVerified = false;

        setLoginButtonState(
            'error',
            '<i class="fas fa-exclamation-triangle"></i> ACCESS DENIED'
        );
        document.querySelector('.login-box').classList.add('shake-error');

        setTimeout(() => {
            document.querySelector('.login-box').classList.remove('shake-error');
            setLoginButtonState('idle', 'Enter System');
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

        if (currentUserRole !== 'admin' && currentUser) {
            if (userWelcomeText) {
                userWelcomeText.textContent = `WELCOME, ${String(currentUser).toUpperCase()}`;
            }
            if (userWelcome) userWelcome.classList.remove('hidden');
        } else {
            if (userWelcome) userWelcome.classList.add('hidden');
        }

        const isAdmin = currentUserRole === 'admin'
            && currentAuthMode === 'verified-admin'
            && currentUserAuthId === APPWRITE_ADMIN_USER_ID
            && currentUserVerified === true;

        if (uploadNav) uploadNav.style.display = isAdmin ? 'flex' : 'none';
        if (adminNav) adminNav.style.display = isAdmin ? 'flex' : 'none';

        fetchTracks();
        fetchPlaylists();

        if (typeof renderTrackList === 'function') renderTrackList();
        if (typeof renderVideoHome === 'function') renderVideoHome();
    }, 400);
}

async function updatePassword() {
    if (currentAuthMode !== 'legacy') {
        return alert('Password changes for the verified administrator are managed by Appwrite Auth.');
    }

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
