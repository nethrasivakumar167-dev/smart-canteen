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
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 transition-colors">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-amber-600 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-white text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Rush Hour Warning: Lunch Rush (12:30 PM - 2:00 PM)</h3>
              <p className="text-white/80 text-xs sm:text-sm">
                Preorder 15 minutes ahead to skip the lunch crowd and pick up right when you walk in!
              </p>
            </div>
          </div>
          <Link
            to="/menu"
            className="px-5 py-2.5 bg-white text-brand-700 hover:bg-gray-100 rounded-xl font-bold text-sm shadow-md transition transform hover:scale-105"
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
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-glow">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                SMART<span className="text-brand-500">CANTEEN</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Empowering campus students, faculty, and visitors with frictionless digital preordering, live kitchen queue dispatch, and instant QR pickups.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% FSSAI Certified Clean Campus Kitchen</span>
            </div>
          </div>

          {/* Canteen Timings */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              Canteen Timings
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-300">Breakfast:</span>
                <span className="font-mono text-brand-400">07:30 AM - 11:00 AM</span>
              </li>
              <li className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-300">Executive Lunch:</span>
                <span className="font-mono text-brand-400">12:00 PM - 03:30 PM</span>
              </li>
              <li className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-300">Snacks & Tea:</span>
                <span className="font-mono text-brand-400">04:00 PM - 07:30 PM</span>
              </li>
              <li className="flex justify-between py-1">
                <span className="text-gray-300">Dinner / Night Bites:</span>
                <span className="font-mono text-brand-400">08:00 PM - 10:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/menu" className="text-gray-400 hover:text-brand-400 transition">
                  Browse Full Menu
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-gray-400 hover:text-brand-400 transition">
                  My Preorder Cart
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-brand-400 transition">
                  Student & Faculty Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-brand-400 transition">
                  New Student Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Campus Desk */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400" />
              Campus Location
            </h4>
            <div className="space-y-2 text-xs text-gray-400">
              <p>Main Campus Central Block, Ground Floor Canteen Plaza, Opp. Central Library</p>
              <div className="flex items-center gap-2 pt-1 text-gray-300">
                <Phone className="w-3.5 h-3.5 text-brand-400" />
                <span>Ext. +91 44 2257 8000</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                <span>canteen@campus.edu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Smart Canteen Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-brand-500 fill-brand-500 inline" />
            <span>for frictionless campus dining.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
