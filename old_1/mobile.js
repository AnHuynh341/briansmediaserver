// ==========================================
// MOBILE.JS — Sidebar & Responsive Helpers
// ==========================================

function openSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

/* Show/hide hamburger button based on viewport width */
function syncMenuBtn() {
  const show = window.innerWidth <= 600;
  document.getElementById('mobileMenuBtnTop').style.display = show ? 'flex' : 'none';
  document.getElementById('mobileMenuBtn').style.display = show ? 'flex' : 'none';
  if (!show) closeSidebar(); // auto-close if resized to desktop
}

window.addEventListener('resize', syncMenuBtn);
syncMenuBtn(); // run once on page load