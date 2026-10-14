import { useEffect, useRef } from "react";

// Renders Google's sign-in button only when VITE_GOOGLE_CLIENT_ID is set.
// The ID token is posted to /api/auth/google, which verifies it server-side.
export default function GoogleButton({ onCredential, onError }) {
  const containerRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return undefined;

    const render = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) onCredential(response.credential);
          else onError?.("Google sign-in was cancelled");
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return undefined;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [clientId, onCredential, onError]);

  if (!clientId) return null;
  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 text-xs text-secondary">
        <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
      </div>
      <div ref={containerRef} className="mt-4 flex justify-center" />
    </div>
  );
}
