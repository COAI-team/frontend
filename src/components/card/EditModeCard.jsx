import { UserCircleIcon } from "@heroicons/react/24/solid";
import { EditModeCardPropTypes } from "../../utils/propTypes";
import { HiOutlineCamera } from "react-icons/hi";

export default function EditModeCard({
                                         profile,
                                         setProfile,
                                         handleImageChange,
                                         onCancel,
                                         onSave
                                     }) {
    return (
        <div className="border rounded-2xl p-10 shadow-sm">

            {/* 프로필 이미지 */}
            <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">

                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {profile.preview ? (
                            <img src={profile.preview} className="w-full h-full object-cover" alt="profile" />
                        ) : (
                            <UserCircleIcon className="w-28 h-28 text-gray-400" />
                        )}
                    </div>

                    {/* 카메라 버튼 */}
                    <label
                        htmlFor="profile-upload"
                        className="
                            absolute bottom-0 right-0
                            w-10 h-10
                            bg-white dark:bg-gray-800
                            rounded-full shadow
                            flex items-center justify-center
                            cursor-pointer
                        "
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

                <div>
                    <label
                        htmlFor="name"
                        className="text-sm font-medium text-gray-700">이름</label>
                    <input
                        className="mt-1 w-full border rounded-md px-4 py-2"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                </div>

                <div>
                    <label
                        htmlFor="nickname"
                        className="text-sm font-medium text-gray-700">닉네임</label>
                    <input
                        className="mt-1 w-full border rounded-md px-4 py-2"
                        value={profile.nickname}
                        onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                    />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700">이메일</label>
                    <input
                        className="mt-1 w-full border rounded-md px-4 py-2"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                </div>

            </div>

            {/* 버튼 */}
            <div className="flex justify-end mt-8 gap-3">
                <button
                    onClick={onCancel}
                    className="px-6 py-2 border rounded-md hover:bg-gray-100"
                >
                    취소
                </button>

                <button
                    onClick={onSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                >
                    저장
                </button>
            </div>

        </div>
    );
}
EditModeCard.propTypes = EditModeCardPropTypes;