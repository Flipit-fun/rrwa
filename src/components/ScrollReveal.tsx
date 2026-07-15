"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    function revealCheck() {
      document.querySelectorAll(".rv:not(.in)").forEach((el) => io.observe(el));
    }

    revealCheck();

    // Re-check after tab switches or dynamic content changes
    const observer = new MutationObserver(() => revealCheck());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
