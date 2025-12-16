import {UserCircleIcon} from "@heroicons/react/24/solid";
import {EditModeCardPropTypes} from "../../utils/propTypes";
import {HiOutlineCamera} from "react-icons/hi";
import {useState, useCallback, useMemo, memo} from "react";
import RuleItem from "../signup/RuleItem";
import {validateNameRules, validateNicknameRules} from "../../utils/validators";

const EditModeCard = ({
                        profile,
                        setProfile,
                        handleImageChange,
                        onCancel,
                        onSave,
                      }) => {
  const [focusName, setFocusName] = useState(false);
  const [focusNickname, setFocusNickname] = useState(false);

  // ✅ useMemo로 규칙 검사 메모이제이션
  const nameRules = useMemo(() =>
      validateNameRules(profile.name),
    [profile.name]
  );

  const nicknameRules = useMemo(() =>
      validateNicknameRules(profile.nickname),
    [profile.nickname]
  );

  // ✅ useMemo로 표시 조건 메모이제이션
  const showNameRules = useMemo(() =>
      focusName || profile.name.length > 0,
    [focusName, profile.name.length]
  );

  const showNicknameRules = useMemo(() =>
      focusNickname || profile.nickname.length > 0,
    [focusNickname, profile.nickname.length]
  );

  // ✅ useMemo로 유효성 검사 메모이제이션
  const isNameValid = useMemo(() =>
      nameRules.noSpaceSpecial,
    [nameRules.noSpaceSpecial]
  );

  const isNicknameValid = useMemo(() =>
      nicknameRules.hasValidLength && nicknameRules.isAllowedChars,
    [nicknameRules.hasValidLength, nicknameRules.isAllowedChars]
  );

  // ✅ useMemo로 저장 버튼 비활성화 상태 메모이제이션
  const isSaveDisabled = useMemo(() =>
      !isNameValid || !isNicknameValid,
    [isNameValid, isNicknameValid]
  );

  // ✅ useCallback으로 이벤트 핸들러 메모이제이션
  const handleNicknameChange = useCallback((e) => {
    const value = e.target.value;
    setProfile((prev) => ({...prev, nickname: value}));
  }, [setProfile]);

  const handleNameChange = useCallback((e) => {
    const value = e.target.value;
    setProfile((prev) => ({...prev, name: value}));
  }, [setProfile]);

  const handleGithubIdChange = useCallback((e) => {
    setProfile(prev => ({...prev, githubId: e.target.value}));
  }, [setProfile]);

  const handleGithubTokenChange = useCallback((e) => {
    setProfile(prev => ({...prev, githubToken: e.target.value}));
  }, [setProfile]);

  const handleNameFocus = useCallback(() => {
    setFocusName(true);
  }, []);

  const handleNameBlur = useCallback(() => {
    setFocusName(false);
  }, []);

  const handleNicknameFocus = useCallback(() => {
    setFocusNickname(true);
  }, []);

  const handleNicknameBlur = useCallback(() => {
    setFocusNickname(false);
  }, []);

  const openTokenPage = useCallback(() => {
    window.open('https://github.com/settings/tokens', '_blank');
  }, []);

  const handleSaveClick = useCallback(() => {
    onSave(isSaveDisabled);
  }, [onSave, isSaveDisabled]);

  // ✅ useMemo로 클래스명 메모이제이션
  const nameInputClassName = useMemo(() =>
      `mt-1 w-full border rounded-md px-4 py-2 
        ${!isNameValid && profile.name.length > 0 ? "border-red-500" : ""}`,
    [isNameValid, profile.name.length]
  );

  const nicknameInputClassName = useMemo(() =>
      `mt-1 w-full border rounded-md px-4 py-2 
        ${!isNicknameValid && profile.nickname.length > 0 ? "border-red-500" : ""}`,
    [isNicknameValid, profile.nickname.length]
  );

  const saveButtonClassName = useMemo(() =>
      `px-6 py-2 rounded-md text-white ${
        isNameValid && isNicknameValid
          ? "bg-blue-600 hover:bg-blue-500"
          : "bg-gray-400 cursor-not-allowed"
      }`,
    [isNameValid, isNicknameValid]
  );

  return (
    <div className="border rounded-2xl p-10 shadow-sm">

      {/* 프로필 이미지 */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <div
            className="w-full h-full rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {profile.preview ? (
              <img
                src={profile.preview}
                className="w-full h-full object-cover"
                alt="프로필 이미지"
              />
            ) : (
              <UserCircleIcon className="w-28 h-28 text-gray-400"/>
            )}
          </div>

          {/* 카메라 버튼 */}
          <label
            htmlFor="profile-upload"
            className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="프로필 이미지 변경"
          >
            <HiOutlineCamera className="w-6 h-6 text-gray-700 dark:text-gray-300"/>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              aria-label="프로필 이미지 파일 선택"
            />
          </label>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="space-y-6">

        {/* 이름 */}
        <div>
          <label
            htmlFor="name"
            className="text-sm font-medium text-gray-700 dark:text-gray-300">
            이름
          </label>
          <input
            id="name"
            type="text"
            className={nameInputClassName}
            value={profile.name}
            onFocus={handleNameFocus}
            onBlur={handleNameBlur}
            onChange={handleNameChange}
            aria-invalid={!isNameValid && profile.name.length > 0}
            aria-describedby={showNameRules ? "name-rules" : undefined}
          />

          {/* 이름 규칙 리스트 */}
          {showNameRules && (
            <ul id="name-rules" className="mt-2 text-xs space-y-1">
              <RuleItem
                ok={nameRules.noSpaceSpecial}
                text="공백과 특수문자를 사용할 수 없습니다."
              />
            </ul>
          )}
        </div>

        {/* 닉네임 */}
        <div>
          <label
            htmlFor="nickname"
            className="text-sm font-medium text-gray-700 dark:text-gray-300">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            className={nicknameInputClassName}
            value={profile.nickname}
            onFocus={handleNicknameFocus}
            onBlur={handleNicknameBlur}
            onChange={handleNicknameChange}
            aria-invalid={!isNicknameValid && profile.nickname.length > 0}
            aria-describedby={showNicknameRules ? "nickname-rules" : undefined}
          />

          {/* 닉네임 규칙 리스트 */}
          {showNicknameRules && (
            <ul id="nickname-rules" className="mt-2 text-xs space-y-1">
              <RuleItem
                ok={nicknameRules.hasValidLength}
                text="길이는 3~20자여야 합니다."
              />
              <RuleItem
                ok={nicknameRules.isAllowedChars}
                text="영문, 숫자, '_', '-'만 사용할 수 있습니다."
              />
            </ul>
          )}
        </div>

        {/* 이메일 */}
        <div>
          <label
            htmlFor="email"
            className="text-sm font-medium text-gray-700 dark:text-gray-300">
            이메일
          </label>
          <input
            id="email"
            type="email"
            className="mt-1 w-full border rounded-md px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            value={profile.email}
            readOnly
            aria-readonly="true"
          />
        </div>

        {/* GitHub ID */}
        <div>
          <label
            htmlFor="githubId"
            className="text-sm font-medium text-gray-700 dark:text-gray-300">
            GitHub ID
          </label>
          <input
            id="githubId"
            type="text"
            className="mt-1 w-full border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            value={profile.githubId || ""}
            placeholder="GitHub 아이디를 입력하세요"
            onChange={handleGithubIdChange}
          />
        </div>

        {/* GitHub Token */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="githubToken"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              GitHub Token
            </label>
            <button
              type="button"
              onClick={openTokenPage}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              토큰 발급받기
            </button>
          </div>
          <input
            id="githubToken"
            type="password"
            className="mt-1 w-full border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            value={profile.githubToken || ""}
            placeholder={profile.hasGithubToken ? "토큰이 저장되어 있습니다 (수정하려면 입력)" : "GitHub Personal Access Token (repo scope)"}
            onChange={handleGithubTokenChange}
            autoComplete="off"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            * Private Repository 접근 및 API 호출 제한 해제를 위해 필요합니다. (repo 권한 필요)
          </p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end mt-8 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
        >
          취소
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaveDisabled}
          className={saveButtonClassName}
          aria-disabled={isSaveDisabled}
        >
          저장
        </button>
      </div>
    </div>
  );
};

EditModeCard.propTypes = EditModeCardPropTypes;

export default memo(EditModeCard);
