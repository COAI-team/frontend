import {useState} from "react";
import {InputRuleItemPropTypes} from "../../utils/propTypes";
import RuleItem from "./RuleItem";
import {validateNameRules, validateNicknameRules} from "../../utils/validators";

export default function InputField({label, id, value, onChange, ...rest}) {
    const [isFocused, setIsFocused] = useState(false);

    const showRules = isFocused || value.length > 0;

    const nameRules = id === "name" ? validateNameRules(value) : null;
    const nicknameRules = id === "nickname" ? validateNicknameRules(value) : null;

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium dark:text-gray-100">
                {label}
            </label>

            <input
                id={id}
                value={value}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={onChange}
                className="mt-2 block w-full rounded-md bg-white px-3 py-2
          text-gray-900 outline outline-gray-300
          focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                {...rest}
            />

            {/* 이름 규칙 */}
            { id === "name" && showRules && (
                <ul className="mt-2 text-xs space-y-1">
                    <RuleItem ok={nameRules.noSpaceSpecial} text="공백과 특수문자를 사용할 수 없습니다." />
                </ul>
            )}

            {/* 닉네임 규칙 */}
            {id === "nickname" && showRules && (
                <ul className="mt-2 text-xs space-y-1">
                    <RuleItem ok={nicknameRules.hasValidLength} text="길이는 3~20자여야 합니다."/>
                    <RuleItem ok={nicknameRules.isAllowedChars} text="영문, 숫자, '_', '-'만 가능합니다."/>
                </ul>
            )}
        </div>
    );
}

InputField.propTypes = InputRuleItemPropTypes;