import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#FFAA4D] mt-12">
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col items-center gap-6">
        {/* Social Icons */}
        <div className="flex items-center gap-5">
          <a
            href="https://twitter.com/TronMarket"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1A1A1A] hover:text-[#2B80FF] transition-colors duration-200"
            aria-label="Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.29 20.251c7.547 0 11.675-6.243 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>

          <a
            href="https://www.facebook.com/TronMarket"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1A1A1A] hover:text-[#2B80FF] transition-colors duration-200"
            aria-label="Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.333v21.334C0 23.403.597 24 1.325 24h11.495v-9.294H9.691v-3.622h3.129V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.796.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.313h3.59l-.467 3.622h-3.123V24h6.116C23.403 24 24 23.403 24 22.667V1.333C24 .597 23.403 0 22.675 0z" />
            </svg>
          </a>

          <a
            href="https://www.instagram.com/TronMarket"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1A1A1A] hover:text-[#2B80FF] transition-colors duration-200"
            aria-label="Instagram"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <a
            href="/about"
            className="text-[#1A1A1A] hover:text-[#2B80FF] transition-colors duration-200"
          >
            About Us
          </a>
          <span className="text-[#1A1A1A]/30">|</span>
          <a
            href="/contact"
            className="text-[#1A1A1A] hover:text-[#2B80FF] transition-colors duration-200"
          >
            Contact Us
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-[#555555]">
          © {new Date().getFullYear()} TronMarket. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
