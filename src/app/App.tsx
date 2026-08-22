import { Lab } from "./Lab";

export function App() {
  return (
    <main className="app">
      <h1>Prism Lab</h1>
      <p className="muted">
        I0 — recipe truth + IndexedDB assets + WebGL2 compositor (main / overlay / text).
      </p>
      <Lab />
    </main>
  );
}
