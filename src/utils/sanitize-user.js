function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles,
    createdAt: user.createdAt
  };
}

module.exports = {
  sanitizeUser
};

