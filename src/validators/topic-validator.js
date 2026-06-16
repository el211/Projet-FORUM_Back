const { HttpError } = require('../errors/http-error');

const TOPIC_STATES = ['open', 'closed', 'archived'];
const TOPIC_VISIBILITIES = ['public', 'private'];

function normalizeTags(rawTags) {
  if (rawTags == null) {
    return [];
  }

  const list = Array.isArray(rawTags)
    ? rawTags
    : String(rawTags)
        .split(',')
        .map((tag) => tag.trim());

  const cleaned = list
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .filter((tag) => /^[a-z0-9-]{1,40}$/.test(tag));

  return [...new Set(cleaned)];
}

function validateTopicPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const errors = [];
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';

  if (!title || title.length < 3 || title.length > 180) {
    errors.push('Title must be between 3 and 180 characters');
  }

  if (!body || body.length < 1) {
    errors.push('Body is required');
  }

  const state = payload.state ? String(payload.state).toLowerCase() : 'open';
  if (!TOPIC_STATES.includes(state)) {
    errors.push(`State must be one of: ${TOPIC_STATES.join(', ')}`);
  }

  const visibility = payload.visibility ? String(payload.visibility).toLowerCase() : 'public';
  if (!TOPIC_VISIBILITIES.includes(visibility)) {
    errors.push(`Visibility must be one of: ${TOPIC_VISIBILITIES.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new HttpError(400, 'Validation failed', errors);
  }

  return { title, body, state, visibility, tags: normalizeTags(payload.tags) };
}

function validateState(rawState) {
  const state = String(rawState || '').toLowerCase();
  if (!TOPIC_STATES.includes(state)) {
    throw new HttpError(400, `State must be one of: ${TOPIC_STATES.join(', ')}`);
  }
  return state;
}

module.exports = {
  validateTopicPayload,
  validateState,
  normalizeTags,
  TOPIC_STATES,
  TOPIC_VISIBILITIES
};
