// Tiny API client for the LE FIL front-end. No framework — just fetch.
const API = '/api/v1';
const TOKEN_KEY = 'lefil.token';
const USER_KEY = 'lefil.user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch (_error) {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function isAdmin() {
  const user = getUser();
  return Boolean(user && (user.role === 'ADMIN' || (user.roles || []).includes('ADMIN')));
}

// Core request. Throws an Error with .status and .details on failure.
export async function request(path, { method = 'GET', body, form, auth = true } = {}) {
  const headers = {};
  const token = getToken();
  if (auth && token) headers.Authorization = 'Bearer ' + token;

  let payload;
  if (form) {
    payload = form; // FormData — let the browser set the boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(API + path, { method, headers, body: payload });

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch (_error) {
    /* no body */
  }

  if (!response.ok) {
    const error = new Error((data && data.message) || 'Request failed');
    error.status = response.status;
    error.details = data && data.details;
    throw error;
  }

  return data;
}

export const api = {
  // auth
  login: (identifier, password) =>
    request('/auth/login', { method: 'POST', body: { identifier, password }, auth: false }),
  register: (username, email, password) =>
    request('/auth/register', { method: 'POST', body: { username, email, password }, auth: false }),

  // topics
  listTopics: (query = '') => request('/topics' + query),
  getTopic: (id) => request('/topics/' + id),
  createTopic: (payload) => request('/topics', { method: 'POST', body: payload }),
  updateTopic: (id, payload) => request('/topics/' + id, { method: 'PUT', body: payload }),
  deleteTopic: (id) => request('/topics/' + id, { method: 'DELETE' }),
  listTags: () => request('/tags'),

  // messages
  listMessages: (topicId, query = '') => request('/topics/' + topicId + '/messages' + query),
  postMessage: (topicId, form) => request('/topics/' + topicId + '/messages', { method: 'POST', form }),
  deleteMessage: (id) => request('/messages/' + id, { method: 'DELETE' }),
  like: (id) => request('/messages/' + id + '/like', { method: 'POST' }),
  dislike: (id) => request('/messages/' + id + '/dislike', { method: 'POST' }),

  // profiles + friends
  me: () => request('/profiles/me'),
  updateMe: (payload) => request('/profiles/me', { method: 'PUT', body: payload }),
  profile: (username) => request('/profiles/' + encodeURIComponent(username)),
  myFriends: () => request('/profiles/me/friends'),
  friendRequests: () => request('/profiles/me/friend-requests'),
  addFriend: (username) => request('/profiles/friend-requests', { method: 'POST', body: { username } }),
  acceptFriend: (id) => request('/profiles/friend-requests/' + id + '/accept', { method: 'POST' }),
  declineFriend: (id) => request('/profiles/friend-requests/' + id + '/decline', { method: 'POST' }),

  // admin
  adminUsers: () => request('/admin/users'),
  adminBan: (id, banned) => request('/admin/users/' + id + '/ban', { method: 'POST', body: { banned } }),
  adminTopicState: (id, state) =>
    request('/admin/topics/' + id + '/state', { method: 'PATCH', body: { state } }),
  adminDeleteTopic: (id) => request('/admin/topics/' + id, { method: 'DELETE' }),
  adminDeleteMessage: (id) => request('/admin/messages/' + id, { method: 'DELETE' })
};
