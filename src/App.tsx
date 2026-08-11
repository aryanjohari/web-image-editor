import { Navigate, Route, Routes } from "react-router-dom";
import { EmbedDemoShell } from "@/shells/EmbedDemoShell";
import { HomeShell } from "@/shells/HomeShell";
import { StoryShell } from "@/shells/StoryShell";
import { StudioShell } from "@/shells/StudioShell";
import { WorkspaceShell } from "@/shells/WorkspaceShell";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeShell />} />
      <Route path="/workspace" element={<WorkspaceShell />} />
      <Route path="/studio" element={<StudioShell />} />
      <Route path="/lab" element={<Navigate to="/studio" replace />} />
      <Route path="/story" element={<StoryShell />} />
      <Route path="/embed-demo" element={<EmbedDemoShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
