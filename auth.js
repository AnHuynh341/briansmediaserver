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
            Appwrite.Query.equal("username", document.getElementById('username').value.trim())
        ]);

        if (response.documents.length === 0) throw new Error("User not found");

        const userDoc = response.documents[0];

        if (userDoc.password !== document.getElementById('password').value) {
            throw new Error("Invalid password");
        }

        // Set global user states
        currentUser = userDoc.username;
        currentUserRole = userDoc.role;
        currentUserId = userDoc.$id;
        currentUploadAccess = userDoc.uploadAccessUntil; // Can be string or null

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

        const uploadNav = document.getElementById('uploadNavBtn');
        const adminNav = document.getElementById('navAdminPanel');

        // Fixed timestamp check (handles string values)
        const isAccessValid = currentUploadAccess && 
                             (Date.now() < parseInt(currentUploadAccess));

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
        const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
            Appwrite.Query.limit(100)
        ]);

        listContainer.innerHTML = '';
        if (response.documents.length === 0) {
            listContainer.innerHTML = '<div style="padding: 15px; text-align: center; color: var(--text-sub);">No users found.</div>';
            return;
        }

        response.documents.forEach(user => {
            if (user.role === 'admin') return;

            const now = Date.now();
            const hasAccess = user.uploadAccessUntil && (now < parseInt(user.uploadAccessUntil));

            let statusBadge = hasAccess
                ? `<span style="color: var(--success); font-size: 0.75rem; background: rgba(0, 255, 136, 0.1); padding: 2px 6px; border-radius: 4px;"><i class="fas fa-check-circle"></i> ACTIVE</span>`
                : `<span style="color: #ff4d4d; font-size: 0.75rem; background: rgba(255, 77, 77, 0.1); padding: 2px 6px; border-radius: 4px;"><i class="fas fa-lock"></i> LOCKED</span>`;

            listContainer.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-weight: 600; color: white; font-size: 0.95rem;">@${user.username}</span>
                        ${statusBadge}
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="adminActionGrant('${user.$id}', 3)" 
                                style="background: var(--accent); color: black; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">
                            +3h 
                        </button>
                        <button onclick="adminActionRevoke('${user.$id}')" 
                                style="background: transparent; color: #ff4d4d; border: 1px solid #ff4d4d; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Failed to load users:", error);
        listContainer.innerHTML = '<div style="padding: 15px; text-align: center; color: #ff4d4d;">Failed to connect to database.</div>';
    }
}

// ==========================================
// ADMIN DATABASE ACTIONS (Fixed)
// ==========================================
async function adminActionGrant(targetUserId, hours) {
    try {
        const newTime = Date.now() + (hours * 60 * 60 * 1000);
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, targetUserId, {
            uploadAccessUntil: newTime.toString()   // Must be string
        });
       
        loadAdminUserList();
    } catch (error) {
        console.error("Grant Access Error:", error);
        alert("Failed to grant clearance.");
    }
}

async function adminActionRevoke(targetUserId) {
    try {
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, targetUserId, {
            uploadAccessUntil: null
        });
       
        loadAdminUserList();
    } catch (error) {
        console.error("Revoke Access Error:", error);
        alert("Failed to revoke clearance.");
    }
}
