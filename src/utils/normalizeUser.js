const FIELD_MAP = {
  image: ['userImage', 'image', 'avatar_url'],
  nickname: ['userNickname', 'nickname'],
  role: ['userRole', 'role']
};

const getFieldValue = (user, prevUser, field) => {
  const fields = FIELD_MAP[field];
  for (const key of fields) {
    if (user[key] !== undefined) return user[key];
  }
  return prevUser[field] ?? null;
};

export const normalizeUser = (rawUser = {}, prevUser = {}) => {
  const u = {...rawUser};

  return {
    ...prevUser,
    ...u,
    image: getFieldValue(u, prevUser, 'image'),
    nickname: getFieldValue(u, prevUser, 'nickname'),
    role: getFieldValue(u, prevUser, 'role'),
  };
};
