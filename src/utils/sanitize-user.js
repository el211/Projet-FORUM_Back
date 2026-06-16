// Strips secret fields (password hash + salt) before sending a user to a client.
function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    roles: user.roles,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    banned: Boolean(user.banned),
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt
  };
}

// Public view of another user (no email).
function sanitizePublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt
  };
}

module.exports = {
  sanitizeUser,
  sanitizePublicUser
};
