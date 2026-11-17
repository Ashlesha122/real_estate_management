import { Building2, Heart, Shield, Mail, Phone, MapPin, CheckCircle2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-estate-950 text-estate-300 pt-16 pb-12 border-t border-estate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-estate-800/80">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                <img src="/estateflow-logo.svg" alt="EstateFlow" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-2xl tracking-tight text-white leading-none">
                  Estate<span className="text-primary-400">Flow</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">
                  India's Zero-Brokerage PropTech Platform
                </span>
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-estate-400 max-w-sm leading-relaxed">
              Empowering home seekers, property owners, and certified brokers across Mumbai, Bengaluru, Delhi NCR, Hyderabad, and Chennai with direct connections, verified legal papers, and transparent digital leases.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-estate-400 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> 100% RERA Registered
              </span>
              <span className="flex items-center gap-1.5 text-primary-300 font-semibold">
                <Lock className="w-4 h-4" /> 256-Bit Escrow Security
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-4 tracking-wider uppercase">Explore Properties</h4>
            <ul className="space-y-2.5 text-xs text-estate-400">
              <li>
                <Link to="/search?purpose=RENT" className="hover:text-white transition-colors">
                  Flats for Rent
                </Link>
              </li>
              <li>
                <Link to="/search?purpose=SALE" className="hover:text-white transition-colors">
                  Properties for Sale
                </Link>
              </li>
              <li>
                <Link to="/search?zeroBrokerage=true" className="hover:text-white transition-colors text-emerald-400 font-medium">
                  Zero Brokerage Homes
                </Link>
              </li>
              <li>
                <Link to="/search?city=Bangalore" className="hover:text-white transition-colors">
                  Homes in Bengaluru
                </Link>
              </li>
              <li>
                <Link to="/search?city=Mumbai" className="hover:text-white transition-colors">
                  Properties in Mumbai
                </Link>
              </li>
              <li>
                <Link to="/search?city=Delhi" className="hover:text-white transition-colors">
                  Luxury Flats in Delhi NCR
                </Link>
              </li>
            </ul>
          </div>

          {/* Dashboards */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-4 tracking-wider uppercase">Portals & Tools</h4>
            <ul className="space-y-2.5 text-xs text-estate-400">
              <li>
                <Link to="/dashboard/buyer" className="hover:text-white transition-colors">
                  Buyer & Tenant Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/owner" className="hover:text-white transition-colors">
                  Homeowner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/broker" className="hover:text-white transition-colors">
                  Licensed Broker Partner Hub
                </Link>
              </li>
              <li>
                <Link to="/dashboard/owner/listings/new" className="hover:text-white transition-colors font-medium text-primary-300">
                  + Post Free Property
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-4 tracking-wider uppercase">Corporate Office</h4>
            <ul className="space-y-3 text-xs text-estate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                <span>EstateFlow Technologies Pvt. Ltd., Level 4, Prestige Tech Cloud, Indiranagar, Bengaluru, KA 560038</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>+91 (080) 4120-8900 / 1800-200-FLOW</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>concierge@estateflow.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal RERA & CIN Disclaimer */}
        <div className="py-6 border-b border-estate-800/80 text-[11px] text-estate-500 leading-relaxed space-y-2">
          <p>
            <strong className="text-estate-400">RERA Regulatory Compliance:</strong> EstateFlow Technologies Pvt. Ltd. operates as a technology and intermediary platform in accordance with the Real Estate (Regulation and Development) Act, 2016. Registered RERA Intermediary Numbers: Karnataka PRM/KA/RERA/1251/AG/230101/004812 | MahaRERA: A51900038910 | HRERA Gurugram: 219/2017/RC.
          </p>
          <p>
            CIN: U72900KA2024PTC184912 | ISO 27001:2022 Certified Information Security Management System.
          </p>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-estate-500 gap-4">
          <p>© {new Date().getFullYear()} EstateFlow Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-estate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-estate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-estate-400 cursor-pointer">RERA Guidelines</span>
            <span className="hover:text-estate-400 cursor-pointer">Security Audit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
