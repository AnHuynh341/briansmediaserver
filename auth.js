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

        // Upload and administration are now admin-only.
        const isAdmin = currentUserRole === 'admin';
        if (uploadNav) uploadNav.style.display = isAdmin ? 'flex' : 'none';
        if (adminNav) adminNav.style.display = isAdmin ? 'flex' : 'none';

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

