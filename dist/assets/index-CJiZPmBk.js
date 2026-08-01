(function(){const l=document.createElement("link").relList;if(l&&l.supports&&l.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))c(a);new MutationObserver(a=>{for(const e of a)if(e.type==="childList")for(const s of e.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&c(s)}).observe(document,{childList:!0,subtree:!0});function d(a){const e={};return a.integrity&&(e.integrity=a.integrity),a.referrerPolicy&&(e.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?e.credentials="include":a.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function c(a){if(a.ep)return;a.ep=!0;const e=d(a);fetch(a.href,e)}})();const k=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],M=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];function x(t,l){const d=t.trim().split("-");if(d.length!==3)return{dateStr:t,formatted:t,weekday:""};const c=parseInt(d[0],10),a=parseInt(d[1],10)-1,e=parseInt(d[2],10),s=new Date(Date.UTC(c,a,e));s.setUTCDate(s.getUTCDate()+l);const n=s.getUTCFullYear(),r=String(s.getUTCMonth()+1).padStart(2,"0"),p=String(s.getUTCDate()).padStart(2,"0"),o=`${n}-${r}-${p}`,b=M[s.getUTCDay()],$=k[s.getUTCMonth()],y=`${b} ${s.getUTCDate()} de ${$.toLowerCase()} de ${n}`;return{dateStr:o,formatted:y,weekday:b}}function B(t){const l=/(https?:\/\/[^\s]+)/g,d=t.match(l);return d?d.filter(c=>!c.includes("google.com/maps")&&!c.includes("maps.app")&&!c.includes("maps.google.com")).map(c=>({text:"Ver enlace",url:c.trim()})):[]}function H(t){const l=t.trim();return l?l.startsWith("http://")||l.startsWith("https://")||l.startsWith("/")||l.startsWith("images/")||l.startsWith("assets/")?l:`images/${l}`:""}function P(t){const l=t.split(/\r?\n/),d={title:"Viaje a Japón",departure:"2026-02-15",return:"2026-03-15",timezone:"Asia/Tokyo",currency:"JPY"},c=[],a=[];let e=null,s=null,n=null,r=null,p=null,o="NONE",b=0;function $(){r&&n&&(r.title=r.title.trim(),r.description=r.description.trim(),n.options||(n.options=[]),n.options.push(r),r=null)}function y(){if($(),n&&s){let u=n.description.trim();const h=u.match(/(https?:\/\/(www\.)?(google\.com\/maps|maps\.app\.goo\.gl|maps\.google\.com)[^\s]+)/i);h&&(n.mapUrl=h[0],u=u.replace(h[0],"").trim()),n.description=u,n.links=B(u),s.events.push(n),n=null}}function v(){p&&s&&(p.content=p.content.trim(),p.content&&s.notes.push(p),p=null)}function C(){v(),y(),s&&(s.title=s.title.trim(),s.summary=s.summary.trim(),a.push(s),e&&e.days.push(s),s=null)}function m(){C(),e&&(e.title=e.title.trim(),e.hotel&&(e.hotel=e.hotel.trim()),e.summary&&(e.summary=e.summary.trim()),e.notes&&(e.notes=e.notes.trim()),c.push(e),e=null)}const f=/^(\d{1,2}:\d{2})\s*\|\s*(\d+[mh]?)\s*\|\s*([A-Z_]+)\s*\|(.*)$/;for(let u=0;u<l.length;u++){const h=l[u],i=h.trim();if(i.startsWith("@trip")){m(),o="TRIP";continue}if(i.startsWith("@section")){m(),o="SECTION";const g=i.replace(/^@section\s*/,"").trim()||"Sección";e={id:`section-${g.toLowerCase().replace(/[^a-z0-9]/g,"-")}`,name:g,title:g,days:[]};continue}if(i.startsWith("@day")){C(),o="DAY",b++;const g=b,{dateStr:w,formatted:S,weekday:L}=x(d.departure,g-1),D=e?e.id:"section-general",W=e?e.name:"General";s={id:`day-${g}`,dayNumber:g,dateStr:w,dateFormatted:S,dayOfWeek:L,title:`Día ${g}`,steps:0,summary:"",sectionId:D,sectionTitle:W,notes:[],events:[],images:[]};continue}if(i.startsWith("@note")){y(),v(),o="NOTE",p={content:""};continue}const E=i.match(f);if(E){y(),v(),o="EVENT";const[,g,w,S,L]=E;n={id:`evt-${s?s.id:"x"}-${s?s.events.length+1:u}`,time:g.padStart(5,"0"),duration:w,type:S.toUpperCase(),description:L.trim()?L.trim()+`
`:""};continue}if((o==="EVENT"||o==="OPTION")&&(i==="Option"||i==="Opción")){$(),o="OPTION",r={title:"",description:""};continue}if(o==="TRIP")i.startsWith("title:")?d.title=i.replace("title:","").trim():i.startsWith("departure:")?d.departure=i.replace("departure:","").trim():i.startsWith("return:")?d.return=i.replace("return:","").trim():i.startsWith("timezone:")?d.timezone=i.replace("timezone:","").trim():i.startsWith("currency:")&&(d.currency=i.replace("currency:","").trim());else if(o==="SECTION"&&e)i.startsWith("title:")?e.title=i.replace("title:","").trim():i.startsWith("hotel:")?e.hotel=i.replace("hotel:","").trim():i.startsWith("summary:")?e.summary=i.replace("summary:","").trim():i.startsWith("notes:")&&(e.notes=i.replace("notes:","").trim());else if(o==="DAY"&&s){if(i.startsWith("title:"))s.title=i.replace("title:","").trim();else if(i.startsWith("steps:"))s.steps=parseInt(i.replace("steps:","").trim(),10)||0;else if(i.startsWith("summary:"))s.summary=i.replace("summary:","").trim();else if(/^(image\d*|foto|fotos):/i.test(i)){const g=i.replace(/^(image\d*|foto|fotos):/i,"").trim();if(g){const w=H(g);s.images||(s.images=[]),s.images.push(w)}}}else o==="NOTE"&&p?p.content+=h+`
`:o==="OPTION"&&r?r.title?r.description+=h+`
`:r.title=i:o==="EVENT"&&n&&(n.description+=h+`
`)}return m(),a.forEach(u=>{const{dateStr:h,formatted:i,weekday:E}=x(d.departure,u.dayNumber-1);u.dateStr=h,u.dateFormatted=i,u.dayOfWeek=E}),{config:d,sections:c,allDays:a}}function R(t){switch(t.toUpperCase()){case"WALK":return"🚶";case"TRAIN":return"🚇";case"BUS":return"🚌";case"TAXI":return"🚕";case"VISIT":return"⛩️";case"FOOD":return"🍜";case"SHOP":return"🛍️";case"HOTEL":return"🏨";case"PHOTO":return"📸";case"BREAK":return"☕";case"FREE":return"🎮";case"NOTE":return"📝";default:return"📍"}}function A(t){switch(t.toLowerCase()){case"walk":return"type-walk";case"train":return"type-train";case"bus":return"type-bus";case"taxi":return"type-taxi";case"visit":return"type-visit";case"food":return"type-food";case"shop":return"type-shop";case"hotel":return"type-hotel";case"photo":return"type-photo";case"break":return"type-break";case"free":return"type-free";case"note":return"type-note";default:return"type-visit"}}function O(t,l,d){let c=`
    <div class="sidebar-header">
      <span class="sidebar-title">Secciones y Días</span>
      <button class="btn-sidebar-collapse" id="btn-sidebar-collapse" title="Colapsar menú lateral hacia la izquierda" aria-label="Colapsar menú lateral">
        ◀
      </button>
    </div>
  `;t.sections.forEach(a=>{c+=`
      <div class="section-group">
        <button class="section-header-btn" data-section="${a.id}">
          <span>${a.name}</span>
          <span class="section-badge">${a.days.length} días</span>
        </button>
        <ul class="day-list" id="list-${a.id}">
    `,a.days.forEach(e=>{const s=e.id===d?"active":"";c+=`
        <li class="day-item ${s}" id="side-item-${e.id}">
          <a href="#${e.id}">
            <span class="day-item-title">Día ${e.dayNumber}: ${e.title}</span>
            <span class="day-item-meta">
              <span>${e.dayOfWeek}</span>
              <span>${e.steps?e.steps.toLocaleString("es-ES")+" pasos":""}</span>
            </span>
          </a>
        </li>
      `}),c+=`
        </ul>
      </div>
    `}),l.innerHTML=c}function N(t,l){const d=new Date,c=new Date(t.config.departure);new Date(t.config.return);const a=new Date(d.getFullYear(),d.getMonth(),d.getDate()),e=new Date(c.getFullYear(),c.getMonth(),c.getDate()),s=a.getTime()-e.getTime(),n=Math.floor(s/(1e3*3600*24))+1;let r,p="";n<=0?(r=t.allDays[0],p=`Faltan ${Math.abs(n)+1} días para el inicio del viaje. Mostrando Día 1:`):n>t.allDays.length?(r=t.allDays[t.allDays.length-1],p="¡El viaje ha finalizado! Mostrando el último día del itinerario:"):(r=t.allDays.find(o=>o.dayNumber===n)||t.allDays[0],p=`Hoy es el Día ${r.dayNumber} de tu itinerario en Japón:`),r&&(l.innerHTML=`
    <div class="hoy-banner">
      <div class="hoy-title-group">
        <h2>Vista Especial: Hoy en Japón</h2>
        <p>${p}</p>
      </div>
      <div class="hoy-stats">
        <div class="hoy-stat-box">
          <div class="hoy-stat-val">Día ${r.dayNumber}</div>
          <div class="hoy-stat-lbl">${r.dayOfWeek}</div>
        </div>
        <div class="hoy-stat-box">
          <div class="hoy-stat-val">${r.steps?r.steps.toLocaleString("es-ES"):0}</div>
          <div class="hoy-stat-lbl">Pasos est.</div>
        </div>
      </div>
    </div>
  `)}function z(t,l,d,c=!1){let a="";t.notes&&t.notes.length>0&&t.notes.forEach(o=>{a+=`
        <div class="day-note-box">
          <span class="day-note-icon">📌</span>
          <div>${o.content.replace(/\n/g,"<br>")}</div>
        </div>
      `});let e="";t.events.forEach(o=>{const b=R(o.type),$=A(o.type);let y="";o.options&&o.options.length>0&&(y+='<div class="event-options">',o.options.forEach(m=>{y+=`
          <div class="option-card">
            <div class="option-title">🍴 ${m.title}</div>
            <div class="option-desc">${m.description.replace(/\n/g,"<br>")}</div>
          </div>
        `}),y+="</div>");let v="";o.links&&o.links.length>0&&(v+='<div class="event-links">',o.links.forEach(m=>{const f=m.url.includes("maps");v+=`
          <a href="${m.url}" target="_blank" rel="noopener noreferrer" class="${f?"btn-link map-trigger-btn":"btn-link"}" ${f?`data-map-url="${encodeURIComponent(m.url)}"`:""}>
            ${f?"🗺️ Google Maps":"🔗 "+m.text}
          </a>
        `}),v+="</div>");const C=o.mapUrl?`<button class="event-duration map-duration-badge" data-map-url="${encodeURIComponent(o.mapUrl)}" title="Haz clic para ver el mapa de este tramo en la columna derecha">🗺️ ${o.duration}</button>`:`<span class="event-duration">${o.duration}</span>`;e+=`
      <div class="timeline-event">
        <div class="event-marker ${$}">${b}</div>
        <div class="event-header">
          <div class="event-time-group">
            <span class="event-time">⏰ ${o.time}</span>
            ${C}
          </div>
          <span class="event-type-badge ${$}">${o.type}</span>
        </div>
        <div class="event-desc">${o.description}</div>
        ${y}
        ${v}
      </div>
    `});let s="";t.images&&t.images.length>0&&(s+='<div class="day-collapsed-images">',t.images.forEach(o=>{s+=`
        <div class="day-thumb-wrapper">
          <img src="${o}" alt="${t.title}" class="day-thumb-img" onerror="this.onerror=null; this.parentElement.style.display='none';" />
        </div>
      `}),s+="</div>");const n=l?`<a href="#${l.id}" class="btn-nav-day" onclick="event.stopPropagation();">← Día ${l.dayNumber}: ${l.title}</a>`:"<div></div>",r=d?`<a href="#${d.id}" class="btn-nav-day" onclick="event.stopPropagation();">Día ${d.dayNumber}: ${d.title} →</a>`:"<div></div>";return`
    <article class="day-card ${c?"":"collapsed"}" id="${t.id}" data-day-id="${t.id}">
      <div class="day-card-header day-toggle-btn" role="button" tabindex="0" title="Haz clic para expandir/colapsar">
        <div class="day-header-lines">
          <!-- Primera línea: Día X, Fecha -->
          <div class="day-header-line1">
            <span class="day-number-badge">Día ${t.dayNumber}</span>
            <span class="day-date-text">${t.dateFormatted}</span>
          </div>
          <!-- Segunda línea: Título y texto del resumen -->
          <div class="day-header-line2">
            <h3 class="day-title">${t.title}</h3>
            ${t.summary?`<span class="day-header-summary"> — ${t.summary}</span>`:""}
          </div>
          <!-- Fila de imágenes (se muestra solo cuando el día está colapsado) -->
          ${s}
        </div>
        <div class="day-header-controls">
          ${t.steps?`<div class="day-steps-badge">👟 ${t.steps.toLocaleString("es-ES")} pasos</div>`:""}
          <span class="day-collapse-icon" aria-hidden="true">${c?"▲":"▼"}</span>
        </div>
      </div>

      <div class="day-card-body">
        ${t.summary?`<div class="day-summary-box"><strong>Resumen completo:</strong> ${t.summary}</div>`:""}

        ${a}

        <div class="timeline-section-title">
          <span>⏱️ Itinerario y Cronograma</span>
        </div>

        <div class="timeline">
          ${e}
        </div>

        <nav class="day-nav-footer">
          ${n}
          ${r}
        </nav>
      </div>
    </article>
  `}function U(t,l,d="",c=new Set){let a="",e=t.allDays;if(d){const n=d.toLowerCase();e=t.allDays.filter(r=>r.title.toLowerCase().includes(n)||r.summary.toLowerCase().includes(n)||r.events.some(p=>p.description.toLowerCase().includes(n)||p.options&&p.options.some(o=>o.title.toLowerCase().includes(n))))}if(e.length===0){l.innerHTML=`
      <div class="empty-state">
        <h3>No se encontraron resultados</h3>
        <p>No se encontraron días o eventos que coincidan con "${d}".</p>
      </div>
    `;return}let s="";e.forEach(n=>{const r=t.sections.find(y=>y.id===n.sectionId);r&&r.id!==s&&!d&&(s=r.id,a+=`
        <div class="section-title-card" id="${r.id}">
          <h2>${r.title}</h2>
          <div class="section-info-row">
            ${r.hotel?`<div class="section-info-item">🏨 <strong>Alojamiento:</strong> ${r.hotel}</div>`:""}
          </div>
          ${r.summary?`<p style="margin-top: 0.75rem; color: var(--text-muted);">${r.summary}</p>`:""}
        </div>
      `);const p=t.allDays.findIndex(y=>y.id===n.id),o=p>0?t.allDays[p-1]:void 0,b=p<t.allDays.length-1?t.allDays[p+1]:void 0,$=d?!0:c.has(n.id);a+=z(n,o,b,$)}),l.innerHTML=a}function F(t,l){function d(){const c=window.location.hash.replace("#","");if(document.querySelectorAll(".day-item").forEach(a=>a.classList.remove("active")),c==="hoy"){const a=document.getElementById("hoy-banner-container");a&&a.scrollIntoView({behavior:"smooth"})}else if(c){const a=document.getElementById(`side-item-${c}`);a&&a.classList.add("active")}c&&l(c)}window.addEventListener("hashchange",d)}let I=null;const T=new Set;function V(t){try{const l=decodeURIComponent(t),c=new URL(l).pathname;if(c.includes("/dir/")){const a=c.indexOf("/dir/"),s=c.substring(a+5).split("/").filter(n=>n&&!n.startsWith("@")&&!n.startsWith("data="));if(s.length>=2){const n=decodeURIComponent(s[0]).replace(/\+/g," "),r=decodeURIComponent(s[1]).replace(/\+/g," ");return`https://maps.google.com/maps?saddr=${encodeURIComponent(n)}&daddr=${encodeURIComponent(r)}&output=embed`}else if(s.length===1){const n=decodeURIComponent(s[0]).replace(/\+/g," ");return`https://maps.google.com/maps?q=${encodeURIComponent(n)}&output=embed`}}if(c.includes("/place/")){const a=c.indexOf("/place/"),s=c.substring(a+7).split("/").filter(n=>n&&!n.startsWith("@")&&!n.startsWith("data="));if(s.length>=1){const n=decodeURIComponent(s[0]).replace(/\+/g," ");return`https://maps.google.com/maps?q=${encodeURIComponent(n)}&output=embed`}}}catch(l){console.warn("Error parsing Google Maps URL for embed:",l)}return`https://maps.google.com/maps?q=${encodeURIComponent(t)}&output=embed`}async function q(){const t=document.getElementById("sidebar-nav"),l=document.getElementById("main-content"),d=document.getElementById("hoy-banner-container"),c=document.getElementById("search-input"),a=document.getElementById("theme-toggle"),e=document.getElementById("btn-hoy"),s=document.getElementById("sidebar-toggle"),n=document.getElementById("sidebar"),r=document.getElementById("maps-iframe-container"),p=document.getElementById("maps-external-link");if(!(!t||!l||!d))try{let o=function(m){if(!r)return;const f=decodeURIComponent(m),u=V(f);if(r.innerHTML=`
        <iframe src="${u}" title="Vista Google Maps" loading="lazy" allowfullscreen></iframe>
      `,p&&(p.href=f,p.style.display="inline-flex"),window.innerWidth<=1050){const h=document.getElementById("maps-panel");h&&h.scrollIntoView({behavior:"smooth"})}},b=function(){const m=document.body.classList.toggle("sidebar-collapsed");localStorage.setItem("sidebarCollapsed",m?"true":"false")},$=function(m){T.add(m);const f=document.getElementById(m);if(f){f.classList.remove("collapsed");const u=f.querySelector(".day-collapse-icon");u&&(u.textContent="▲"),f.scrollIntoView({behavior:"smooth"})}};localStorage.getItem("sidebarCollapsed")==="true"&&document.body.classList.add("sidebar-collapsed");let v=await fetch("/viaje.txt");if(v.ok||(v=await fetch("./viaje.txt")),!v.ok)throw new Error(`No se pudo cargar el archivo viaje.txt (HTTP ${v.status})`);const C=await v.text();if(I=P(C),N(I,d),O(I,t,""),U(I,l,"",T),s&&s.addEventListener("click",()=>{window.innerWidth<=900?n&&n.classList.toggle("open"):b()}),l.addEventListener("click",m=>{const f=m.target,u=f.closest("[data-map-url]");if(u){m.stopPropagation();const i=u.getAttribute("data-map-url");i&&o(i);return}const h=f.closest(".day-toggle-btn");if(h){const i=h.closest(".day-card");if(!i)return;const E=i.getAttribute("data-day-id");if(!E)return;const g=i.querySelector(".day-collapse-icon");i.classList.contains("collapsed")?(i.classList.remove("collapsed"),T.add(E),g&&(g.textContent="▲")):(i.classList.add("collapsed"),T.delete(E),g&&(g.textContent="▼"))}}),F(I,m=>{I&&(O(I,t,m),m&&m.startsWith("day-")&&$(m))}),window.location.hash){const m=window.location.hash.replace("#","");m.startsWith("day-")&&setTimeout(()=>$(m),150)}if(c&&c.addEventListener("input",m=>{const f=m.target.value;I&&U(I,l,f,T)}),e&&e.addEventListener("click",()=>{window.location.hash="#hoy",I&&N(I,d)}),t.addEventListener("click",m=>{const f=m.target;if(f.closest("#btn-sidebar-collapse")){b(),n&&n.classList.remove("open");return}const h=f.closest(".section-header-btn");if(h){const i=h.getAttribute("data-section");if(i){const E=document.getElementById(`list-${i}`);E&&(E.style.display=E.style.display==="none"?"flex":"none")}return}f.closest(".day-item a")&&n&&n.classList.remove("open")}),a){let m=localStorage.getItem("theme")||"dark";document.documentElement.setAttribute("data-theme",m),a.textContent=m==="dark"?"☀️":"🌙",a.addEventListener("click",()=>{m=m==="dark"?"light":"dark",document.documentElement.setAttribute("data-theme",m),localStorage.setItem("theme",m),a.textContent=m==="dark"?"☀️":"🌙"})}}catch(o){console.error("Error al inicializar la aplicación:",o),l.innerHTML=`
      <div class="empty-state">
        <h3 style="color: #f43f5e;">⚠️ Error al cargar el viaje</h3>
        <p>${o.message}</p>
      </div>
    `}}document.addEventListener("DOMContentLoaded",q);
