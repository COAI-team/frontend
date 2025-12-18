import {UserCircleIcon} from "@heroicons/react/24/solid";
import {EditModeCardPropTypes} from "../../utils/propTypes";
import {HiOutlineCamera} from "react-icons/hi";
import {useState} from "react";
import RuleItem from "../signup/RuleItem";
import {validateNameRules, validateNicknameRules} from "../../utils/validators";

export default function EditModeCard({
                                         profile,
                                         setProfile,
                                         handleImageChange,
                                         onCancel,
                                         onSave,
                                     }) {
    const [focusName, setFocusName] = useState(false);
    const [focusNickname, setFocusNickname] = useState(false);

    /** 이름 규칙 검사 */
    const nameRules = validateNameRules(profile.name);
    const showNameRules = focusName || profile.name.length > 0;
    const isNameValid = nameRules.noSpaceSpecial;

    /** 닉네임 규칙 검사 */
    const nicknameRules = validateNicknameRules(profile.nickname);
    const showNicknameRules = focusNickname || profile.nickname.length > 0;
    const isNicknameValid =
        nicknameRules.hasValidLength && nicknameRules.isAllowedChars;

    /** 닉네임 변경 */
    const handleNicknameChange = (e) => {
        const value = e.target.value;
        setProfile((prev) => ({...prev, nickname: value}));
    };

    /** 이름 변경 */
    const handleNameChange = (e) => {
        const value = e.target.value;
        setProfile((prev) => ({...prev, name: value}));
    };

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
                                alt="profile"
                            />
                        ) : (
                            <UserCircleIcon className="w-28 h-28 text-gray-400"/>
                        )}
                    </div>

                    {/* 카메라 버튼 */}
                    <label
                        htmlFor="profile-upload"
                        className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center cursor-pointer"
                    >
                        <HiOutlineCamera className="w-6 h-6 text-gray-700"/>
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
                        className="text-sm font-medium text-gray-700">이름</label>
                    <input
                        className={`mt-1 w-full border rounded-md px-4 py-2 
                            ${!isNameValid && profile.name.length > 0 ? "border-red-500" : ""}
                        `}
                        value={profile.name}
                        onFocus={() => setFocusName(true)}
                        onBlur={() => setFocusName(false)}
                        onChange={handleNameChange}
                    />

                    {/* 이름 규칙 리스트 */}
                    {showNameRules && (
                        <ul className="mt-2 text-xs space-y-1">
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
                        className="text-sm font-medium text-gray-700">닉네임</label>
                    <input
                        className={`mt-1 w-full border rounded-md px-4 py-2 
                            ${!isNicknameValid && profile.nickname.length > 0 ? "border-red-500" : ""}
                        `}
                        value={profile.nickname}
                        onFocus={() => setFocusNickname(true)}
                        onBlur={() => setFocusNickname(false)}
                        onChange={handleNicknameChange}
                    />

                    {/* 닉네임 규칙 리스트 */}
                    {showNicknameRules && (
                        <ul className="mt-2 text-xs space-y-1">
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
                        className="text-sm font-medium text-gray-700">이메일</label>
                    <input
                        className="mt-1 w-full border rounded-md px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                        value={profile.email}
                        readOnly
                    />
                </div>

                {/* GitHub ID */}
                <div>
                    <label
                        htmlFor="githubId"
                        className="text-sm font-medium text-gray-700">GitHub ID</label>
                    <input
                        id="githubId"
                        className="mt-1 w-full border rounded-md px-4 py-2"
                        value={profile.githubId || ""}
                        placeholder="GitHub 아이디를 입력하세요"
                        onChange={(e) => setProfile(prev => ({...prev, githubId: e.target.value}))}
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
                    onClick={onCancel}
                    className="px-6 py-2 border rounded-md hover:bg-gray-100 cursor-pointer"
                >
                    취소
                </button>

                <button
                    onClick={() => onSave(!isNameValid || !isNicknameValid)}
                    disabled={!isNameValid || !isNicknameValid}
                    className={`px-6 py-2 rounded-md text-white ${
                        isNameValid && isNicknameValid
                            ? "bg-blue-600 hover:bg-blue-500 cursor-pointer"
                            : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                    저장
                </button>
            </div>
        </div>
    );
}

EditModeCard.propTypes = EditModeCardPropTypes;