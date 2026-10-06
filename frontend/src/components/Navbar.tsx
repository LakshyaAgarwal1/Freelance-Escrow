import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import {
  ShieldCheck,
  Wallet,
  PlusCircle,
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Scale,
  LogOut,
  ChevronDown,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { account, chainId, networkName, isConnecting, connectWallet, disconnectWallet, switchNetwork } = useWeb3();
  const location = useLocation();

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "New Agreement", path: "/create", icon: PlusCircle },
    { name: "Freelancer Hub", path: "/freelancer", icon: Briefcase },
    { name: "Client Reviews", path: "/client", icon: CheckSquare },
    { name: "Dispute Center", path: "/disputes", icon: Scale },
  ];

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 p-0.5 shadow-glow group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors">
                  Freelance<span className="text-sky-400">Escrow</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-400 -mt-1 tracking-wider uppercase">
                  Web3 Assurance
                </span>
              </div>
            </Link>

            {/* Main Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-slate-800 text-sky-400 border border-slate-700/80 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Network Badge */}
            <div
              onClick={() => switchNetwork(31337)}
              title="Click to switch to Hardhat Local (31337)"
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 cursor-pointer hover:border-slate-700 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  chainId === 31337 || chainId === 1337
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : "bg-amber-400"
                }`}
              />
              <span className="font-mono">{networkName}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </div>

            {/* Wallet Connect Button */}
            {account ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  <span className="text-xs font-mono text-slate-200">{formatAddress(account)}</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  title="Disconnect Wallet"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-semibold text-xs transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "Connecting..." : "Connect MetaMask"}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
