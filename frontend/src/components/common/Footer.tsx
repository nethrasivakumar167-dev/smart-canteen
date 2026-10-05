import React from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Heart,
  Sparkles,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-skyblue transition-colors">
      <div className="stripe-band" aria-hidden="true" />
      {/* Top Banner */}
      <div className="bg-navy py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-cream text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-skyblue rounded-full">
              <Sparkles className="w-6 h-6 text-navy" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Rush Hour Warning: Lunch Rush (12:30 PM - 2:00 PM)</h3>
              <p className="text-cream/80 text-xs sm:text-sm">
                Preorder 15 minutes ahead to skip the lunch crowd and pick up right when you walk in!
              </p>
            </div>
          </div>
          <Link
            to="/menu"
            className="px-5 py-2.5 bg-cream text-navy hover:bg-skysoft rounded-full font-bold text-sm shadow-sm transition transform hover:scale-105"
          >
            Preorder Lunch Now
          </Link>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-cream flex items-center justify-center text-navy shadow-sm">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="font-display italic font-semibold text-xl text-cream tracking-wide">
                SMART<span className="text-cream">CANTEEN</span>
              </span>
            </div>
            <p className="text-sm text-skyblue leading-relaxed">
              Empowering campus students, faculty, and visitors with frictionless digital preordering, live kitchen queue dispatch, and instant QR pickups.
            </p>
            <div className="flex items-center gap-2 text-xs text-skyblue font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% FSSAI Certified Clean Campus Kitchen</span>
            </div>
          </div>

          {/* Canteen Timings */}
          <div className="space-y-3">
            <h4 className="text-cream font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-skyblue" />
              Canteen Timings
            </h4>
            <ul className="space-y-2 text-xs text-skyblue">
              <li className="flex justify-between py-1 border-b border-slateblue-light">
                <span className="text-cream">Breakfast:</span>
                <span className="font-mono text-mist">07:30 AM - 11:00 AM</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slateblue-light">
                <span className="text-cream">Executive Lunch:</span>
                <span className="font-mono text-mist">12:00 PM - 03:30 PM</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slateblue-light">
                <span className="text-cream">Snacks & Tea:</span>
                <span className="font-mono text-mist">04:00 PM - 07:30 PM</span>
              </li>
              <li className="flex justify-between py-1">
                <span className="text-cream">Dinner / Night Bites:</span>
                <span className="font-mono text-mist">08:00 PM - 10:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-cream font-bold text-sm uppercase tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/menu" className="text-skyblue hover:text-cream transition">
                  Browse Full Menu
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-skyblue hover:text-cream transition">
                  My Preorder Cart
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-skyblue hover:text-cream transition">
                  Student & Faculty Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-skyblue hover:text-cream transition">
                  New Student Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Campus Desk */}
          <div className="space-y-3">
            <h4 className="text-cream font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-skyblue" />
              Campus Location
            </h4>
            <div className="space-y-2 text-xs text-skyblue">
              <p className="text-cream">Main Campus Central Block, Ground Floor Canteen Plaza, Opp. Central Library</p>
              <div className="flex items-center gap-2 pt-1 text-cream">
                <Phone className="w-3.5 h-3.5 text-skyblue" />
                <span>Ext. +91 44 2257 8000</span>
              </div>
              <div className="flex items-center gap-2 text-cream">
                <Mail className="w-3.5 h-3.5 text-skyblue" />
                <span>canteen@campus.edu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slateblue-light flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-skyblue">
          <p>© {new Date().getFullYear()} Smart Canteen Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rust fill-rust inline" />
            <span>for frictionless campus dining.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
