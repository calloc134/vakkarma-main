import { useEffect } from "hono/jsx";

export default function ErrorRedirect() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if history object exists and has entries to go back to
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        // Fallback if there's no history (e.g., opened in new tab)
        window.location.href = "/"; // Redirect to homepage or a safe default
      }
    }, 2000); // 5 seconds

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  return null; // This component does not render anything visible
}
