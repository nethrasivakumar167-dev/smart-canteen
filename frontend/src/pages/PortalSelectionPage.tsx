import React from 'react';
import { Link } from 'react-router-dom';
import { CheckerStrip } from '../components/layout/CheckerStrip';
import { PixelIcon } from '../components/pixel/PixelIcon';

const portals = [
  {
    title: 'Student',
    description: 'Order ahead, track meals, and collect campus rewards.',
    path: '/student/login',
    icon: 'bowl',
    action: 'Student sign in',
  },
  {
    title: 'Staff / Chef',
    description: 'Manage kitchen orders and keep the menu up to date.',
    path: '/staff/login',
    icon: 'clock',
    action: 'Staff sign in',
  },
  {
    title: 'Admin',
    description: 'Oversee campus dining operations and administration.',
    path: '/admin/login',
    icon: 'star',
    action: 'Admin sign in',
  },
] as const;

export const PortalSelectionPage: React.FC = () => (
  <main className="min-h-[85vh] theme-secondary-surface px-4 py-12 sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-center">
      <header className="mb-10 max-w-2xl space-y-3 text-center">
        <span className="px-chip">CampusBite access</span>
        <h1 className="font-display text-4xl font-extrabold theme-primary-text sm:text-5xl">
          Welcome to the canteen
        </h1>
        <p className="text-sm theme-secondary-text sm:text-base">
          Choose your portal to continue to Smart Canteen.
        </p>
      </header>

      <div className="px-stagger-grid grid w-full gap-6 md:grid-cols-3">
        {portals.map((portal, index) => (
          <article
            key={portal.title}
            className="px-card flex flex-col items-start gap-5 rounded-2xl p-6 sm:p-8"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex h-14 w-14 items-center justify-center theme-gold-surface theme-primary-text">
              <PixelIcon name={portal.icon} size={28} />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold theme-primary-text">{portal.title}</h2>
              <p className="text-sm leading-relaxed theme-secondary-text">{portal.description}</p>
            </div>
            <Link to={portal.path} className="px-btn mt-auto w-full">
              {portal.action}
            </Link>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-sm theme-primary-text">
        New student?{' '}
        <Link to="/register" className="font-bold underline underline-offset-4">
          Register
        </Link>
      </p>
    </div>
    <div className="mx-auto mt-12 max-w-6xl">
      <CheckerStrip />
    </div>
  </main>
);
