import {RuleItemPropTypes} from "../../utils/propTypes";
export default function RuleItem({ ok, text }) {
    return (
        <li className={ok ? "text-green-500" : "text-red-500"}>
            {ok ? "✔" : "❌"} {text}
        </li>
    );
}

RuleItem.propTypes = RuleItemPropTypes;