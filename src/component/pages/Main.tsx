import React from "react";

export default function Main() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900">
            <section className="text-center p-8 rounded-2xl shadow-lg bg-white">
                <h1 className="text-4xl font-bold mb-4">Welcome to Main Page</h1>
                <p className="text-lg text-gray-600">
                    This is the main section of your application.
                </p>
                <button
                    className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    onClick={() => alert("You clicked the Main button!")}
                >
                    Get Started
                </button>
            </section>
        </main>
    );
}