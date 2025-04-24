import { useEffect } from "hono/jsx";

export default function FormEnhance() {
  useEffect(() => {
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

    // Use a unique identifier or a more robust way if multiple forms exist without islands
    // For this example, we assume the island is placed directly within the form it targets
    // or we can traverse up to find the parent form.
    // A simple approach: use a placeholder element to find the form.
    const placeholder = document.getElementById("form-enhance-placeholder");
    const form = placeholder
      ? findParentForm(placeholder)
      : document.querySelector("form"); // Fallback, might not be specific enough

    if (!form) return;

    // Input validation
    const handleSubmit = (e: SubmitEvent) => {
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
          alert(
            "メールアドレスの形式が正しくないか、「sage」のみを許可します。空欄も許可されます。"
          );
        }
      }
    };

    // Ctrl+Enter to submit
    const handleKeyDown = (e: KeyboardEvent) => {
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
    // Add keydown listener to the form itself or document if needed more broadly
    form.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      form.removeEventListener("submit", handleSubmit);
      form.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Add a placeholder element to help locate the form
  return (
    <span id="form-enhance-placeholder" style={{ display: "none" }}></span>
  );
}
