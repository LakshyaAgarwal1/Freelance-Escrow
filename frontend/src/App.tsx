import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider } from "./contexts/Web3Context";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateAgreementPage } from "./pages/CreateAgreementPage";
import { AgreementDetailPage } from "./pages/AgreementDetailPage";
import { FreelancerWorkspacePage } from "./pages/FreelancerWorkspacePage";
import { ClientWorkspacePage } from "./pages/ClientWorkspacePage";
import { DisputeCenterPage } from "./pages/DisputeCenterPage";

export const App: React.FC = () => {
  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-background text-slate-100 selection:bg-sky-500 selection:text-slate-950">
          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create" element={<CreateAgreementPage />} />
              <Route path="/agreements/:id" element={<AgreementDetailPage />} />
              <Route path="/freelancer" element={<FreelancerWorkspacePage />} />
              <Route path="/client" element={<ClientWorkspacePage />} />
              <Route path="/disputes" element={<DisputeCenterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                Freelance Escrow Platform • Computer Engineering Final-Year Academic Project
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>EVM Smart Contract</span>
                <span>•</span>
                <span>MetaMask EIP-1193</span>
                <span>•</span>
                <span>Zero Custodial Risk</span>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </Web3Provider>
  );
};

export default App;
