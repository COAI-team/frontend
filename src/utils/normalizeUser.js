export const normalizeUser = (rawUser = {}, prevUser = {}) => {
    const u = typeof rawUser === "object" && rawUser !== null ? rawUser : {};

    return {
        ...prevUser,
        ...u,
        image:
            u.userImage ??
            u.image ??
            u.avatar_url ??
            prevUser.image ??
            null,
        nickname:
            u.userNickname ??
            u.nickname ??
            prevUser.nickname ??
            null,
        role:
            u.userRole ??
            u.role ??
            prevUser.role ??
            null,
    };
};
