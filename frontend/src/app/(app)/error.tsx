"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h2 className="text-xl font-semibold text-red-400">Etwas ist schiefgelaufen</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
