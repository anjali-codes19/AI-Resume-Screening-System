import { UploadCloud } from "lucide-react";
import type { ChangeEvent } from "react";

interface FileDropzoneProps {
  id: string;
  label: string;
  fileName?: string;
  accept?: string;
  onChange: (file: File | null) => void;
}

export function FileDropzone({
  id,
  label,
  fileName,
  accept = ".pdf",
  onChange,
}: FileDropzoneProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null);
  }

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-border/80 bg-background/50 px-6 py-8 text-center transition hover:border-accent/60 hover:bg-accent/5"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <UploadCloud size={22} />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {fileName ? `Selected: ${fileName}` : "PDF only, max quality text extraction"}
      </p>
      <input id={id} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </label>
  );
}
