import React from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { TerminalPanel } from "./components/TerminalPanel";
import { useInitialize } from "./hooks/usePackages";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  useInitialize();
  useTheme();

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <TerminalPanel />
      </div>
    </div>
  );
}
