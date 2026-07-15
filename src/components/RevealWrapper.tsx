"use client";

import { useEffect, useRef } from "react";

interface RevealWrapperProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export default function RevealWrapper({
  children,
  className = "",
  as: Tag = "div",
}: RevealWrapperProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // @ts-expect-error - dynamic element type
    <Tag ref={ref} className={`rv ${className}`.trim()}>
      {children}
    </Tag>
  );
}
