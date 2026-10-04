import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 text-center space-y-6">
      <div className="space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">404</h1>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Page Not Found</h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-md hover:bg-brand-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Smart Canteen Home
        </Link>
      </div>
    </div>
  );
};
