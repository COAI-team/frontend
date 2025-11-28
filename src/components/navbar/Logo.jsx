import {Link} from "react-router-dom";
import { LogoPropTypes } from "../../utils/propTypes";

export default function Logo({theme}) {
    return (
        <Link to="/">
            <div
                className={`p-1.5 rounded-md transition-colors duration-300 ${
                    theme === "dark" ? "" : "bg-black"
                }`}
            >
                <img src="/Logo.png" alt="Logo" className="h-8 w-auto cursor-pointer"/>
            </div>
        </Link>
    );
}

Logo.propTypes = LogoPropTypes;