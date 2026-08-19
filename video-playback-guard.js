// ==========================================================
// W41IT video playback guard
// ==========================================================
// Chrome rejects a pending HTMLMediaElement.play() promise with AbortError if
// another action pauses/reloads the element before startup finishes. Slow/new
// R2 videos make that race easier to hit. Serialize play attempts, ignore the
// harmless AbortError, and surface real media failures separately.

(() => {
    let playAttempt = null;
    let playAttemptSource = '';
    let playAttemptStartedAt = 0;

    function videoElement() {
        return document.getElementById('videoPlayer');
    }

    function setStartingState(active) {
        const buttons = [
            document.getElementById('videoPlayBtn'),
            document.getElementById('videoStagePlayBtn')
        ].filter(Boolean);

        buttons.forEach(button => {
            button.classList.toggle('is-starting', active);
            button.setAttribute('aria-busy', active ? 'true' : 'false');
        });
    }

    function mediaErrorMessage(video) {
        const code = video?.error?.code;
        if (code === 1) return 'Video loading was aborted.';
        if (code === 2) return 'The video could not be downloaded.';
        if (code === 3) return 'The browser could not decode this video.';
        if (code === 4) return 'This video format or codec is not supported by the browser.';
        return 'The browser could not load this video.';
    }

    function installPlaybackDiagnostics() {
        const video = videoElement();
        if (!video || video.dataset.w41itPlaybackDiagnostics === 'true') return;
        video.dataset.w41itPlaybackDiagnostics = 'true';

        video.addEventListener('error', () => {
            console.error('W41IT video media error', {
                code: video.error?.code || 0,
                message: video.error?.message || '',
                currentSrc: video.currentSrc,
                networkState: video.networkState,
                readyState: video.readyState
            });
            if (typeof showVideoToast === 'function') {
                showVideoToast(mediaErrorMessage(video));
            }
        });
    }

    function installGuard() {
        if (typeof toggleVideoPlayback !== 'function' || toggleVideoPlayback.__w41itPlaybackGuarded) {
            installPlaybackDiagnostics();
            return;
        }

        const originalToggle = toggleVideoPlayback;

        const guardedToggle = async function () {
            const video = videoElement();
            if (!video) return;

            // Keep the existing no-source/demo behavior intact.
            if (!video.currentSrc) {
                return originalToggle.apply(this, arguments);
            }

            // If a play() request is already waiting for enough media to start,
            // don't turn a second impatient click into pause() and abort it.
            if (playAttempt) {
                const age = performance.now() - playAttemptStartedAt;
                if (age < 1800) return;
                try { await playAttempt; } catch (_error) { /* handled below */ }
                if (playAttempt) return;
            }

            if (!video.paused && !video.ended) {
                video.pause();
                if (typeof updateVideoPlaybackButtons === 'function') updateVideoPlaybackButtons();
                return;
            }

            const sourceAtStart = video.currentSrc;
            playAttemptSource = sourceAtStart;
            playAttemptStartedAt = performance.now();
            setStartingState(true);

            try {
                const attempt = video.play();
                playAttempt = attempt && typeof attempt.then === 'function' ? attempt : Promise.resolve();
                await playAttempt;
            } catch (error) {
                const sourceChanged = video.currentSrc !== sourceAtStart;
                const harmlessAbort = error?.name === 'AbortError' && (sourceChanged || video.paused);

                if (harmlessAbort) {
                    console.debug('Ignored interrupted video play request.', {
                        sourceAtStart,
                        currentSrc: video.currentSrc,
                        paused: video.paused
                    });
                } else {
                    console.warn('Video playback failed:', error);
                    if (typeof showVideoToast === 'function') {
                        showVideoToast(
                            error?.name === 'NotSupportedError'
                                ? 'This video codec is not supported by the browser.'
                                : 'The browser could not start this video source.'
                        );
                    }
                }
            } finally {
                if (playAttemptSource === sourceAtStart) {
                    playAttempt = null;
                    playAttemptSource = '';
                    playAttemptStartedAt = 0;
                    setStartingState(false);
                }
                if (typeof updateVideoPlaybackButtons === 'function') updateVideoPlaybackButtons();
            }
        };

        guardedToggle.__w41itPlaybackGuarded = true;
        guardedToggle.__w41itOriginal = originalToggle;
        toggleVideoPlayback = guardedToggle;

        installPlaybackDiagnostics();
    }

    function installStyles() {
        if (document.getElementById('w41it-video-playback-guard-style')) return;
        const style = document.createElement('style');
        style.id = 'w41it-video-playback-guard-style';
        style.textContent = `
          #videoPlayBtn.is-starting i,
          #videoStagePlayBtn.is-starting i{
            animation:w41it-video-starting-spin .8s linear infinite;
          }
          #videoPlayBtn.is-starting i::before,
          #videoStagePlayBtn.is-starting i::before{
            content:"\\f1ce";
          }
          @keyframes w41it-video-starting-spin{to{transform:rotate(360deg)}}
        `;
        document.head.appendChild(style);
    }

    installStyles();
    installGuard();
})();
