import { Navigate, Route, Routes } from "react-router-dom";
import { EmbedDemoShell } from "@/shells/EmbedDemoShell";
import { LandingShell } from "@/shells/LandingShell";
import { LabShell } from "@/shells/LabShell";
import { StoryShell } from "@/shells/StoryShell";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingShell />} />
      <Route path="/lab" element={<LabShell />} />
      <Route path="/story" element={<StoryShell />} />
      <Route path="/embed-demo" element={<EmbedDemoShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
