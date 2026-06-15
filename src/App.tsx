import { Navigate, Route, Routes } from "react-router-dom";
import { LandingShell } from "@/shells/LandingShell";
import { LabShell } from "@/shells/LabShell";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingShell />} />
      <Route path="/lab" element={<LabShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
