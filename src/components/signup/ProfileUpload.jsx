import { useCallback, useMemo, memo, useEffect, useRef } from "react";
import { HiOutlineCamera } from "react-icons/hi";
import { ProfileUploadPropTypes } from "../../utils/propTypes";

const ProfileUpload = ({
                         profilePreview,
                         setProfilePreview,
                         setProfileFile,
                       }) => {
  // ✅ 이전 preview URL 추적 (메모리 누수 방지)
  const prevPreviewRef = useRef(null);

  // ✅ useCallback으로 파일 변경 핸들러 메모이제이션
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ 이전 preview URL 해제 (메모리 누수 방지)
    if (prevPreviewRef.current && prevPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(prevPreviewRef.current);
    }

    const newPreview = URL.createObjectURL(file);
    prevPreviewRef.current = newPreview;

    setProfilePreview(newPreview);
    setProfileFile(file);
  }, [setProfilePreview, setProfileFile]);

  // ✅ 컴포넌트 언마운트 시 메모리 정리
  useEffect(() => {
    return () => {
      if (prevPreviewRef.current && prevPreviewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreviewRef.current);
      }
    };
  }, []);

  // ✅ useMemo로 클래스명 메모이제이션
  const containerClassName = useMemo(() =>
      "w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center",
    []
  );

  const labelClassName = useMemo(() =>
      "absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2",
    []
  );

  return (
    <div className="flex justify-center mt-6">
      <div className="relative w-32 h-32">

        {/* 프로필 이미지 */}
        <div className={containerClassName}>
          {profilePreview ? (
            <img
              src={profilePreview}
              className="object-cover w-full h-full"
              alt="프로필 미리보기"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 text-sm">
              미리보기
            </div>
          )}
        </div>

        {/* 카메라 버튼 */}
        <label
          htmlFor="profileImage"
          className={labelClassName}
          aria-label="프로필 이미지 변경"
        >
          <HiOutlineCamera
            className="w-6 h-6 text-gray-700 dark:text-gray-300"
            aria-hidden="true"
          />

          <input
            id="profileImage"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label="프로필 이미지 파일 선택"
          />
        </label>

      </div>
    </div>
  );
};

ProfileUpload.propTypes = ProfileUploadPropTypes;

export default memo(ProfileUpload);
