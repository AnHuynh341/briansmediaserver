// ==========================================================
// W41IT verified-admin mobile layout fixes
// ==========================================================
// Keep inline edit/delete controls inside narrow phone layouts instead of
// letting the desktop action columns overflow beyond the viewport.

(() => {
    if (document.getElementById('w41it-admin-mobile-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'w41it-admin-mobile-fix-style';
    style.textContent = `
      @media (max-width: 760px) {
        /* --------------------------------------------------
           AUDIO TRACKS
           Collapse desktop metadata columns so the verified
           admin action buttons always remain tappable.
        -------------------------------------------------- */
        #trackList {
          max-width: 100%;
          overflow-x: hidden;
        }

        #trackList .track.admin-mode {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          grid-template-columns: 28px 42px minmax(0, 1fr) auto !important;
          column-gap: 8px !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
        }

        #trackList .track.admin-mode .track-artist,
        #trackList .track.admin-mode .track-added-time,
        #trackList .track.admin-mode .track-duration {
          display: none !important;
        }

        #trackList .track.admin-mode .track-title-cell {
          min-width: 0 !important;
          overflow: hidden;
        }

        #trackList .track.admin-mode .track-title,
        #trackList .track.admin-mode .mobile-track-artist {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        #trackList .track.admin-mode .track-action {
          position: static !important;
          width: auto !important;
          min-width: max-content !important;
          max-width: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          justify-self: end !important;
          gap: 3px !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          opacity: 1 !important;
          visibility: visible !important;
          transform: none !important;
        }

        #trackList .track.admin-mode .track-action button,
        #trackList .track.admin-mode .track-action .w41it-inline-admin-icon {
          flex: 0 0 30px !important;
          width: 30px !important;
          min-width: 30px !important;
          height: 30px !important;
          padding: 0 !important;
          margin: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* --------------------------------------------------
           VIDEO CARDS
           Keep the floating pencil/trash pair within the art.
        -------------------------------------------------- */
        .video-series-card,
        .video-youtube-card {
          min-width: 0 !important;
          position: relative !important;
        }

        .video-series-card > .w41it-inline-admin-actions,
        .video-youtube-card > .w41it-inline-admin-actions {
          position: absolute !important;
          top: 6px !important;
          right: 6px !important;
          left: auto !important;
          width: auto !important;
          max-width: calc(100% - 12px) !important;
          display: flex !important;
          gap: 4px !important;
          margin: 0 !important;
          padding: 3px !important;
          opacity: 1 !important;
          visibility: visible !important;
          transform: none !important;
          z-index: 30 !important;
        }

        .video-series-card > .w41it-inline-admin-actions .w41it-inline-admin-icon,
        .video-youtube-card > .w41it-inline-admin-actions .w41it-inline-admin-icon {
          flex: 0 0 32px !important;
          width: 32px !important;
          min-width: 32px !important;
          height: 32px !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* --------------------------------------------------
           EPISODE / VIDEO LIST
           Reserve a real action column instead of allowing it
           to disappear beyond the right edge of the panel.
        -------------------------------------------------- */
        .video-episode-row {
          width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          grid-template-columns: 58px 24px minmax(0, 1fr) 70px !important;
          gap: 7px !important;
          padding-left: 7px !important;
          padding-right: 7px !important;
          overflow: hidden !important;
        }

        .video-episode-row .video-episode-thumb {
          width: 58px !important;
          min-width: 58px !important;
        }

        .video-episode-row .video-episode-copy {
          min-width: 0 !important;
          overflow: hidden !important;
        }

        .video-episode-row .video-episode-copy strong,
        .video-episode-row .video-episode-copy span {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        .video-episode-row .video-episode-state {
          width: 70px !important;
          min-width: 70px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          overflow: visible !important;
        }

        .video-episode-row .video-episode-state .w41it-inline-admin-actions {
          width: 68px !important;
          min-width: 68px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 4px !important;
          margin: 0 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        .video-episode-row .video-episode-state .w41it-inline-admin-icon {
          flex: 0 0 32px !important;
          width: 32px !important;
          min-width: 32px !important;
          height: 32px !important;
        }

        /* --------------------------------------------------
           YOUTUBE CHANNEL HEADERS
           Let heading actions wrap below the title/count area.
        -------------------------------------------------- */
        .video-youtube-channel-heading,
        .video-youtube-channel-page-header {
          min-width: 0 !important;
          flex-wrap: wrap !important;
          align-items: flex-start !important;
        }

        .video-youtube-channel-actions {
          min-width: 0 !important;
          max-width: 100% !important;
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 6px !important;
        }

        .video-youtube-channel-actions .w41it-inline-admin-actions,
        .video-youtube-channel-page-header > .w41it-inline-admin-actions {
          display: flex !important;
          flex: 0 0 auto !important;
          gap: 4px !important;
          margin-left: auto !important;
          opacity: 1 !important;
          visibility: visible !important;
          transform: none !important;
        }

        /* --------------------------------------------------
           EDIT / DELETE SHEET
           Respect phone safe areas and keep the action bar in
           view when the keyboard or a long description appears.
        -------------------------------------------------- */
        .w41it-admin-editor-overlay {
          padding: 0 !important;
          align-items: flex-end !important;
        }

        .w41it-admin-editor {
          width: 100% !important;
          max-width: none !important;
          max-height: min(88dvh, 760px) !important;
          border-radius: 18px 18px 0 0 !important;
          padding-bottom: env(safe-area-inset-bottom, 0px) !important;
          overscroll-behavior: contain;
        }

        .w41it-admin-editor-actions {
          position: sticky !important;
          bottom: 0 !important;
          z-index: 4 !important;
          padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px)) !important;
          background: rgba(8, 11, 19, .96) !important;
          backdrop-filter: blur(12px) !important;
        }

        .w41it-admin-editor-actions button {
          min-height: 44px !important;
        }

        .w41it-admin-toast-stack {
          right: 10px !important;
          left: 10px !important;
          bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important;
        }

        .w41it-admin-toast {
          width: 100% !important;
          max-width: none !important;
          box-sizing: border-box !important;
        }
      }

      @media (max-width: 390px) {
        #trackList .track.admin-mode {
          grid-template-columns: 24px 38px minmax(0, 1fr) auto !important;
          column-gap: 6px !important;
          padding-left: 5px !important;
          padding-right: 5px !important;
        }

        #trackList .track.admin-mode .track-action button,
        #trackList .track.admin-mode .track-action .w41it-inline-admin-icon {
          flex-basis: 28px !important;
          width: 28px !important;
          min-width: 28px !important;
          height: 28px !important;
        }

        .video-episode-row {
          grid-template-columns: 52px 20px minmax(0, 1fr) 62px !important;
          gap: 5px !important;
          padding-left: 5px !important;
          padding-right: 5px !important;
        }

        .video-episode-row .video-episode-thumb {
          width: 52px !important;
          min-width: 52px !important;
        }

        .video-episode-row .video-episode-state {
          width: 62px !important;
          min-width: 62px !important;
        }

        .video-episode-row .video-episode-state .w41it-inline-admin-actions {
          width: 60px !important;
          min-width: 60px !important;
        }

        .video-episode-row .video-episode-state .w41it-inline-admin-icon {
          flex-basis: 28px !important;
          width: 28px !important;
          min-width: 28px !important;
          height: 28px !important;
        }
      }
    `;

    document.head.appendChild(style);
})();
