"use client";

import { useEffect, useState } from "react";

export function PhotoPicker() {
  const [preview, setPreview] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <label className="file-picker">
      {/* Local object URLs cannot use the Next image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview ? <img className="photo-preview" src={preview} alt="Selected submission preview" /> : <span className="camera-icon">＋</span>}
      <strong>{preview ? "Photo ready" : "Take or choose a photo"}</strong>
      <small>{preview ? "Tap to choose a different photo" : "Camera and photo library supported · 12MB max"}</small>
      <input type="file" name="evidence" accept="image/*" required onChange={(event) => {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : "");
      }} />
    </label>
  );
}
