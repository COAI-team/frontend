import {memo, useMemo} from "react";
import {ViewModeCardPropTypes} from "../../utils/propTypes";
import {UserCircleIcon} from "@heroicons/react/24/solid";

const ViewModeCard = ({profile, maskEmail, onEdit, subscriptionInfo}) => {
  // ✅ useMemo로 tone 클래스 메모이제이션
  const toneClass = useMemo(() => {
    const tone = subscriptionInfo?.tone;
    if (tone === "error") return "text-red-500";
    if (tone === "primary") return "text-indigo-600";
    return "text-gray-600";
  }, [subscriptionInfo?.tone]);

  // ✅ useMemo로 마스킹된 이메일 메모이제이션
  const maskedEmail = useMemo(() =>
      maskEmail(profile.email),
    [maskEmail, profile.email]
  );

  // ✅ useMemo로 구독 정보 텍스트 클래스명 메모이제이션
  const subscriptionTextClassName = useMemo(() =>
      `text-center text-sm mt-2 ${toneClass}`,
    [toneClass]
  );

            {/* 닉네임 추가 */}
            {profile.nickname && (
                <p className="text-center text-gray-500 text-lg mt-1">
                    {profile.nickname}
                </p>
            )}

            <div className="flex justify-center mt-3 gap-2 items-center">
                <span className="text-gray-600">{maskEmail(profile.email)}</span>
                <span className="text-green-600 text-sm font-medium">✔ 인증 완료</span>
            </div>

            {/* GitHub ID 추가 */}
            {profile.githubId && (
                <div className="flex justify-center mt-2 gap-2 items-center">
                    <span className="text-gray-800 font-medium flex items-center gap-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                             <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.04-.015-2.04-3.338.72-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.79 24 17.31 24 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        {profile.githubId}
                    </span>
                    {profile.hasGithubToken && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Pro</span>
                    )}
                </div>
            )}

            {subscriptionInfo?.text && (
                <p className={`text-center text-sm mt-2 ${toneClass}`}>
                    {subscriptionInfo.text}
                </p>
            )}

            <div className="flex justify-end mt-8">
                <button
                    onClick={onEdit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 cursor-pointer"
                >
                    수정
                </button>
            </div>
  return (
    <div className="border rounded-2xl p-10 shadow-sm">
      {/* 프로필 이미지 */}
      <div className="flex justify-center mb-6">
        <div
          className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          {profile.preview ? (
            <img
              src={profile.preview}
              className="w-full h-full object-cover"
              alt={`${profile.name}의 프로필 이미지`}
            />
          ) : (
            <UserCircleIcon
              className="w-28 h-28 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* 이름 */}
      <h2 className="text-2xl font-semibold text-center dark:text-gray-100">
        {profile.name}
      </h2>

      {/* 닉네임 */}
      {profile.nickname && (
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg mt-1">
          {profile.nickname}
        </p>
      )}

      {/* 이메일 */}
      <div className="flex justify-center mt-3 gap-2 items-center">
                <span className="text-gray-600 dark:text-gray-300">
                    {maskedEmail}
                </span>
        <output
          className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1"
          aria-label="이메일 인증 완료"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          인증 완료
        </output>
      </div>

      {/* GitHub ID */}
      {profile.githubId && (
        <div className="flex justify-center mt-2 gap-2 items-center">
                    <span className="text-gray-800 dark:text-gray-200 font-medium flex items-center gap-1">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                            <path
                              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.04-.015-2.04-3.338.72-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.79 24 17.31 24 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        <span className="sr-only">GitHub 아이디:</span>
                      {profile.githubId}
                    </span>
          {profile.hasGithubToken && (
            <output
              className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full inline-block"
              aria-label="Pro 토큰 설정됨"
            >
              Pro
            </output>
          )}
        </div>
      )}

      {/* 구독 정보 */}
      {subscriptionInfo?.text && (
        <div className="flex justify-center mt-4">
          <output
            className={`text-sm ${toneClass}`}  // text-center 제거, toneClass만 사용
            role={subscriptionInfo.tone === "error" ? "alert" : undefined}
            aria-live={subscriptionInfo.tone === "error" ? "assertive" : "polite"}
          >
            {subscriptionInfo.text}
          </output>
        </div>
      )}

      {/* 수정 버튼 */}
      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={onEdit}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="프로필 정보 수정"
        >
          수정
        </button>
      </div>
    </div>
  );
};

ViewModeCard.propTypes = ViewModeCardPropTypes;

export default memo(ViewModeCard);
