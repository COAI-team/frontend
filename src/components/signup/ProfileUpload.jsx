import { HiOutlineCamera } from "react-icons/hi";
import { ProfileUploadPropTypes } from "../../utils/propTypes";

export default function ProfileUpload({
                                          profilePreview,
                                          uploadBtn,
                                          setProfilePreview,
                                          setProfileFile,
                                      }) {
    return (
        <div className="flex justify-center mt-6">
            <div className="relative w-32 h-32">

                {/* 프로필 이미지 */}
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {profilePreview ? (
                        <img
                            src={profilePreview}
                            className="object-cover w-full h-full"
                            alt="profile-preview"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                            미리보기
                        </div>
                    )}
                </div>

                {/* 카메라 버튼 — EditModeCard 스타일 */}
                <label
                    htmlFor="profileImage"
                    className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-gray-800
                               rounded-full shadow flex items-center justify-center cursor-pointer hover:opacity-80"
                >
                    <HiOutlineCamera className="w-6 h-6 text-gray-700" />

                    <input
                        id="profileImage"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                setProfilePreview(URL.createObjectURL(file));
                                setProfileFile(file);
                            }
                        }}
                    />
                </label>

            </div>
        </div>
    );
}

ProfileUpload.propTypes = ProfileUploadPropTypes;