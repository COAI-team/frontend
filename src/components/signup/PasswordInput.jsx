import {PasswordRuleItemPropTypes} from "../../utils/propTypes";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

export default function PasswordInput({
                                          label,
                                          id,
                                          value,
                                          onChange,
                                          onFocus,
                                          onBlur,
                                          show,
                                          setShow,
                                          placeholder,
                                      }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium dark:text-gray-100">
                {label}
            </label>

            <div className="relative">
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 pr-10
              text-gray-900 outline outline-gray-300
              focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                />

                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-500 dark:text-gray-300"
                >
                    {show ? <AiFillEyeInvisible /> : <AiFillEye />}
                </button>
            </div>
        </div>
    );
}

PasswordInput.propTypes = PasswordRuleItemPropTypes;