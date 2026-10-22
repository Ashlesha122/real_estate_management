import { Building2, Heart, Shield, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-estate-900 text-estate-300 pt-16 pb-12 border-t border-estate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-estate-800">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Estate<span className="text-primary-400">Flow</span>
              </span>
            </Link>
            <p className="text-sm text-estate-400 max-w-sm leading-relaxed">
              Modern real estate management platform connecting verified buyers, owners, and licensed brokers with zero brokerage options, transparent listings, and automated visit scheduling.
            </p>
            <div className="flex items-center gap-4 text-xs text-estate-400 pt-2">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-accent-400" /> 100% Verified Properties
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-rose-400" /> Direct Owner Contact
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wider uppercase">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search?purpose=RENT" className="hover:text-white transition-colors">
                  Properties for Rent
                </Link>
              </li>
              <li>
                <Link to="/search?purpose=SALE" className="hover:text-white transition-colors">
                  Properties for Sale
                </Link>
              </li>
              <li>
                <Link to="/search?zeroBrokerage=true" className="hover:text-white transition-colors text-accent-400">
                  Zero Brokerage Homes
                </Link>
              </li>
              <li>
                <Link to="/search?type=APARTMENT" className="hover:text-white transition-colors">
                  Flats & Apartments
                </Link>
              </li>
              <li>
                <Link to="/search?type=VILLA" className="hover:text-white transition-colors">
                  Villas & Bungalows
                </Link>
              </li>
            </ul>
          </div>

          {/* Dashboards */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wider uppercase">Portals</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/dashboard/buyer" className="hover:text-white transition-colors">
                  Buyer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/owner" className="hover:text-white transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/broker" className="hover:text-white transition-colors">
                  Broker Partner Hub
                </Link>
              </li>
              <li>
                <Link to="/dashboard/owner/listings/new" className="hover:text-white transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Account Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wider uppercase">Support</h4>
            <ul className="space-y-3 text-sm text-estate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>support@estateflow.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>+91 (800) 123-4567</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                <span>Indiranagar 100ft Rd, Bengaluru, KA 560038</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-estate-500 gap-4">
          <p>© {new Date().getFullYear()} EstateFlow Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-estate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-estate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-estate-400 cursor-pointer">RERA Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
