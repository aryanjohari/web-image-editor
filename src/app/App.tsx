import { useEffect } from "react";
import { Cover } from "./Cover";
import { Hero } from "./Hero";
import { Lab } from "./Lab";
import { resolveRoute, shareHashRedirectUrl } from "./routes";

export function App() {
  const pathname = window.location.pathname;
  const hash = window.location.hash;

  useEffect(() => {
    const redirect = shareHashRedirectUrl(window.location.pathname, window.location.hash);
    if (redirect) {
      window.history.replaceState(null, "", redirect);
    }
  }, []);

  const route = resolveRoute(pathname, hash);

  if (route === "hero") {
    return <Hero />;
  }
  if (route === "cover") {
    return <Cover />;
  }

  return (
    <main className="app">
      <header className="lab-header">
        <div>
          <p className="lab-kicker">Prism</p>
          <h1>Lab</h1>
        </div>
        <p className="muted lab-loop">
          Upload → pack → tune → export
          <span aria-hidden="true"> · </span>
          <a href="/">Cover</a>
        </p>
      </header>
      <Lab />
    </main>
  );
}
