import { TripData } from './types';

export function setupRouter(tripData: TripData, onNavigate: (hash: string) => void) {
  function handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    
    // Highlight sidebar active item
    document.querySelectorAll('.day-item').forEach(el => el.classList.remove('active'));
    
    if (hash === 'hoy') {
      const hoyBanner = document.getElementById('hoy-banner-container');
      if (hoyBanner) {
        hoyBanner.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (hash) {
      const sideItem = document.getElementById(`side-item-${hash}`);
      if (sideItem) {
        sideItem.classList.add('active');
      }
    }

    if (hash) {
      onNavigate(hash);
    }
  }

  window.addEventListener('hashchange', handleHashChange);
}
