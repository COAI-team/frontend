import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-400 py-10">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h2 className="text-white font-bold text-xl">Minseok Choi</h2>
                    <p className="text-sm mt-1">Creating code with purpose and design with passion.</p>
                </div>

                <div className="flex space-x-6 text-2xl">
                    <a href="https://github.com" target="_blank" className="hover:text-white"><FaGithub /></a>
                    <a href="https://linkedin.com" target="_blank" className="hover:text-white"><FaLinkedin /></a>
                    <a href="mailto:minseok@example.com" className="hover:text-white"><FaEnvelope /></a>
                </div>
            </div>

            <div className="mt-6 border-t border-gray-700 pt-4 text-center text-sm">
                © {new Date().getFullYear()} Minseok Choi — All rights reserved.
            </div>
        </footer>
    );
}