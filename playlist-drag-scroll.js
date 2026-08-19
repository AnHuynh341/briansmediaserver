// ==========================================================
// W41IT playlist drag auto-scroll
// ==========================================================
// The native HTML drag/drop API does not automatically scroll the playlist
// sorter. Keep the scrollable list moving while a dragged row is held near the
// top or bottom edge, and preserve the viewport when a drop re-renders rows.

(() => {
    const EDGE_ZONE_PX = 78;
    const MAX_SCROLL_PX_PER_FRAME = 18;

    let dragPointerY = null;
    let dragScrollFrame = null;
    let preserveScrollOnNextRender = false;

    function getSortModal() {
        return document.getElementById('sortPlaylistModal');
    }

    function getSortList() {
        return document.getElementById('sortPlaylistList');
    }

    function isSortDragActive() {
        const modal = getSortModal();
        return Boolean(
            draggedPlaylistTrackId
            && modal
            && !modal.classList.contains('hidden')
        );
    }

    function stopPlaylistDragAutoScroll() {
        dragPointerY = null;

        if (dragScrollFrame !== null) {
            cancelAnimationFrame(dragScrollFrame);
            dragScrollFrame = null;
        }

        const list = getSortList();
        list?.classList.remove('drag-scroll-up', 'drag-scroll-down');
    }

    function calculateScrollSpeed(list, pointerY) {
        const rect = list.getBoundingClientRect();
        const edgeZone = Math.min(EDGE_ZONE_PX, Math.max(42, rect.height * 0.24));

        if (pointerY < rect.top + edgeZone) {
            const strength = Math.min(1, Math.max(0, (rect.top + edgeZone - pointerY) / edgeZone));
            return -Math.max(2, Math.ceil(MAX_SCROLL_PX_PER_FRAME * strength));
        }

        if (pointerY > rect.bottom - edgeZone) {
            const strength = Math.min(1, Math.max(0, (pointerY - (rect.bottom - edgeZone)) / edgeZone));
            return Math.max(2, Math.ceil(MAX_SCROLL_PX_PER_FRAME * strength));
        }

        return 0;
    }

    function runPlaylistDragAutoScroll() {
        dragScrollFrame = null;

        if (!isSortDragActive() || dragPointerY === null) {
            stopPlaylistDragAutoScroll();
            return;
        }

        const list = getSortList();
        if (!list) {
            stopPlaylistDragAutoScroll();
            return;
        }

        const speed = calculateScrollSpeed(list, dragPointerY);
        const canScrollUp = list.scrollTop > 0;
        const canScrollDown = list.scrollTop + list.clientHeight < list.scrollHeight - 1;
        const shouldScroll = (speed < 0 && canScrollUp) || (speed > 0 && canScrollDown);

        list.classList.toggle('drag-scroll-up', speed < 0 && canScrollUp);
        list.classList.toggle('drag-scroll-down', speed > 0 && canScrollDown);

        if (shouldScroll) {
            list.scrollTop += speed;
        }

        // Keep the loop alive while the pointer is held at an edge. This is the
        // important bit: the list continues moving even when the mouse itself is
        // stationary during a long drag.
        dragScrollFrame = requestAnimationFrame(runPlaylistDragAutoScroll);
    }

    function updatePlaylistDragPointer(event) {
        if (!isSortDragActive()) return;

        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';

        dragPointerY = event.clientY;
        if (dragScrollFrame === null) {
            dragScrollFrame = requestAnimationFrame(runPlaylistDragAutoScroll);
        }
    }

    function installScrollEdgeStyles() {
        if (document.getElementById('w41it-playlist-drag-scroll-style')) return;

        const style = document.createElement('style');
        style.id = 'w41it-playlist-drag-scroll-style';
        style.textContent = `
          #sortPlaylistList{position:relative;scroll-behavior:auto}
          #sortPlaylistList.drag-scroll-up{
            box-shadow:inset 0 18px 22px -20px rgba(103,232,249,.75)
          }
          #sortPlaylistList.drag-scroll-down{
            box-shadow:inset 0 -18px 22px -20px rgba(103,232,249,.75)
          }
          #sortPlaylistList.drag-scroll-up.drag-scroll-down{
            box-shadow:inset 0 18px 22px -20px rgba(103,232,249,.75),inset 0 -18px 22px -20px rgba(103,232,249,.75)
          }
        `;
        document.head.appendChild(style);
    }

    function patchPlaylistSorter() {
        if (
            typeof renderSortPlaylistList !== 'function'
            || typeof handlePlaylistDrop !== 'function'
            || typeof handlePlaylistDragEnd !== 'function'
            || typeof openSortPlaylistModal !== 'function'
            || typeof closeSortPlaylistModal !== 'function'
        ) {
            console.warn('Playlist drag auto-scroll could not attach: sorter functions are unavailable.');
            return;
        }

        if (renderSortPlaylistList.__w41itDragScrollPatched) return;

        const originalRender = renderSortPlaylistList;
        renderSortPlaylistList = function (...args) {
            const list = getSortList();
            const savedScrollTop = preserveScrollOnNextRender && list
                ? list.scrollTop
                : null;

            const result = originalRender.apply(this, args);

            if (savedScrollTop !== null) {
                const refreshedList = getSortList();
                if (refreshedList) refreshedList.scrollTop = savedScrollTop;
            }

            return result;
        };
        renderSortPlaylistList.__w41itDragScrollPatched = true;

        const originalDrop = handlePlaylistDrop;
        handlePlaylistDrop = function (...args) {
            preserveScrollOnNextRender = true;
            stopPlaylistDragAutoScroll();

            try {
                return originalDrop.apply(this, args);
            } finally {
                preserveScrollOnNextRender = false;
            }
        };

        const originalDragEnd = handlePlaylistDragEnd;
        handlePlaylistDragEnd = function (...args) {
            stopPlaylistDragAutoScroll();
            return originalDragEnd.apply(this, args);
        };

        const originalOpen = openSortPlaylistModal;
        openSortPlaylistModal = function (...args) {
            stopPlaylistDragAutoScroll();
            const result = originalOpen.apply(this, args);
            const list = getSortList();
            if (list) list.scrollTop = 0;
            return result;
        };

        const originalClose = closeSortPlaylistModal;
        closeSortPlaylistModal = function (...args) {
            stopPlaylistDragAutoScroll();
            return originalClose.apply(this, args);
        };

        // Listen at document level rather than only on a row. That keeps scrolling
        // active when the cursor is over the empty edge of the list or the modal's
        // header/footer while the dragged row is trying to travel a long distance.
        document.addEventListener('dragover', updatePlaylistDragPointer);
        document.addEventListener('drop', stopPlaylistDragAutoScroll, true);
        document.addEventListener('dragend', stopPlaylistDragAutoScroll, true);
        window.addEventListener('blur', stopPlaylistDragAutoScroll);

        installScrollEdgeStyles();
    }

    patchPlaylistSorter();
})();
