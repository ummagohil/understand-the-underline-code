import {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";

type Point = { x: number; y: number };
type Path = Point[];

interface InteractiveImageDisplayProps {
  imageFile: File | null;
  onSelectionChange: (selectionExists: boolean) => void;
  maxDisplayWidth?: number;
  maxDisplayHeight?: number;
}

export interface InteractiveImageDisplayRef {
  getAnnotatedImageDataUrl: () => string | null;
  clearSelection: () => void;
}

export const InteractiveImageDisplay = forwardRef<
  InteractiveImageDisplayRef,
  InteractiveImageDisplayProps
>(
  (
    {
      imageFile,
      onSelectionChange,
      maxDisplayWidth = 800,
      maxDisplayHeight = 600,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [drawingPaths, setDrawingPaths] = useState<Path[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<Path>([]);

    useEffect(() => {
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setImage(img);
            setDrawingPaths([]);
            onSelectionChange(false);
          };
          img.onerror = () => {
            console.error("Error loading image source.");
            setImage(null);
            setDrawingPaths([]);
            onSelectionChange(false);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(imageFile);
      } else {
        setImage(null);
        setDrawingPaths([]);
        onSelectionChange(false);
      }
    }, [imageFile, onSelectionChange]);

    // Draw image and paths
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!image) {
        const placeholderWidth = maxDisplayWidth;
        const placeholderHeight = Math.max(200, maxDisplayHeight);

        if (
          canvas.width !== placeholderWidth ||
          canvas.height !== placeholderHeight
        ) {
          canvas.width = placeholderWidth;
          canvas.height = placeholderHeight;
        }
        ctx.fillStyle = "#334155";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#94A3B8";
        ctx.textAlign = "center";
        ctx.font = "16px Inter, sans-serif";
        ctx.fillText("Image display area", canvas.width / 2, canvas.height / 2);
        return;
      }

      const scaleX = maxDisplayWidth / image.naturalWidth;
      const scaleY = maxDisplayHeight / image.naturalHeight;
      const scale = Math.min(scaleX, scaleY, 1);

      const displayWidth = image.naturalWidth * scale;
      const displayHeight = image.naturalHeight * scale;

      // Set canvas dimensions IF THEY NEED TO CHANGE. Assigning to .width/.height clears the canvas.
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Draw image
      ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

      // Draw all committed paths
      ctx.strokeStyle = "rgba(239, 68, 68, 0.9)"; // Tailwind red-500 with good opacity
      ctx.lineWidth = 3; // Thickness for underlining/marking
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      drawingPaths.forEach((path) => {
        if (path.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      });

      // Draw current path being drawn
      if (isDrawing && currentPath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      }
    }, [
      image,
      drawingPaths,
      currentPath,
      isDrawing,
      maxDisplayWidth,
      maxDisplayHeight,
    ]);

    const getMousePos = (
      canvas: HTMLCanvasElement,
      evt: MouseEvent | TouchEvent
    ): Point => {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in evt ? evt.touches[0].clientX : evt.clientX;
      const clientY = "touches" in evt ? evt.touches[0].clientY : evt.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const handleInteractionStart = (
      event:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (
        !image ||
        (event.nativeEvent instanceof MouseEvent &&
          event.nativeEvent.button !== 0)
      )
        return;
      event.preventDefault();

      const pos = getMousePos(canvasRef.current!, event.nativeEvent);
      setIsDrawing(true);
      setCurrentPath([pos]);
    };

    const handleInteractionMove = (
      event:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawing || !image) return;
      event.preventDefault();

      const pos = getMousePos(canvasRef.current!, event.nativeEvent);
      setCurrentPath((prevPath) => [...prevPath, pos]);
    };

    const handleInteractionEnd = (
      event:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawing || !image) return;
      event.preventDefault();

      setIsDrawing(false);
      if (currentPath.length > 1) {
        const newPaths = [...drawingPaths, currentPath];
        setDrawingPaths(newPaths);
        onSelectionChange(newPaths.length > 0);
      }
      setCurrentPath([]);
    };

    useImperativeHandle(ref, () => ({
      getAnnotatedImageDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return null;
        return canvas.toDataURL("image/png");
      },
      clearSelection: () => {
        setDrawingPaths([]);
        setCurrentPath([]);
        setIsDrawing(false);
        onSelectionChange(false);
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={handleInteractionStart}
        onMouseMove={handleInteractionMove}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchMove={handleInteractionMove}
        onTouchEnd={handleInteractionEnd}
        className="border-2 border-slate-500 rounded-md cursor-crosshair touch-none select-none"
        style={{ maxWidth: "100%", display: "block" }}
        aria-label="Interactive image canvas for drawing markings"
      />
    );
  }
);
InteractiveImageDisplay.displayName = "InteractiveImageDisplay";
