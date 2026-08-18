// ==========================================================
// W41IT TablesDB browser adapter
// ==========================================================
// Keep the site's existing Appwrite 14 SDK for audio/auth, but talk to the
// current TablesDB REST API directly. This avoids loading a second Appwrite
// browser SDK into the same global namespace.

const VIDEO_APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const VIDEO_APPWRITE_PROJECT_ID = '6a0878e40013d0103042';
let videoCatalogAdminJwt = '';

async function videoTablesRequest(path, { method = 'GET', data = null, jwt = '' } = {}) {
    const headers = {
        'X-Appwrite-Project': VIDEO_APPWRITE_PROJECT_ID
    };

    if (data !== null) headers['Content-Type'] = 'application/json';
    if (jwt) headers['X-Appwrite-JWT'] = jwt;

    const response = await fetch(`${VIDEO_APPWRITE_ENDPOINT}${path}`, {
        method,
        headers,
        body: data === null ? undefined : JSON.stringify(data),
        credentials: 'include'
    });

    const text = await response.text();
    let payload = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = text;
        }
    }

    if (!response.ok) {
        const message = payload && typeof payload === 'object'
            ? (payload.message || JSON.stringify(payload))
            : (payload || `${response.status} ${response.statusText}`);
        throw new Error(`Appwrite ${response.status}: ${message}`);
    }

    return payload;
}

videoTablesAccount = {
    async useCurrentSession() {
        const authUser = await account.get();

        if (!isVerifiedAdminAccount(authUser)) {
            videoCatalogAdminJwt = '';
            throw new Error('A verified W41IT administrator session is required.');
        }

        const token = await account.createJWT();
        videoCatalogAdminJwt = token?.jwt || '';

        if (!videoCatalogAdminJwt) {
            throw new Error('Appwrite admin session is active but no JWT was returned.');
        }

        return authUser;
    },

    async deleteSession({ sessionId }) {
        videoCatalogAdminJwt = '';
        return account.deleteSession(sessionId);
    },

    // Backward compatibility for an older cached video-catalog.js.
    async createEmailPasswordSession({ email, password }) {
        try {
            await account.deleteSession('current');
        } catch (_error) {
            // No current session.
        }

        const session = await account.createEmailPasswordSession(email, password);
        await this.useCurrentSession();
        return session;
    },

    async get() {
        return account.get();
    }
};

videoTablesDB = {
    async getRow({ databaseId, tableId, rowId }) {
        return videoTablesRequest(
            `/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(tableId)}/rows/${encodeURIComponent(rowId)}`
        );
    },

    async updateRow({ databaseId, tableId, rowId, data }) {
        // Appwrite JWTs are short lived. Refresh from the active verified admin
        // session before each write so there is no separate unlock step.
        await videoTablesAccount.useCurrentSession();

        return videoTablesRequest(
            `/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(tableId)}/rows/${encodeURIComponent(rowId)}`,
            {
                method: 'PUT',
                data,
                jwt: videoCatalogAdminJwt
            }
        );
    }
};
