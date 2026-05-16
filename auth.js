// ==========================================
// AUTH.JS — Authentication & Session
// ==========================================
// Depends on: config.js, ui.js (grantAccess calls fetchTracks/fetchPlaylists)

function handleKeyPress(e) {
    if (e.key === 'Enter') login();
}

async function login() {
    const btn = document.getElementById('loginBtn');

    if (!document.getElementById('username').value.trim() || !document.getElementById('password').value) return;

    btn.style.pointerEvents = 'none';
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> AUTHENTICATING...';

    try {
        const account = new Appwrite.Account(client);
        try { await account.createAnonymousSession(); } catch (e) {}

        const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
            Query.equal("username", document.getElementById('username').value.trim())
        ]);

        if (response.documents.length === 0) throw new Error("User not found");
        const userDoc = response.documents[0];

        if (userDoc.password !== document.getElementById('password').value) throw new Error("Invalid password");

        // Set global user states
        currentUser = userDoc.username;
        currentUserRole = userDoc.role;
        currentUserId = userDoc.$id;
        currentUploadAccess = userDoc.uploadAccessUntil; // <--- NEW: Grab their clearance timestamp

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
        console.error("Login Error:", error);
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

        // ==========================================
        // SECURITY CLEARANCE CHECK
        // ==========================================
        const uploadNav = document.querySelector('.nav-links .nav-item:nth-child(2)');
        
        // 1. Check if their timestamp is valid (in the future)
        const isAccessValid = currentUploadAccess && (Date.now() < currentUploadAccess);

        // 2. Hide upload if they aren't an admin AND their time is expired
        if (currentUserRole !== 'admin' && !isAccessValid) {
            if (uploadNav) uploadNav.style.display = 'none';
        } else {
            // Otherwise, they are allowed to see it!
            if (uploadNav) uploadNav.style.display = 'flex';
        }

        // 3. Show the Admin Terminal button if they are an admin
        const adminNav = document.getElementById('navAdminPanel');
        if (currentUserRole === 'admin') {
            if (adminNav) adminNav.style.display = 'flex';
        } else {
            if (adminNav) adminNav.style.display = 'none';
        }

        fetchTracks();
        fetchPlaylists();
    }, 600);
}

async function updatePassword() {
    const btn = document.querySelector('#changePasswordModal .btn-save');

    if (document.getElementById('newPassword').value.length < 6) {
        return alert("Password must be at least 6 characters.");
    }
    if (document.getElementById('newPassword').value !== document.getElementById('confirmPassword').value) {
        return alert("Passwords do not match.");
    }

    btn.innerText = "UPDATING...";
    try {
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, currentUserId, {
            password: document.getElementById('newPassword').value,
            forceChange: false
        });

        document.getElementById('changePasswordModal').classList.add('hidden');
        grantAccess();
    } catch (error) {
        alert("Error updating security: " + error.message);
        btn.innerText = "Update Security";
    }
}