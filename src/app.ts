import { parseTripData } from './parser';
import { renderSidebar, renderHoyBanner, renderMainContent } from './ui';
import { setupRouter } from './router';
import { TripData } from './types';

let globalTripData: TripData | null = null;
const expandedDayIds = new Set<string>(); // Starts empty = all days collapsed by default

function convertToEmbedUrl(rawUrl: string): string {
  try {
    const decodedUrl = decodeURIComponent(rawUrl);
    const urlObj = new URL(decodedUrl);
    const pathname = urlObj.pathname;

    // Handle /dir/Origin/Destination
    if (pathname.includes('/dir/')) {
      const dirIndex = pathname.indexOf('/dir/');
      const dirPart = pathname.substring(dirIndex + 5);
      const segments = dirPart.split('/').filter(s => s && !s.startsWith('@') && !s.startsWith('data='));

      if (segments.length >= 2) {
        const origin = decodeURIComponent(segments[0]).replace(/\+/g, ' ');
        const destination = decodeURIComponent(segments[1]).replace(/\+/g, ' ');
        return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&output=embed`;
      } else if (segments.length === 1) {
        const place = decodeURIComponent(segments[0]).replace(/\+/g, ' ');
        return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
      }
    }

    // Handle /place/Location
    if (pathname.includes('/place/')) {
      const placeIndex = pathname.indexOf('/place/');
      const placePart = pathname.substring(placeIndex + 7);
      const segments = placePart.split('/').filter(s => s && !s.startsWith('@') && !s.startsWith('data='));
      if (segments.length >= 1) {
        const place = decodeURIComponent(segments[0]).replace(/\+/g, ' ');
        return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
      }
    }
  } catch (err) {
    console.warn('Error parsing Google Maps URL for embed:', err);
  }

  // Fallback
  return `https://maps.google.com/maps?q=${encodeURIComponent(rawUrl)}&output=embed`;
}

async function initApp() {
  const sidebarNav = document.getElementById('sidebar-nav');
  const mainContent = document.getElementById('main-content');
  const hoyContainer = document.getElementById('hoy-banner-container');
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const themeToggle = document.getElementById('theme-toggle');
  const btnHoy = document.getElementById('btn-hoy');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  const mapsIframeContainer = document.getElementById('maps-iframe-container');
  const mapsExtLink = document.getElementById('maps-external-link') as HTMLAnchorElement;

  if (!sidebarNav || !mainContent || !hoyContainer) return;

  try {
    // Restore sidebar collapse preference
    const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (savedCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    }

    // Fetch viaje.txt from root
    let response = await fetch('/viaje.txt');
    if (!response.ok) {
      response = await fetch('./viaje.txt');
    }

    if (!response.ok) {
      throw new Error(`No se pudo cargar el archivo viaje.txt (HTTP ${response.status})`);
    }

    const rawText = await response.text();
    globalTripData = parseTripData(rawText);

    // Render Hoy Banner & Sidebar
    renderHoyBanner(globalTripData, hoyContainer);
    renderSidebar(globalTripData, sidebarNav, '');
    
    // All days start collapsed by default
    renderMainContent(globalTripData, mainContent, '', expandedDayIds);

    // Function to load Google Maps URL into right panel
    function loadMapUrl(rawUrl: string) {
      if (!mapsIframeContainer) return;
      const url = decodeURIComponent(rawUrl);

      // Convert Google Maps URL to embed route URL
      const embedUrl = convertToEmbedUrl(url);

      mapsIframeContainer.innerHTML = `
        <iframe src="${embedUrl}" title="Vista Google Maps" loading="lazy" allowfullscreen></iframe>
      `;

      if (mapsExtLink) {
        mapsExtLink.href = url;
        mapsExtLink.style.display = 'inline-flex';
      }

      if (window.innerWidth <= 1050) {
        const mapsPanel = document.getElementById('maps-panel');
        if (mapsPanel) {
          mapsPanel.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }

    // Function to toggle sidebar collapse state
    function toggleSidebarCollapsed() {
      const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
    }

    // Header Toggle Button Click
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          if (sidebar) sidebar.classList.toggle('open');
        } else {
          toggleSidebarCollapsed();
        }
      });
    }

    // Click Delegate for Main Content (Map Badges + Day Collapse)
    mainContent.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Check map duration badge or map link button click
      const mapBtn = target.closest('[data-map-url]') as HTMLElement;
      if (mapBtn) {
        e.stopPropagation(); // prevent day card toggle
        const mapUrl = mapBtn.getAttribute('data-map-url');
        if (mapUrl) {
          loadMapUrl(mapUrl);
        }
        return;
      }

      // Check day header toggle click
      const toggleBtn = target.closest('.day-toggle-btn') as HTMLElement;
      if (toggleBtn) {
        const card = toggleBtn.closest('.day-card') as HTMLElement;
        if (!card) return;

        const dayId = card.getAttribute('data-day-id');
        if (!dayId) return;

        const icon = card.querySelector('.day-collapse-icon');

        if (card.classList.contains('collapsed')) {
          card.classList.remove('collapsed');
          expandedDayIds.add(dayId);
          if (icon) icon.textContent = '▲';
        } else {
          card.classList.add('collapsed');
          expandedDayIds.delete(dayId);
          if (icon) icon.textContent = '▼';
        }
      }
    });

    // Helper to expand a day card in DOM
    function expandDayCard(dayId: string) {
      expandedDayIds.add(dayId);
      const card = document.getElementById(dayId);
      if (card) {
        card.classList.remove('collapsed');
        const icon = card.querySelector('.day-collapse-icon');
        if (icon) icon.textContent = '▲';
        card.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Setup Hash Router
    setupRouter(globalTripData, (hash) => {
      if (globalTripData) {
        renderSidebar(globalTripData, sidebarNav, hash);
        if (hash && hash.startsWith('day-')) {
          expandDayCard(hash);
        }
      }
    });

    // Handle initial hash if present
    if (window.location.hash) {
      const initialHash = window.location.hash.replace('#', '');
      if (initialHash.startsWith('day-')) {
        setTimeout(() => expandDayCard(initialHash), 150);
      }
    }

    // Setup Search Listener
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value;
        if (globalTripData) {
          renderMainContent(globalTripData, mainContent, query, expandedDayIds);
        }
      });
    }

    // Setup "Hoy" Button
    if (btnHoy) {
      btnHoy.addEventListener('click', () => {
        window.location.hash = '#hoy';
        if (globalTripData) {
          renderHoyBanner(globalTripData, hoyContainer);
        }
      });
    }

    // Setup Sidebar Click Delegation (Accordion & Close Button)
    sidebarNav.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Check collapse button in sidebar header
      const collapseBtn = target.closest('#btn-sidebar-collapse');
      if (collapseBtn) {
        toggleSidebarCollapsed();
        if (sidebar) sidebar.classList.remove('open');
        return;
      }

      // Check section header accordion
      const btn = target.closest('.section-header-btn') as HTMLElement;
      if (btn) {
        const sectionId = btn.getAttribute('data-section');
        if (sectionId) {
          const list = document.getElementById(`list-${sectionId}`);
          if (list) {
            list.style.display = list.style.display === 'none' ? 'flex' : 'none';
          }
        }
        return;
      }

      // Close mobile sidebar on day click
      if (target.closest('.day-item a') && sidebar) {
        sidebar.classList.remove('open');
      }
    });

    // Theme Toggle (Dark/Light)
    if (themeToggle) {
      let currentTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

      themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
      });
    }

  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    mainContent.innerHTML = `
      <div class="empty-state">
        <h3 style="color: #f43f5e;">⚠️ Error al cargar el viaje</h3>
        <p>${(error as Error).message}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', initApp);
