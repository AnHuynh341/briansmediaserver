// ==========================================================
// W41IT TablesDB browser adapter
// ==========================================================
// Video metadata uses the Appwrite Web SDK's TablesDB service directly.
// The main site still has its older Appwrite SDK loaded in window.Appwrite,
// so the newer SDK is loaded into a temporary namespace and then restored.

const VIDEO_APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const VIDEO_APPWRITE_PROJECT_ID = '6a0878e40013d0103042';
const VIDEO_APPWRITE_SDK_SRC = 'https://cdn.jsdelivr.net/npm/appwrite@17.0.0';

let videoCatalogAdminJwt = '';
let videoTablesClient = null;
let videoTablesSdkAccount = null;
let videoTablesSdkDb = null;
let videoTablesSdkReady = null;

async function loadVideoTablesSdk() {
    if (videoTablesSdkDb && videoTablesAccount) return;
    if (videoTablesSdkReady) {
        await videoTablesSdkReady;
        return;
    }

    videoTablesSdkReady = (async () => {
        const legacyNamespace = window.Appwrite;
        let script = document.querySelector('script[data-w41it-video-tables-sdk]');

        if (!script) {
            script = document.createElement('script');
            script.src = VIDEO_APPWRITE_SDK_SRC;
            script.dataset.w41itVideoTablesSdk = 'true';
            script.async = false;

            await new Promise((resolve, reject) => {
                script.addEventListener('load', resolve, { once: true });
                script.addEventListener(
                    'error',
                    () => reject(new Error('Could not load Appwrite TablesDB SDK')),
                    { once: true }
                );
                document.head.appendChild(script);
            });
        } else if (!videoTablesClient || !videoTablesSdkAccount || !videoTablesSdkDb) {
            await new Promise((resolve, reject) => {
                if (window.Appwrite?.TablesDB && window.Appwrite?.Account) {
                    resolve();
                    return;
                }

                script.addEventListener('load', resolve, { once: true });
                script.addEventListener(
                    'error',
                    () => reject(new Error('Could not load Appwrite TablesDB SDK')),
                    { once: true }
                );
            });
        }

        try {
            const sdk = window.Appwrite;

            if (!sdk?.Client || !sdk?.TablesDB || !sdk?.Account) {
                throw new Error('Loaded Appwrite SDK does not expose TablesDB and Account.');
            }

            videoTablesClient = new sdk.Client()
                .setEndpoint(VIDEO_APPWRITE_ENDPOINT)
                .setProject(VIDEO_APPWRITE_PROJECT_ID);

            videoTablesSdkDb = new sdk.TablesDB(videoTablesClient);
            videoTablesSdkAccount = new sdk.Account(videoTablesClient);
            videoTablesAccount = {
                async useCurrentSession() {
                    const authUser = await videoTablesSdkAccount.get();

                    if (!isVerifiedAdminAccount(authUser)) {
                        videoCatalogAdminJwt = '';
                        throw new Error(
                            'A verified W41IT administrator session is required.'
                        );
                    }

                    const token = await videoTablesSdkAccount.createJWT();
                    videoCatalogAdminJwt = token?.jwt || '';

                    if (!videoCatalogAdminJwt) {
                        throw new Error(
                            'Appwrite admin session is active but no JWT was returned.'
                        );
                    }

                    return authUser;
                },

                async getAdminJwt() {
                    await this.useCurrentSession();
                    return videoCatalogAdminJwt;
                },

                async deleteSession({ sessionId }) {
                    videoCatalogAdminJwt = '';
                    return videoTablesSdkAccount.deleteSession(sessionId);
                },

                async createEmailPasswordSession({ email, password }) {
                    try {
                        await videoTablesSdkAccount.deleteSession('current');
                    } catch (_error) {
                        // No current session.
                    }

                    const session = await videoTablesSdkAccount.createEmailPasswordSession(
                        email,
                        password
                    );
                    await this.useCurrentSession();
                    return session;
                },

                async get() {
                    return videoTablesSdkAccount.get();
                }
            };
        } finally {
            // The rest of the site's legacy Appwrite code expects its original
            // namespace/version, so restore it after initializing TablesDB.
            window.Appwrite = legacyNamespace;
        }
    })();

    try {
        await videoTablesSdkReady;
    } catch (error) {
        videoTablesSdkReady = null;
        throw error;
    }
}

videoTablesDB = null;
videoTablesAccount = null;

const originalVideoTablesDB = {
    async getRow({ databaseId, tableId, rowId }) {
        await loadVideoTablesSdk();

        return videoTablesSdkDb.getRow({
            databaseId,
            tableId,
            rowId
        });
    },

    async updateRow({ databaseId, tableId, rowId, data }) {
        await loadVideoTablesSdk();

        // Use Appwrite's official Web SDK here so it sends the existing
        // browser session using the SDK's normal authentication path.
        return videoTablesSdkDb.updateRow({
            databaseId,
            tableId,
            rowId,
            data
        });
    }
};

// Keep the global names expected by video-catalog.js.
videoTablesDB = originalVideoTablesDB;
