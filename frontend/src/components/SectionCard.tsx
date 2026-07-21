import { motion } from "framer-motion";
import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "../lib/utils";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  eyebrow,
  action,
  className,
  children,
}: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "rounded-[28px] border border-border/60 bg-surface/90 p-6 shadow-panel backdrop-blur",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}
