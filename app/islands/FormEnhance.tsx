import { useEffect, useRef } from "hono/jsx"; // Import useRef
import { Notyf } from "notyf"; // Import Notyf
import "notyf/notyf.min.css"; // Import Notyf CSS

export default function FormEnhance() {
  const placeholderRef = useRef<HTMLSpanElement>(null); // Create a ref for the span

  useEffect(() => {
    // Instantiate Notyf
    const notyf = new Notyf({
      duration: 5000, // 5秒間表示
      position: {
        x: "right",
        y: "top",
      },
      types: [
        {
          type: "error",
          background: "indianred",
          dismissible: true,
        },
      ],
    });

    console.log("FormEnhance mounted");
    // Find the closest parent form element
    const findParentForm = (
      element: HTMLElement | null
    ): HTMLFormElement | null => {
      let current: HTMLElement | null = element;
      while (current) {
        if (current.tagName === "FORM") {
          return current as HTMLFormElement;
        }
        current = current.parentElement;
      }
      return null;
    };

    // Use the ref to get the specific placeholder element for this instance
    const placeholder = placeholderRef.current;
    const form = placeholder ? findParentForm(placeholder) : null; // Find form relative to this specific placeholder

    if (!form) {
      console.warn("FormEnhance could not find parent form."); // Add a warning if form not found
      return;
    }
    console.log("FormEnhance attached to form:", form); // Log the form it attached to

    // Input validation and button state handling
    const handleSubmit = (e: SubmitEvent) => {
      const submitButton = form.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement | null;

      // Disable button and change style on submit attempt
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add("opacity-50", "cursor-not-allowed");
      }

      const mailInput = form.querySelector(
        'input[name="mail"]'
      ) as HTMLInputElement | null;
      // Only validate if mail input exists
      if (mailInput) {
        const mail = mailInput.value.trim();
        // Allow empty mail, sage, or valid email format
        const sageOrEmailOrEmpty = /^(?:sage|[^\s@]+@[^\s@]+\.[^\s@]+)?$/;
        if (mail && !sageOrEmailOrEmpty.test(mail)) {
          // Validate only if not empty
          e.preventDefault();
          // Replace alert with notyf.error
          notyf.error(
            `メールアドレスの形式が正しくありません。<br>
            sageと空欄はOKです。
            `
          );
          // Re-enable button if validation fails
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove("opacity-50", "cursor-not-allowed");
          }
        }
      }
      // If submission is not prevented, the button remains disabled until page reload/navigation
    };

    // Ctrl+Enter to submit
    const handleKeyDown = (e: KeyboardEvent) => {
      const submitButton = form.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement | null;
      if (submitButton?.disabled) {
        return;
      }
      // Check if the event target is inside the form
      if (form.contains(e.target as Node) && e.ctrlKey && e.key === "Enter") {
        // Allow submission even if the focus is on textarea or input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLButtonElement
        ) {
          e.preventDefault();
          form.requestSubmit(); // Use requestSubmit for better form handling
        }
      }
    };

    form.addEventListener("submit", handleSubmit);
    form.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      console.log("FormEnhance cleanup for form:", form); // Log cleanup
      form.removeEventListener("submit", handleSubmit);
      form.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Dependency array remains empty, runs once on mount

  // Attach the ref to the placeholder element. Remove the ID as it's no longer needed for lookup.
  return <span ref={placeholderRef} style={{ display: "none" }}></span>;
}
