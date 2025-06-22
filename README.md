# 📝 Understand the Underline Codebase

## 📦 Structure of the Project

This app is built with React and Vite. It uses the Google GenAI API to underline words in images and analyse the text. It is a single page app that allows users to upload an image, underlined text in a image and then get a summary of the text.

### Components

All components are in the `components/` folder and correspond to the functionality for each part of the app.

The ImageUploader component is used to upload an image to the app. The user has the ability to drag and drop an image or click to upload an image.

```tsx
const handleDragOver = useCallback(
  (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  },
  []
);

const handleDrop = useCallback(
  (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        onImageUpload(file);
        setFileName(file.name);
      } else {
        alert("Please select a valid image file (e.g., PNG, JPG, GIF).");
        setFileName(null);
      }
    }
  },
  [onImageUpload, disabled]
);
```

Here we can see there are a range of different drag and drop handlers. The `handleDragOver` is used to prevent the default behaviour of the drag and drop event. The `handleDrop` is used to handle the drop event.

The `onImageUpload` is a callback function that is passed to the ImageUploader component. It is used to upload the image to the app.

The `disabled` is a boolean that is used to disable the drag and drop functionality.

The `setFileName` is a function that is used to set the file name of the image.

The component incudes a `fileInputRef` that is used to reference the file input element. This is used to reset the file input when the user uploads a new image.

Other components include:

- `InteractiveImageDisplay`: this component is used to display the image and allow the user to draw a bounding box around the text they want to underline
- `LoadingSpinner`: this component is used to display a loading spinner when the app is loading
- `Icons`: this component is used to display the icons for the app

#### API

The app uses the Google GenAI API to underline words in images and analyse the text, this is done within the `utils/geminiService.ts` file, which sits outside of the `src/` folder.

The prompt is the main part of the app, it is here that the main functionality to underline the text in the image and analyse the text takes place. It sends the image and the prompt to the API and returns the underlined image and the analysis of the text.

Here are two key parts for the analysis of the text in the image:

```ts
const imagePart: Part = {
  inlineData: {
    mimeType: "image/png",
    data: base64DataWithoutPrefix,
  },
};

const textPart: Part = {
  text: PROMPT_TEXT,
};
```

This information is then sent to the model and the response is returned.

```ts
const response: GenerateContentResponse = await ai.models.generateContent({
  model: "gemini-2.5-flash-preview-04-17",
  contents: { parts: [imagePart, textPart] },
});
```

#### 🚀 Running the Project

```bash
npm run dev
```

### 🧠 Underlining Words in Images

This functionality takes place in the `InteractiveImageDisplay` component.

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
const [image, setImage] = useState<HTMLImageElement | null>(null);
const [drawingPaths, setDrawingPaths] = useState<Path[]>([]);
const [isDrawing, setIsDrawing] = useState(false);
const [currentPath, setCurrentPath] = useState<Path>([]);
```

A canvas is created and the image is displayed on it. The user can then draw a bounding box around the text they want to underline.

There is a `useEffect` that is used to load the image and display it on the canvas. This should be refactored to remove the setting of state within the function for better performance.

```tsx
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
```

There is a separate `useEffect` that is used to draw on top of the image and the bounding box on the canvas.

```tsx
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
```

In order to determine the position of the mouse, which is important with the canvas, there is a function to return these points.

```tsx
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
```

### 📊 Analysis of Words/Passages

This happens within the `geminiService` file in the utils folder. This data is sent back to the component to be displayed, as follows.

```ts
const handleLearn = useCallback(async () => {
  if (!process.env.API_KEY) {
    setError("API Key is missing. Please configure it in your environment.");
    console.error("Error: process.env.API_KEY is not set.");
    return;
  }

  if (!uploadedFile) {
    setError("Please upload an image first.");
    return;
  }
  if (!hasMarkings) {
    setError("Please mark or underline the area on the image to learn about.");
    return;
  }
  if (!interactiveImageRef.current) {
    setError("Image display component is not ready.");
    return;
  }

  const annotatedImageDataUrl =
    interactiveImageRef.current.getAnnotatedImageDataUrl();
  if (!annotatedImageDataUrl) {
    setError(
      "Could not get annotated image data. Please try re-marking the area."
    );
    return;
  }

  setIsLoading(true);
  setError(null);
  setGeminiResponse(null);

  try {
    const explanation = await getExplanationForImageRegion(
      annotatedImageDataUrl
    );
    setGeminiResponse(explanation);
  } catch (err) {
    console.error("Gemini API error:", err);
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred.";
    if (errorMessage.includes("API key not valid")) {
      setError(
        "Invalid API Key. Please check your API_KEY environment variable."
      );
    } else {
      setError(`Failed to get explanation: ${errorMessage}`);
    }
  } finally {
    setIsLoading(false);
  }
}, [uploadedFile, hasMarkings]);
```

### 🧪 Testing

Vitest is used to set up and unit test components. There is only one main component that has been unit tests, it's called `ImageUploader.test.tsx`.

```tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ImageUploader } from "../ImageUploader";

describe("ImageUploader", () => {
  const mockOnImageUpload = vi.fn();
  const createTestFile = (name: string, type: string, size: number) => {
    const file = new File(["test"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the upload interface correctly", () => {
    render(<ImageUploader onImageUpload={mockOnImageUpload} />);

    expect(screen.getByText("Upload Image")).toBeInTheDocument();
    expect(screen.getByText("Drop files to attach, or")).toBeInTheDocument();
    expect(screen.getByText("browse")).toBeInTheDocument();
    expect(screen.getByText("Supports PNG, JPG, GIF")).toBeInTheDocument();
  });

  it("calls onImageUpload when a valid image is selected", () => {
    const file = createTestFile("test.png", "image/png", 1024);
    const { container } = render(
      <ImageUploader onImageUpload={mockOnImageUpload} />
    );

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnImageUpload).toHaveBeenCalledTimes(1);
    expect(mockOnImageUpload).toHaveBeenCalledWith(file);
  });

  it("shows an alert for non-image files", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const file = createTestFile("test.txt", "text/plain", 1024);
    const { container } = render(
      <ImageUploader onImageUpload={mockOnImageUpload} />
    );

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(alertSpy).toHaveBeenCalledWith(
      "Please select a valid image file (e.g., PNG, JPG, GIF)."
    );
    expect(mockOnImageUpload).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("handles drag and drop for valid image", () => {
    const file = createTestFile("test.png", "image/png", 1024);
    render(<ImageUploader onImageUpload={mockOnImageUpload} />);

    const dropZone = screen
      .getByText("Drop files to attach, or")
      .closest("label")!;
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

    expect(mockOnImageUpload).toHaveBeenCalledTimes(1);
    expect(mockOnImageUpload).toHaveBeenCalledWith(file);
  });

  it("does not call onImageUpload when disabled", () => {
    const file = createTestFile("test.png", "image/png", 1024);
    const { container } = render(
      <ImageUploader onImageUpload={mockOnImageUpload} disabled={true} />
    );

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(input).toBeDisabled();

    // Instead of trying to set files directly, we'll test that the click handler doesn't work
    const label = container.querySelector("label");
    if (label) {
      fireEvent.click(label);
    }

    // Also test that the input's change handler doesn't get called
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.click(input);
    expect(clickSpy).toHaveBeenCalledTimes(0);
    clickSpy.mockRestore();

    // Test that the onImageUpload wasn't called
    expect(mockOnImageUpload).not.toHaveBeenCalled();
  });

  it("displays the file name after selection", () => {
    const file = createTestFile("test.png", "image/png", 1024);
    const { container } = render(
      <ImageUploader onImageUpload={mockOnImageUpload} />
    );

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("test.png")).toBeInTheDocument();
  });
});
```

### 📝 Contact

hello@umma.dev
