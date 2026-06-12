import React from "react";
import { FaArrowLeft } from "react-icons/fa";

const NotFound = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 text-center">
      <h1>404 — Not Found</h1>
      <br />
      <p>Sorry, the page you are looking for does not exist.</p>
      <br />
      <a
        href="/"
        className="flex items-center gap-2 border-2 border-blue-400 rounded-md bg-black text-white px-3 py-2 cursor-pointer"
      >
        <FaArrowLeft /> Go back to Home
      </a>
    </main>
  );
};

export default NotFound;
