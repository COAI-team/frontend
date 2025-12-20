import { UserCircleIcon } from "@heroicons/react/24/solid";
import { EditModeCardPropTypes } from "../../utils/propTypes";
import { HiOutlineCamera } from "react-icons/hi";
import { useState, useCallback, useMemo, memo } from "react";
import RuleItem from "../signup/RuleItem";
import { validateNameRules, validateNicknameRules } from "../../utils/validators";

const EditModeCard = ({
                        profile,
                        setProfile,
                        handleImageChange,
                        onCancel,
                        onSave,
                      }) => {
  const [focusName, setFocusName] = useState(false);
  const [focusNickname, setFocusNickname] = useState(false);

  /** 규칙 검사 */
  const nameRules = useMemo(
    () => validateNameRules(profile.name),
    [profile.name]
  );

  const nicknameRules = useMemo(
    () => validateNicknameRules(profile.nickname),
    [profile.nickname]
  );

  /** 규칙 표시 조건 */
  const showNameRules = useMemo(
    () => focusName && profile.name.length > 0,
    [focusName, profile.name.length]
  );

  const showNicknameRules = useMemo(
    () => focusNickname && profile.nickname.length > 0,
    [focusNickname, profile.nickname.length]
  );

  /** 유효성 검사 */
  const isNameValid = useMemo(
    () => nameRules.noSpaceSpecial,
    [nameRules.noSpaceSpecial]
  );

  const isNicknameValid = useMemo(() => {
    if (profile.nickname.length === 0) return true;
    return (
      nicknameRules.hasValidLength &&
      nicknameRules.isAllowedChars
    );
  }, [profile.nickname, nicknameRules]);

  /** 저장 버튼 상태 */
  const isSaveDisabled = useMemo(
    () => Boolean(!isNameValid || !isNicknameValid),
    [isNameValid, isNicknameValid]
  );

  /** 이벤트 핸들러 */
  const handleNameChange = useCallback((e) => {
    const value = e.target.value;
    console.log("이름 입력:", value);

    setProfile((prev) => ({
      ...prev,
      name: value.replaceAll(/\s+/g, " ").trim(),
    }));
  }, [setProfile]);


  const handleNicknameChange = useCallback((e) => {
    console.log("닉네임 입력:", e.target.value);

    setProfile((prev) => ({
      ...prev,
      nickname: e.target.value,
    }));
  }, [setProfile]);

  const handleGithubIdChange = useCallback(
    (e) => {
      setProfile((prev) => ({ ...prev, githubId: e.target.value }));
    },
    [setProfile]
  );

  const handleGithubTokenChange = useCallback(
    (e) => {
      setProfile((prev) => ({ ...prev, githubToken: e.target.value }));
    },
    [setProfile]
  );

  const openTokenPage = useCallback(() => {
    window.open("https://github.com/settings/tokens", "_blank");
  }, []);

  const handleSaveClick = useCallback(() => {
    console.log("저장 클릭");
    console.log("profile:", profile);
    console.log("isNameValid:", isNameValid);
    console.log("isNicknameValid:", isNicknameValid);

    if (!isSaveDisabled) {
      onSave();
    }
  }, [onSave, isSaveDisabled, profile, isNameValid, isNicknameValid]);

  /** 클래스명 */
  const nameInputClassName = useMemo(
    () =>
      `mt-1 w-full border rounded-md px-4 py-2 ${
        !isNameValid && profile.name.length > 0
          ? "border-red-500"
          : ""
      }`,
    [isNameValid, profile.name.length]
  );

  const nicknameInputClassName = useMemo(
    () =>
      `mt-1 w-full border rounded-md px-4 py-2 ${
        !isNicknameValid && profile.nickname.length > 0
          ? "border-red-500"
          : ""
      }`,
    [isNicknameValid, profile.nickname.length]
  );

  const saveButtonClassName = useMemo(
    () =>
      `px-6 py-2 rounded-md text-white ${
        isSaveDisabled
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-500"
      }`,
    [isSaveDisabled]
  );

  return (
    <div className="border rounded-2xl p-10 shadow-sm">
      {/* 프로필 이미지 */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {profile.preview ? (
              <img
                src={profile.preview}
                className="w-full h-full object-cover"
                alt="프로필 이미지"
              />
            ) : (
              <UserCircleIcon className="w-28 h-28 text-gray-400" />
            )}
          </div>

          <label
            htmlFor="profile-upload"
            className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center cursor-pointer"
          >
            <HiOutlineCamera className="w-6 h-6 text-gray-700" />
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
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
            className="text-sm font-medium">이름</label>
          <input
            type="text"
            className={nameInputClassName}
            value={profile.name}
            onFocus={() => setFocusName(true)}
            onBlur={() => setFocusName(false)}
            onChange={handleNameChange}
          />
          {showNameRules && (
            <ul className="mt-2 text-xs">
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
            className="text-sm font-medium">닉네임</label>
          <input
            type="text"
            className={nicknameInputClassName}
            value={profile.nickname}
            onFocus={() => setFocusNickname(true)}
            onBlur={() => setFocusNickname(false)}
            onChange={handleNicknameChange}
          />
          {showNicknameRules && (
            <ul className="mt-2 text-xs">
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
            className="text-sm font-medium">이메일</label>
          <input
            type="email"
            className="mt-1 w-full border rounded-md px-4 py-2 cursor-not-allowed"
            value={profile.email}
            readOnly
          />
        </div>

        {/* GitHub ID */}
        <div>
          <label
            htmlFor="githubId"
            className="text-sm font-medium">GitHub ID</label>
          <input
            type="text"
            className="mt-1 w-full border rounded-md px-4 py-2"
            value={profile.githubId || ""}
            onChange={handleGithubIdChange}
          />
        </div>

                {/* GitHub Token */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label
                            htmlFor="githubToken"
                            className="text-sm font-medium text-gray-700"
                        >
                            GitHub Token
                        </label>
                        <button
                            type="button"
                            onClick={() => window.open('https://github.com/settings/tokens', '_blank')}
                            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                            토큰 발급받기
                        </button>
                    </div>
                    <input
                        id="githubToken"
                        type="password"
                        className="mt-1 w-full border rounded-md px-4 py-2"
                        value={profile.githubToken || ""}
                        placeholder={profile.hasGithubToken ? "토큰이 저장되어 있습니다 (수정하려면 입력)" : "GitHub Personal Access Token (repo scope)"}
                        onChange={(e) => setProfile(prev => ({...prev, githubToken: e.target.value}))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        * Private Repository 접근 및 API 호출 제한 해제를 위해 필요합니다. (repo 권한 필요)
                    </p>
                </div>
            </div>
        

      {/* 버튼 */}
      <div className="flex justify-end mt-8 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded-md"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaveDisabled}
          className={saveButtonClassName}
        >
          저장
        </button>
      </div>
    </div>
  );
};

EditModeCard.propTypes = EditModeCardPropTypes;

export default memo(EditModeCard);
