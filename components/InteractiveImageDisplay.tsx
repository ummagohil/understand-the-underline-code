
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

type Point = { x: number; y: number };
type Path = Point[]; // A single continuous stroke

interface InteractiveImageDisplayProps {
  imageFile: File | null;
  onSelectionChange: (selectionExists: boolean) => void; // selectionExists means markings exist
  maxDisplayWidth?: number;
  maxDisplayHeight?: number;
}

export interface InteractiveImageDisplayRef {
  getAnnotatedImageDataUrl: () => string | null;
  clearSelection: () => void; // Clears all drawings
}

export const InteractiveImageDisplay = forwardRef<InteractiveImageDisplayRef, InteractiveImageDisplayProps>(
  ({ imageFile, onSelectionChange, maxDisplayWidth = 800, maxDisplayHeight = 600 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [drawingPaths, setDrawingPaths] = useState<Path[]>([]); // Store multiple paths
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<Path>([]); // The path currently being drawn

    // Load image
    useEffect(() => {
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setImage(img);
            setDrawingPaths([]); // Clear previous drawings when new image loads
            onSelectionChange(false);
          };
          img.onerror = () => {
            console.error("Error loading image source.");
            setImage(null);
            setDrawingPaths([]);
            onSelectionChange(false);
          }
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
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!image) {
        // If no image, set canvas to placeholder size and draw placeholder
        const placeholderWidth = maxDisplayWidth;
        // Ensure placeholder has a minimum sensible height
        const placeholderHeight = Math.max(200, maxDisplayHeight); 

        if (canvas.width !== placeholderWidth || canvas.height !== placeholderHeight) {
            canvas.width = placeholderWidth;
            canvas.height = placeholderHeight;
        }
        ctx.fillStyle = '#334155'; // bg-slate-700
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94A3B8'; // text-slate-400
        ctx.textAlign = 'center';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText('Image display area', canvas.width / 2, canvas.height / 2);
        return;
      }
      
      // Calculate scale to fit image within max dimensions
      const scaleX = maxDisplayWidth / image.naturalWidth;
      const scaleY = maxDisplayHeight / image.naturalHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down or native

      const displayWidth = image.naturalWidth * scale;
      const displayHeight = image.naturalHeight * scale;
      
      // Set canvas dimensions IF THEY NEED TO CHANGE. Assigning to .width/.height clears the canvas.
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      } else {
        // If dimensions haven't changed, we still need to clear for re-drawing paths
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      // At this point, canvas is appropriately sized and cleared.

      // Draw image
      ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

      // Draw all committed paths
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)'; // Tailwind red-500 with good opacity
      ctx.lineWidth = 3; // Thickness for underlining/marking
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      drawingPaths.forEach(path => {
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

    }, [image, drawingPaths, currentPath, isDrawing, maxDisplayWidth, maxDisplayHeight]);
    

    const getMousePos = (canvas: HTMLCanvasElement, evt: MouseEvent | TouchEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in evt ? evt.touches[0].clientX : evt.clientX;
      const clientY = 'touches' in evt ? evt.touches[0].clientY : evt.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const handleInteractionStart = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!image || (event.nativeEvent instanceof MouseEvent && event.nativeEvent.button !== 0) ) return; // Only main mouse button for mouse events
      event.preventDefault(); // Prevent page scrolling on touch, and text selection on mouse drag

      const pos = getMousePos(canvasRef.current!, event.nativeEvent);
      setIsDrawing(true);
      setCurrentPath([pos]); // Start a new current path
    };

    const handleInteractionMove = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !image) return;
      event.preventDefault();

      const pos = getMousePos(canvasRef.current!, event.nativeEvent);
      setCurrentPath(prevPath => [...prevPath, pos]);
    };

    const handleInteractionEnd = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !image) return;
      event.preventDefault();

      setIsDrawing(false);
      if (currentPath.length > 1) { // Only add path if it's more than a dot
        const newPaths = [...drawingPaths, currentPath];
        setDrawingPaths(newPaths);
        onSelectionChange(newPaths.length > 0);
      }
      setCurrentPath([]); // Reset current path
    };


    useImperativeHandle(ref, () => ({
      getAnnotatedImageDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas || !image ) return null;
        // The useEffect ensures the canvas is up-to-date with all drawings
        return canvas.toDataURL('image/png');
      },
      clearSelection: () => {
        setDrawingPaths([]);
        setCurrentPath([]);
        setIsDrawing(false);
        onSelectionChange(false);
        // The useEffect will then clear the canvas and redraw the image
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={handleInteractionStart}
        onMouseMove={handleInteractionMove}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd} // End drawing if mouse leaves canvas while button pressed
        onTouchStart={handleInteractionStart}
        onTouchMove={handleInteractionMove}
        onTouchEnd={handleInteractionEnd}
        className="border-2 border-slate-500 rounded-md cursor-crosshair touch-none select-none"
        style={{ maxWidth: '100%', display: 'block' }} // ensure it's responsive and doesn't add extra space below
        aria-label="Interactive image canvas for drawing markings"
      />
    );
  }
);
InteractiveImageDisplay.displayName = "InteractiveImageDisplay";
