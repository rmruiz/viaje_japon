import { TripData, Day, Section, TripEvent } from './types';

export function getEventTypeIcon(type: string): string {
  switch (type.toUpperCase()) {
    case 'WALK': return '🚶';
    case 'TRAIN': return '🚇';
    case 'BUS': return '🚌';
    case 'TAXI': return '🚕';
    case 'VISIT': return '⛩️';
    case 'FOOD': return '🍜';
    case 'SHOP': return '🛍️';
    case 'HOTEL': return '🏨';
    case 'PHOTO': return '📸';
    case 'BREAK': return '☕';
    case 'FREE': return '🎮';
    case 'NOTE': return '📝';
    default: return '📍';
  }
}

export function getEventTypeClass(type: string): string {
  const t = type.toLowerCase();
  switch (t) {
    case 'walk': return 'type-walk';
    case 'train': return 'type-train';
    case 'bus': return 'type-bus';
    case 'taxi': return 'type-taxi';
    case 'visit': return 'type-visit';
    case 'food': return 'type-food';
    case 'shop': return 'type-shop';
    case 'hotel': return 'type-hotel';
    case 'photo': return 'type-photo';
    case 'break': return 'type-break';
    case 'free': return 'type-free';
    case 'note': return 'type-note';
    default: return 'type-visit';
  }
}

export function renderSidebar(tripData: TripData, container: HTMLElement, activeDayId: string) {
  let html = `
    <div class="sidebar-header">
      <span class="sidebar-title">Secciones y Días</span>
      <button class="btn-sidebar-collapse" id="btn-sidebar-collapse" title="Colapsar menú lateral hacia la izquierda" aria-label="Colapsar menú lateral">
        ◀
      </button>
    </div>
  `;

  tripData.sections.forEach((section) => {
    html += `
      <div class="section-group">
        <button class="section-header-btn" data-section="${section.id}">
          <span>${section.name}</span>
          <span class="section-badge">${section.days.length} días</span>
        </button>
        <ul class="day-list" id="list-${section.id}">
    `;

    section.days.forEach((day) => {
      const isActive = day.id === activeDayId ? 'active' : '';
      html += `
        <li class="day-item ${isActive}" id="side-item-${day.id}">
          <a href="#${day.id}">
            <span class="day-item-title">Día ${day.dayNumber}: ${day.title}</span>
            <span class="day-item-meta">
              <span>${day.dayOfWeek}</span>
              <span>${day.steps ? day.steps.toLocaleString('es-ES') + ' pasos' : ''}</span>
            </span>
          </a>
        </li>
      `;
    });

    html += `
        </ul>
      </div>
    `;
  });

  container.innerHTML = html;
}

export function renderHoyBanner(tripData: TripData, container: HTMLElement) {
  const now = new Date();
  const departureDate = new Date(tripData.config.departure);
  const returnDate = new Date(tripData.config.return);

  // Strip hours for pure date comparison
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const depZero = new Date(departureDate.getFullYear(), departureDate.getMonth(), departureDate.getDate());

  const diffTime = nowZero.getTime() - depZero.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1; // 1-indexed

  let matchedDay: Day | undefined;
  let statusText = '';

  if (diffDays <= 0) {
    matchedDay = tripData.allDays[0];
    const daysLeft = Math.abs(diffDays) + 1;
    statusText = `Faltan ${daysLeft} días para el inicio del viaje. Mostrando Día 1:`;
  } else if (diffDays > tripData.allDays.length) {
    matchedDay = tripData.allDays[tripData.allDays.length - 1];
    statusText = `¡El viaje ha finalizado! Mostrando el último día del itinerario:`;
  } else {
    matchedDay = tripData.allDays.find(d => d.dayNumber === diffDays) || tripData.allDays[0];
    statusText = `Hoy es el Día ${matchedDay.dayNumber} de tu itinerario en Japón:`;
  }

  if (!matchedDay) return;

  container.innerHTML = `
    <div class="hoy-banner">
      <div class="hoy-title-group">
        <h2>Vista Especial: Hoy en Japón</h2>
        <p>${statusText}</p>
      </div>
      <div class="hoy-stats">
        <div class="hoy-stat-box">
          <div class="hoy-stat-val">Día ${matchedDay.dayNumber}</div>
          <div class="hoy-stat-lbl">${matchedDay.dayOfWeek}</div>
        </div>
        <div class="hoy-stat-box">
          <div class="hoy-stat-val">${matchedDay.steps ? matchedDay.steps.toLocaleString('es-ES') : 0}</div>
          <div class="hoy-stat-lbl">Pasos est.</div>
        </div>
      </div>
    </div>
  `;
}

export function renderDayCard(day: Day, prevDay?: Day, nextDay?: Day, isExpanded: boolean = false): string {
  let notesHtml = '';
  if (day.notes && day.notes.length > 0) {
    day.notes.forEach(note => {
      notesHtml += `
        <div class="day-note-box">
          <span class="day-note-icon">📌</span>
          <div>${note.content.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    });
  }

  let eventsHtml = '';
  day.events.forEach(evt => {
    const icon = getEventTypeIcon(evt.type);
    const typeClass = getEventTypeClass(evt.type);

    let optionsHtml = '';
    if (evt.options && evt.options.length > 0) {
      optionsHtml += `<div class="event-options">`;
      evt.options.forEach(opt => {
        optionsHtml += `
          <div class="option-card">
            <div class="option-title">🍴 ${opt.title}</div>
            <div class="option-desc">${opt.description.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      });
      optionsHtml += `</div>`;
    }

    let linksHtml = '';
    if (evt.links && evt.links.length > 0) {
      linksHtml += `<div class="event-links">`;
      evt.links.forEach(link => {
        const isMap = link.url.includes('maps');
        linksHtml += `
          <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="${isMap ? 'btn-link map-trigger-btn' : 'btn-link'}" ${isMap ? `data-map-url="${encodeURIComponent(link.url)}"` : ''}>
            ${isMap ? '🗺️ Google Maps' : '🔗 ' + link.text}
          </a>
        `;
      });
      linksHtml += `</div>`;
    }

    const durationBadge = evt.mapUrl
      ? `<button class="event-duration map-duration-badge" data-map-url="${encodeURIComponent(evt.mapUrl)}" title="Haz clic para ver el mapa de este tramo en la columna derecha">🗺️ ${evt.duration}</button>`
      : `<span class="event-duration">${evt.duration}</span>`;

    eventsHtml += `
      <div class="timeline-event">
        <div class="event-marker ${typeClass}">${icon}</div>
        <div class="event-header">
          <div class="event-time-group">
            <span class="event-time">⏰ ${evt.time}</span>
            ${durationBadge}
          </div>
          <span class="event-type-badge ${typeClass}">${evt.type}</span>
        </div>
        <div class="event-desc">${evt.description}</div>
        ${optionsHtml}
        ${linksHtml}
      </div>
    `;
  });

  let imagesHtml = '';
  if (day.images && day.images.length > 0) {
    imagesHtml += `<div class="day-collapsed-images">`;
    day.images.forEach((imgSrc) => {
      imagesHtml += `
        <div class="day-thumb-wrapper">
          <img src="${imgSrc}" alt="${day.title}" class="day-thumb-img" onerror="this.onerror=null; this.parentElement.style.display='none';" />
        </div>
      `;
    });
    imagesHtml += `</div>`;
  }

  const prevBtn = prevDay
    ? `<a href="#${prevDay.id}" class="btn-nav-day" onclick="event.stopPropagation();">← Día ${prevDay.dayNumber}: ${prevDay.title}</a>`
    : `<div></div>`;

  const nextBtn = nextDay
    ? `<a href="#${nextDay.id}" class="btn-nav-day" onclick="event.stopPropagation();">Día ${nextDay.dayNumber}: ${nextDay.title} →</a>`
    : `<div></div>`;

  const collapsedClass = isExpanded ? '' : 'collapsed';

  return `
    <article class="day-card ${collapsedClass}" id="${day.id}" data-day-id="${day.id}">
      <div class="day-card-header day-toggle-btn" role="button" tabindex="0" title="Haz clic para expandir/colapsar">
        <div class="day-header-lines">
          <!-- Primera línea: Día X, Fecha -->
          <div class="day-header-line1">
            <span class="day-number-badge">Día ${day.dayNumber}</span>
            <span class="day-date-text">${day.dateFormatted}</span>
          </div>
          <!-- Segunda línea: Título y texto del resumen -->
          <div class="day-header-line2">
            <h3 class="day-title">${day.title}</h3>
            ${day.summary ? `<span class="day-header-summary"> — ${day.summary}</span>` : ''}
          </div>
          <!-- Fila de imágenes (se muestra solo cuando el día está colapsado) -->
          ${imagesHtml}
        </div>
        <div class="day-header-controls">
          ${day.steps ? `<div class="day-steps-badge">👟 ${day.steps.toLocaleString('es-ES')} pasos</div>` : ''}
          <span class="day-collapse-icon" aria-hidden="true">${isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      <div class="day-card-body">
        ${day.summary ? `<div class="day-summary-box"><strong>Resumen completo:</strong> ${day.summary}</div>` : ''}

        ${notesHtml}

        <div class="timeline-section-title">
          <span>⏱️ Itinerario y Cronograma</span>
        </div>

        <div class="timeline">
          ${eventsHtml}
        </div>

        <nav class="day-nav-footer">
          ${prevBtn}
          ${nextBtn}
        </nav>
      </div>
    </article>
  `;
}

export function renderMainContent(tripData: TripData, container: HTMLElement, filterQuery: string = '', expandedDayIds: Set<string> = new Set()) {
  let html = '';

  let filteredDays = tripData.allDays;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filteredDays = tripData.allDays.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.events.some(e => e.description.toLowerCase().includes(q) || (e.options && e.options.some(o => o.title.toLowerCase().includes(q))))
    );
  }

  if (filteredDays.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No se encontraron resultados</h3>
        <p>No se encontraron días o eventos que coincidan con "${filterQuery}".</p>
      </div>
    `;
    return;
  }

  let currentSectionId = '';

  filteredDays.forEach((day) => {
    const section = tripData.sections.find(s => s.id === day.sectionId);
    
    // Render section header card if entering a new section
    if (section && section.id !== currentSectionId && !filterQuery) {
      currentSectionId = section.id;
      html += `
        <div class="section-title-card" id="${section.id}">
          <h2>${section.title}</h2>
          <div class="section-info-row">
            ${section.hotel ? `<div class="section-info-item">🏨 <strong>Alojamiento:</strong> ${section.hotel}</div>` : ''}
          </div>
          ${section.summary ? `<p style="margin-top: 0.75rem; color: var(--text-muted);">${section.summary}</p>` : ''}
        </div>
      `;
    }

    const dayIndex = tripData.allDays.findIndex(d => d.id === day.id);
    const prevDay = dayIndex > 0 ? tripData.allDays[dayIndex - 1] : undefined;
    const nextDay = dayIndex < tripData.allDays.length - 1 ? tripData.allDays[dayIndex + 1] : undefined;

    // By default, if filterQuery is active, expand matching days so user sees search results immediately
    const isExpanded = filterQuery ? true : expandedDayIds.has(day.id);

    html += renderDayCard(day, prevDay, nextDay, isExpanded);
  });

  container.innerHTML = html;
}
