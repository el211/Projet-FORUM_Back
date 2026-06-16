// Shared UI helpers: header, escaping, dates, toasts, signal meter.
import { isLoggedIn, isAdmin, getUser, clearSession } from './api.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function initials(name) {
  return String(name || '?').trim().slice(0, 2).toUpperCase();
}

export function avatar(user) {
  const url = user && user.avatarUrl;
  if (url) {
    return `<img class="avatar" src="${escapeHtml(url)}" alt="${escapeHtml(user.username)}">`;
  }
  return `<span class="avatar">${escapeHtml(initials(user && user.username))}</span>`;
}

export function stateBadge(state, visibility) {
  const labels = { open: 'Ouvert', closed: 'Fermé', archived: 'Archivé' };
  let html = `<span class="badge badge--${state}">${labels[state] || state}</span>`;
  if (visibility === 'private') {
    html += ' <span class="badge badge--private">Privé</span>';
  }
  return html;
}

// The signature: render a score as a 5-bar halftone signal meter.
export function signalMeter(score) {
  const lit = Math.max(0, Math.min(5, Math.round((score + 5) / 2)));
  let bars = '';
  for (let i = 0; i < 5; i += 1) {
    bars += `<i class="${i < lit ? 'lit' : ''}"></i>`;
  }
  return `<span class="signal" title="Signal : ${score}">${bars}</span>`;
}

let toastTimer = null;
export function toast(message) {
  let node = document.getElementById('toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'toast';
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
}

// Renders the sticky top bar into <header id="topbar">.
export function renderHeader(active = '') {
  const header = document.getElementById('topbar');
  if (!header) return;

  const user = getUser();
  const link = (href, key, label) =>
    `<a href="${href}"${active === key ? ' class="active"' : ''}>${label}</a>`;

  let right = '';
  if (isLoggedIn()) {
    right += link('/new-topic.html', 'new', 'Écrire');
    if (isAdmin()) right += link('/admin.html', 'admin', 'Dashboard');
    right += link('/profile.html', 'profile', '@' + escapeHtml(user.username));
    right += '<a href="#" id="logout-link">Déconnexion</a>';
  } else {
    right += link('/login.html', 'login', 'Connexion');
    right += link('/register.html', 'register', 'Rejoindre');
  }

  header.className = 'topbar';
  header.innerHTML = `
    <div class="wrap">
      <a class="brand" href="/">LE FIL</a>
      <nav class="nav">
        ${link('/', 'home', 'Forum')}
        ${right}
      </nav>
    </div>`;

  const logout = document.getElementById('logout-link');
  if (logout) {
    logout.addEventListener('click', (event) => {
      event.preventDefault();
      clearSession();
      window.location.href = '/';
    });
  }
}

// Redirects to login if not authenticated. Returns true when allowed.
export function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search);
    return false;
  }
  return true;
}

export function showError(container, message) {
  container.innerHTML = `<div class="alert alert--error">${escapeHtml(message)}</div>`;
}

export function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}
