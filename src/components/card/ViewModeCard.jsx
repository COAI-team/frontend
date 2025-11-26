import { ViewModeCardPropTypes } from "../../utils/propTypes";
import { UserCircleIcon } from "@heroicons/react/24/solid";

export default function ViewModeCard({ profile, maskEmail, onEdit }) {
    return (
        <div className="border rounded-2xl p-10 shadow-sm">
            <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {profile.preview ? (
                        <img src={profile.preview} className="w-full h-full object-cover" alt="preview" />
                    ) : (
                        <UserCircleIcon className="w-28 h-28 text-gray-400" />
                    )}
                </div>
            </div>

            <h2 className="text-2xl font-semibold text-center">{profile.name}</h2>

            <div className="flex justify-center mt-3 gap-2 items-center">
                <span className="text-gray-600">{maskEmail(profile.email)}</span>
                <span className="text-green-600 text-sm font-medium">✔ 인증 완료</span>
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={onEdit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                >
                    수정
                </button>
            </div>
        </div>
    );
}

ViewModeCard.propTypes = ViewModeCardPropTypes;