"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { updateAvatar, type ActionState } from "@/lib/actions";
import { Avatar } from "@/components/Avatar";

const MAX_DIMENSION = 200;

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      img.onerror = () => reject(new Error("That doesn't look like an image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not process that image."));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarUpload({
  name,
  avatarUrl,
  size = "h-14 w-14 text-lg",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateAvatar,
    undefined,
  );

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      setPreview(dataUrl);
      const formData = new FormData();
      formData.set("avatarUrl", dataUrl);
      startTransition(() => {
        formAction(formData);
      });
    } catch {
      // resizeToDataUrl's own errors already describe the problem; a silent
      // no-op here is fine since the file input stays usable for a retry.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative rounded-full focus-visible:outline-2 focus-visible:outline-brass"
        aria-label="Change profile picture"
      >
        <Avatar name={name} avatarUrl={preview ?? avatarUrl} className={size} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/0 text-[10px] font-medium text-transparent transition-colors group-hover:bg-ink/40 group-hover:text-paper">
          {busy ? "…" : "Edit"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {state?.error && (
        <p role="alert" className="text-xs text-debit">
          {state.error}
        </p>
      )}
    </div>
  );
}
