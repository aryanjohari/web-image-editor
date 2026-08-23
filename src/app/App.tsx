import { Hero } from "./Hero";
import { Lab } from "./Lab";

function pathIsHero(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/hero" || path.endsWith("/hero");
}

export function App() {
  if (pathIsHero()) {
    return <Hero />;
  }

  return (
    <main className="app">
      <h1>Prism Lab</h1>
      <p className="muted">
        I2 — packs + grade + PNG / recipe / share hash export.{" "}
        <a href="/hero">Hero-lite</a>
      </p>
      <Lab />
    </main>
  );
}
