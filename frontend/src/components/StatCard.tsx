import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "../lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  accentClass?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  accentClass,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[28px] border border-border/60 bg-surface/90 p-5 shadow-panel backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/12 text-accent",
            accentClass,
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
