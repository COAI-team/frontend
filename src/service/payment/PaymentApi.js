import axiosInstance from "../../server/AxiosConfig";

export const fetchPaymentHistory = ({ from, to } = {}) =>
  axiosInstance.get("/payments/history", {
    params: {
      from: from || undefined,
      to: to || undefined,
    },
    headers: { "X-Skip-Auth-Redirect": "true" },
    _skipAuthRedirect: true,
  });

export const cancelPayment = ({ paymentKey, cancelReason }) =>
  axiosInstance.post(
    "/payments/cancel",
    null,
    {
      params: { paymentKey, cancelReason },
      headers: { "X-Skip-Auth-Redirect": "true" },
      _skipAuthRedirect: true,
    }
  );

export const fetchUpgradeQuote = (planCode) =>
  axiosInstance.get("/payments/upgrade-quote", {
    params: { planCode },
  });

export const readyPayment = (payload) => axiosInstance.post("/payments/ready", payload);

export const confirmPayment = (payload) => axiosInstance.post("/payments/confirm", payload);

export const fetchSubscriptions = () =>
  axiosInstance.get("/payments/subscriptions/me", {
    headers: { "X-Skip-Auth-Redirect": "true" },
    _skipAuthRedirect: true,
  });
