import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../server/AxiosConfig";
import AlertModal from "../../components/modal/AlertModal";

export default function AdminOTP() {
  const navigate = useNavigate();

  const [otpEnabled, setOtpEnabled] = useState(null); // ⭐ 핵심
  const [otpData, setOtpData] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  /* ===============================
     1️⃣ OTP 상태 확인
  =============================== */
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axiosInstance.get("/api/otp/status");
        setOtpEnabled(res.data?.data?.enabled);
      } catch (e) {
        setError("OTP 상태를 불러오지 못했습니다.");
      }
    };
    fetchStatus();
  }, []);

  /* ===============================
     2️⃣ OTP 생성 (최초)
  =============================== */
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setOtpData(null);

      const res = await axiosInstance.post("/api/otp/generate");
      setOtpData(res.data?.data);
    } catch (e) {
      setError("OTP 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     3️⃣ OTP 재설정 (이미 활성화)
  =============================== */
  const handleReset = async () => {
    try {
      setLoading(true);
      setError("");
      setOtpData(null);

      const res = await axiosInstance.post("/api/otp/reset");
      setOtpData(res.data?.data);
    } catch (e) {
      setError("OTP 재설정 실패");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     4️⃣ OTP 검증
  =============================== */
  const handleVerify = async () => {
    try {
      setError("");
      const res = await axiosInstance.post("/api/otp/verify", null, {
        params: { code: otpCode },
      });

      if (res.data?.data?.success) {
        setAlertOpen(true);
      } else {
        setError("OTP 인증 실패");
      }
    } catch (e) {
      setError("OTP 인증 실패");
    }
  };

  /* ===============================
     QR 코드 URL
  =============================== */
  const qrUrl =
    otpData?.otpAuthUrl &&
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      otpData.otpAuthUrl
    )}`;

  /* ===============================
     렌더링
  =============================== */
  return (
    <div className="p-6 space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">관리자 OTP 설정</h1>

      {error && <p className="text-rose-500">{error}</p>}

      {/* 상태 로딩 */}
      {otpEnabled === null && <p>상태 확인 중...</p>}

      {/* OTP 버튼 영역 */}
      {otpEnabled === false && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          OTP 최초 설정
        </button>
      )}

      {otpEnabled === true && (
        <button
          onClick={handleReset}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 text-white rounded"
        >
          OTP 재설정 (QR 다시 받기)
        </button>
      )}

      {/* OTP 정보 */}
      {otpData && (
        <div className="border p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Secret</p>
            <p className="font-mono">{otpData.secret}</p>
          </div>

          {qrUrl && <img src={qrUrl} alt="QR" className="w-40 h-40" />}

          <div>
            <input
              value={otpCode}
              maxLength={6}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6자리 코드"
              className="border px-3 py-2 text-center"
            />
            <button
              onClick={handleVerify}
              disabled={otpCode.length !== 6}
              className="ml-2 px-4 py-2 bg-emerald-600 text-white rounded"
            >
              인증
            </button>
          </div>
        </div>
      )}

      <AlertModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={() => navigate("/admin/batch-stats")}
        type="success"
        title="OTP 인증 성공"
        message="관리자 인증이 완료되었습니다."
        confirmText="대시보드로 이동"
      />
    </div>
  );
}
