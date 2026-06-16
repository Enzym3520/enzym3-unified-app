import React, { useEffect, useRef } from "react";
import SignaturePadLib from "signature_pad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SignaturePadProps {
  value?: string; // data URL
  onChange: (dataUrl: string) => void;
  label?: string;
  height?: number;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  label,
  height = 160,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = canvas.offsetWidth;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      // Redraw existing signature if present
      if (value) {
        const img = new Image();
        img.onload = () => ctx?.drawImage(img, 0, 0, width, height);
        img.src = value;
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const pad = new SignaturePadLib(canvas, {
      penColor: "#111827",
      backgroundColor: "transparent",
    });
    padRef.current = pad;

    const exportData = () => {
      if (!pad.isEmpty()) {
        onChange(canvas.toDataURL("image/png"));
      } else {
        onChange("");
      }
    };

    const endEvents: Array<keyof HTMLElementEventMap> = [
      "mouseup",
      "touchend",
      "pointerup",
    ];
    endEvents.forEach((evt) => canvas.addEventListener(evt, exportData));

    return () => {
      window.removeEventListener("resize", resize);
      endEvents.forEach((evt) => canvas.removeEventListener(evt, exportData));
    };
    // Intentionally only re-init on height change. Adding `value` would recreate
    // the pad on every stroke (stroke → onChange → parent updates value → re-run);
    // `value` is read once for the initial redraw, and external clears are handled
    // by the separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    // When value is cleared externally
    if (value === "" && padRef.current) {
      padRef.current.clear();
    }
  }, [value]);

  const handleClear = () => {
    padRef.current?.clear();
    onChange("");
  };

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}
      <Card className="p-2">
        <div className="relative w-full" style={{ height }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-md border border-input bg-background"
            style={{ pointerEvents: disabled ? "none" : "auto" }}
          />
        </div>
      </Card>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleClear} disabled={disabled}>
          Clear
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
