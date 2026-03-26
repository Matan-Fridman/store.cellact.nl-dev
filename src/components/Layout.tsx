import { useState, type ReactNode } from "react";
import {
  getUseProductionUrls,
  setUseProductionUrls,
} from "../config/constants";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [, setTick] = useState(0);
  const useProduction = getUseProductionUrls();

  const handleToggle = () => {
    setUseProductionUrls(!useProduction);
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-slate-900 tracking-tight">
            Secnum
          </a>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleToggle}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              title={
                useProduction
                  ? "Using production URLs (click for development)"
                  : "Using development URLs (click for production)"
              }
            >
              <span
                className={`h-2 w-2 rounded-full ${useProduction ? "bg-emerald-500" : "bg-amber-500"}`}
                aria-hidden
              />
              {useProduction ? "Prod" : "Dev"}
            </button>
            <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
              by Cellact
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  );
}
