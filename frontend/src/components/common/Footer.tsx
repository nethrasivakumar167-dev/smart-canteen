import React from 'react';
import { Link } from 'react-router-dom';
import { CheckerStrip } from '../layout/CheckerStrip';

export const Footer: React.FC = () => (
  <footer className="bg-navy text-cream">
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
      <Link to="/" className="inline-flex items-center">
        <img
          src="/brand/campusbite-logo.jpg"
          width={96}
          height={96}
          className="object-contain"
          alt="CampusBite"
        />
      </Link>
      <p className="text-sm text-skyblue">Campus dining, ready when you are.</p>
      <div className="flex flex-col items-center gap-3 text-xs sm:flex-row">
        <a href="/menu/CREDITS.md" className="text-cream underline underline-offset-2">
          Photo credits
        </a>
        <span className="text-skyblue">© {new Date().getFullYear()} CampusBite</span>
      </div>
    </div>
    <CheckerStrip />
  </footer>
);

export default Footer;
