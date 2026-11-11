import { cn } from "@/lib/utils";
import React from "react";

export const GridBackground = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("relative min-h-screen w-full bg-[#080808]", className)}>
      {/* 1. Subtle top ambient spotlight glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.12), transparent 75%)",
        }}
      />

      {/* 2. Grid lines with top-focused fade mask */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundSize: "44px 44px",
          backgroundImage:
            "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
          maskImage:
            "radial-gradient(ellipse 90% 70% at 50% 10%, black 25%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 70% at 50% 10%, black 25%, transparent 80%)",
        }}
      />

      {/* 3. Subtle bottom vignette so cards sit on clean dark */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 100%, #080808 60%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
