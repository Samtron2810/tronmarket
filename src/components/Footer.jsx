import React from "react";

const Footer = () => {
  return (
    <footer className="mt-12">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-secondary">
        © {new Date().getFullYear()} TronMarket
      </div>
    </footer>
  );
};

export default Footer;
