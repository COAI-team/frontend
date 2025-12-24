import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../server/AxiosConfig";
import AlertModal from "../../components/modal/AlertModal";

export default function AdminOTP() {
  const [otpData, setOtpData] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const navigate = useNavigate();

  // OTP 시크릿 + QR 생성
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setVerifyResult(null);
      setOtpCode("");

      // ⚠️ 지금 백엔드 기준에 맞춰 경로 확인
      const res = await axiosInstance.post("/api/otp/generate");
      setOtpData(res.data?.data ?? null);
    } catch (err) {
      console.error("OTP 생성 실패:", err);
      setError("OTP를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // OTP 검증
  const handleVerify = async () => {
    try {
      setError("");
      setVerifyResult(null);

      const res = await axiosInstance.post("/api/otp/verify", null, {
        params: { code: otpCode }, // @RequestParam int code
      });

      const isSuccess = Boolean(res.data?.data?.success);
      setVerifyResult(isSuccess);
      if (isSuccess) {
        setAlertOpen(true);
      }
    } catch (err) {
      console.error("OTP 검증 실패:", err);
      setError("OTP 검증에 실패했습니다.");
    }
  };

  // QR 코드 이미지 URL
  const qrUrl =
    otpData?.otpAuthUrl &&
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      otpData.otpAuthUrl
    )}`;

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">관리자 OTP 설정</h1>
        <p className="text-gray-600 dark:text-gray-300">
          OTP 시크릿을 생성한 뒤 Google Authenticator 등에 등록하고 6자리 코드를
          입력해 검증하세요.
        </p>
      </div>

      {/* OTP 생성 버튼 */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className={`px-4 py-2 rounded-md font-semibold text-white ${
          loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-500"
        }`}
      >
        {loading ? "생성 중..." : "OTP 시크릿 생성"}
      </button>

      {error && <p className="text-rose-500 text-sm">{error}</p>}

      {/* OTP 정보 표시 */}
      {otpData && (
        <div className="rounded-lg border dark:border-gray-700 p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Secret</p>
            <p className="font-mono break-all text-lg">{otpData.secret}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">otpauth URL</p>
            <p className="font-mono break-all text-sm">{otpData.otpAuthUrl}</p>
          </div>

          {qrUrl && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">QR 코드로 등록</p>
              <img
                src={qrUrl}
                alt="OTP QR 코드"
                className="w-40 h-40 border dark:border-gray-700"
              />
            </div>
          )}

          {/* OTP 검증 영역 */}
          <div className="space-y-2 pt-4 border-t dark:border-gray-700">
            <label className="block text-sm text-gray-500">
              인증 앱의 6자리 코드
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-40 px-3 py-2 border rounded-md text-center text-lg tracking-widest"
            />

            <button
              type="button"
              onClick={handleVerify}
              disabled={otpCode.length !== 6}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 disabled:bg-gray-400"
            >
              OTP 검증
            </button>

            {verifyResult === true && (
              <p className="text-emerald-600 font-semibold">✅ OTP 인증 성공</p>
            )}

            {verifyResult === false && (
              <p className="text-rose-500 font-semibold">❌ OTP 인증 실패</p>
            )}
          </div>
        </div>
      )}

      <AlertModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={() => navigate("/admin/batch-stats")}
        type="success"
        title="인증 성공"
        message="인증에 성공했습니다."
        confirmText="대시보드로 이동"
      />
    </div>
  );
}
