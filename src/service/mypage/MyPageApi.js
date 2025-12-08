import axiosInstance from "../../server/AxiosConfig";

export const fetchPointInfo = () =>
  axiosInstance.get("/users/me/points", {
    headers: { "X-Skip-Auth-Redirect": "true" },
    _skipAuthRedirect: true,
  });

export const fetchMyProfile = () =>
  axiosInstance.get("/users/me", {
    headers: { "X-Skip-Auth-Redirect": "true" },
    _skipAuthRedirect: true,
  });
