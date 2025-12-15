import { useContext } from "react";
import { LoginContext } from "./LoginContext.js";

export function useLogin() {
    return useContext(LoginContext);
}