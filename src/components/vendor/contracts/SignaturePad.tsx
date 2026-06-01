import { useRef, useEffect, useState } from "react";
import SignaturePadLib from "signature_pad";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface Props {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ onSave, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio ?? 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: "rgb(255,255,255)",
      penColor: "rgb(0,0,0)",
    });
    padRef.current = pad;

    pad.addEventListener("endStroke", () => {
      setIsEmpty(pad.isEmpty());
      if (!pad.isEmpty()) onSave(pad.toDataURL("image/png"));
    });

    return () => { pad.off(); };
  }, [onSave]);

  const clear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          style={{ height: 160 }}
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Draw your signature above</p>
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={isEmpty || disabled}>
          <Eraser className="h-3 w-3 mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
}
