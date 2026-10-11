import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PixelIcon } from '../components/pixel/PixelIcon';
import { landingDishes } from '../data/landingDishes';
import { useAuthStore } from '../store/authStore';

const ROTATING_WORDS = ['queue', 'wait', 'rush'];

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      element.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('is-visible');
          observer.unobserve(element);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
};

const Reveal: React.FC<React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>> = ({
  children,
  className = '',
  style,
}) => {
  const ref = useReveal();
  return (
    <div ref={ref} className={`fade-up ${className}`} style={style}>
      {children}
    </div>
  );
};

const HeroOrbit: React.FC = () => {
  const firstDish = landingDishes[0];
  if (!firstDish) return null;

  const orbitDishes = Array.from({ length: 4 }, (_, index) =>
    landingDishes[(index + 1) % landingDishes.length]
  );
  const positions = [
    'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
    'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
    'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
  ];

  return (
    <div className="relative mx-auto aspect-square animate-bob" style={{ width: 'clamp(16rem, 68vw, 28rem)' }}>
      <img
        src={`/menu/${firstDish.slug}.jpg`}
        alt={firstDish.name}
        width="448"
        height="448"
        loading="eager"
        fetchPriority="high"
        className="absolute left-1/2 top-1/2 z-10 aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] theme-strong-border object-cover"
      />
      {landingDishes.length >= 4 && (
        <div className="absolute inset-[8%] animate-orbit-spin rounded-full border-[3px] border-dashed theme-gold-border">
          {orbitDishes.map((dish, index) => (
            <div
              key={dish.slug}
              className={`absolute ${positions[index]}`}
              style={{ width: 'clamp(4.25rem, 13vw, 6rem)' }}
            >
              <div className="animate-orbit-unspin">
                <div className="aspect-square overflow-hidden rounded-full border-[3px] theme-strong-border theme-surface">
                  <img
                    src={`/menu/${dish.slug}.jpg`}
                    alt={dish.name}
                    width="96"
                    height="96"
                    loading="lazy"
                    className="h-full w-full aspect-square object-cover"
                  />
                </div>
                <span className="orbit-label mt-2 block text-center text-[9px] leading-tight theme-primary-text">
                  <strong className="block font-pixel text-[10px]">{dish.name}</strong>
                  {dish.descriptor}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MarqueeItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex shrink-0 items-center gap-6 px-5 font-pixel text-xs theme-nav-text sm:text-sm">
    {children}
    <PixelIcon name="star" size={16} />
  </span>
);

const steps = [
  { title: 'Browse', description: 'Explore dishes with clear allergen information.', icon: 'bowl' as const },
  { title: 'Choose a pickup slot', description: 'Pick a convenient 10-minute collection window.', icon: 'clock' as const },
  { title: 'Pay', description: 'Pay with cash or online when you place your order.', icon: 'cart' as const },
  { title: 'Collect with your Order ID', description: 'Show your Order ID at pickup and enjoy your meal.', icon: 'check' as const },
];

const benefits = ['No queues', 'Live order status', '10-minute pickup slots', 'Order history', 'Allergen info'];

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) return;

    const interval = window.setInterval(() => {
      setWordIndex((index) => (index + 1) % ROTATING_WORDS.length);
    }, 1800);
    return () => window.clearInterval(interval);
  }, []);

  const dashboardPath = user?.role === 'ADMIN'
    ? '/admin/dashboard'
    : user?.role === 'STAFF'
      ? '/staff/dashboard'
      : '/student/dashboard';

  return (
    <div className="overflow-x-clip">
      <section className="relative overflow-x-clip theme-surface px-4 py-12 sm:px-6 sm:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {[12, 35, 61, 82].map((left, index) => (
            <span
              key={left}
              className={`absolute top-0 h-2 w-2 animate-fall ${index % 2 ? 'theme-sky-surface' : 'theme-gold-surface'}`}
              style={{ left: `${left}%`, animationDelay: `${index * -1.1}s` }}
            />
          ))}
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="relative z-10 text-center lg:text-left">
            <p className="mb-4 font-pixel text-[10px] uppercase tracking-wide theme-primary-text sm:text-xs">
              Made for your campus day
            </p>
            <h1 className="mx-auto max-w-2xl text-4xl leading-tight theme-primary-text sm:text-5xl lg:mx-0 lg:text-6xl">
              Skip the <span className="theme-danger-text">{ROTATING_WORDS[wordIndex]}</span>. Pick up hot.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed theme-primary-text sm:text-lg lg:mx-0">
              Order your campus favourites ahead, choose a pickup time, and spend less of your day in line.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              {isAuthenticated && user ? (
                <Link className="px-btn" to={dashboardPath}>Back to dashboard</Link>
              ) : (
                <>
                  <Link className="px-btn" to="/login">Login</Link>
                  <Link className="px-btn px-btn--cream" to="/register">Register</Link>
                </>
              )}
              <a className="px-btn px-btn--sky" href="#how-it-works">How it works</a>
            </div>
          </div>
          <div className="relative z-10 mx-auto w-full max-w-lg">
            {landingDishes.length > 0 && <HeroOrbit />}
          </div>
        </div>
      </section>

      <section className="overflow-hidden theme-inverse-surface py-4" aria-label="Fresh, hot, on time, no queue">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div className="flex" key={copy} aria-hidden={copy === 1}>
              <MarqueeItem>FRESH</MarqueeItem>
              <MarqueeItem>HOT</MarqueeItem>
              <MarqueeItem>ON TIME</MarqueeItem>
              <MarqueeItem>NO QUEUE</MarqueeItem>
            </div>
          ))}
        </div>
      </section>

      <div className="scallop-divider" aria-hidden="true" />
      <section id="how-it-works" className="overflow-x-clip theme-sky-surface px-4 pb-16 pt-5 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <p className="font-pixel text-[10px] uppercase theme-primary-text">Simple as 1, 2, 3, 4</p>
            <h2 className="mt-3 text-3xl theme-primary-text sm:text-4xl">How it works</h2>
          </Reveal>
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Reveal key={step.title} style={{ animationDelay: `${index * 100}ms` }}>
                <article className="px-card h-full p-5">
                  <PixelIcon name={step.icon} size={32} />
                  <p className="mt-4 font-pixel text-[10px] theme-primary-text">STEP 0{index + 1}</p>
                  <h3 className="mt-2 text-xl theme-primary-text">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed theme-primary-text">{step.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-9 flex flex-wrap justify-center gap-3">
            {['10-minute windows', '7 AM to 7 PM', 'Order at least 15 minutes ahead'].map((fact) => (
              <span className="px-chip" key={fact}>{fact}</span>
            ))}
          </Reveal>
        </div>
      </section>

      {landingDishes.length >= 4 && (
        <section className="overflow-x-clip theme-surface px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal className="text-center">
              <p className="font-pixel text-[10px] uppercase theme-primary-text">A few campus favourites</p>
              <h2 className="mt-3 text-3xl theme-primary-text sm:text-4xl">Our popular menu</h2>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:gap-x-10">
              {landingDishes.map((dish, index) => (
                <Reveal key={dish.slug} style={{ animationDelay: `${(index % 4) * 110}ms` }}>
                  <article className="text-center">
                    <div className="mx-auto aspect-square w-full max-w-48 overflow-hidden rounded-full border-[3px] theme-strong-border theme-gold-surface animate-bob" style={{ animationDelay: `${index * -250}ms` }}>
                      <img
                        src={`/menu/${dish.slug}.jpg`}
                        alt={dish.name}
                        width="240"
                        height="240"
                        loading="lazy"
                        className="h-full w-full aspect-square object-cover"
                      />
                    </div>
                    <h3 className="mt-4 text-lg theme-primary-text">{dish.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed theme-primary-text">{dish.descriptor}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="overflow-x-clip theme-gold-surface px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="font-pixel text-[10px] uppercase theme-primary-text">Good food, easier days</p>
            <h2 className="mt-3 text-3xl theme-primary-text sm:text-4xl">About CampusBite</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed theme-primary-text">
              CampusBite is a campus canteen ordering site that helps you browse dishes, plan a pickup, and keep track of your order from one place.
            </p>
          </Reveal>
          <Reveal className="flex flex-wrap gap-3">
            {benefits.map((benefit, index) => (
              <span className="px-chip theme-surface" key={benefit}>
                <PixelIcon name={index === 4 ? 'heart' : 'check'} size={14} />
                {benefit}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="overflow-x-clip theme-surface px-4 py-16 text-center sm:px-6 sm:py-24">
        <Reveal className="mx-auto max-w-3xl">
          <img
            src="/brand/campusbite-logo.jpg"
            width={120}
            height={120}
            className="mx-auto object-contain"
            alt="CampusBite"
          />
          <h2 className="mt-4 text-3xl theme-primary-text sm:text-4xl">Right on campus</h2>
          <p className="mt-3 text-base theme-primary-text">SRM Ramapuram, Chennai, India</p>
          <p className="mx-auto mt-7 max-w-xl text-lg theme-primary-text">“A warmer welcome to the campus canteen, one pickup at a time.”</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link className="px-btn" to="/login">Login</Link>
            <Link className="px-btn px-btn--cream" to="/register">Register</Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default LandingPage;
