import { useState, useRef, useCallback } from "react";
import {
  ImageUploader,
  InteractiveImageDisplay,
  LoadingSpinner,
  AlertTriangle,
  Lightbulb,
  UploadCloud,
  XCircle,
  Edit3,
} from "./src/components";
import { InteractiveImageDisplayRef } from "./src/components/InteractiveImageDisplay";
import { getExplanationForImageRegion } from "./utils/geminiService";

const App = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null);
  const [hasMarkings, setHasMarkings] = useState<boolean>(false);

  const interactiveImageRef = useRef<InteractiveImageDisplayRef>(null);

  const handleImageUpload = (file: File) => {
    setUploadedFile(file);
    setGeminiResponse(null);
    setError(null);
    setHasMarkings(false);
    interactiveImageRef.current?.clearSelection();
  };

  const handleMarkingsChange = useCallback((markingsExist: boolean) => {
    setHasMarkings(markingsExist);
  }, []); // Memoize with useCallback

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
      setError(
        "Please mark or underline the area on the image to learn about."
      );
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
  }, [uploadedFile, hasMarkings]); // hasMarkings is a dependency here

  const handleClear = () => {
    setUploadedFile(null);
    setGeminiResponse(null);
    setError(null);
    setHasMarkings(false);
    interactiveImageRef.current?.clearSelection();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-gray-100 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
          Image Region Learner
        </h1>
        <p className="text-slate-300 mt-2 text-sm sm:text-base">
          Upload an image, mark or underline a region, and let AI explain it.
        </p>
      </header>

      <div className="w-full max-w-5xl bg-slate-800 shadow-2xl rounded-xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column: Image Upload and Display */}
          <div className="flex flex-col space-y-6">
            <ImageUploader
              onImageUpload={handleImageUpload}
              disabled={isLoading}
            />

            {uploadedFile ? (
              <div className="bg-slate-700 p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-3 text-sky-400 flex items-center">
                  <Edit3 className="w-6 h-6 mr-2 text-sky-500" /> Interactive
                  Image
                </h2>
                <p className="text-sm text-slate-400 mb-2">
                  Click and drag on the image to underline or mark areas of
                  interest.
                </p>
                <InteractiveImageDisplay
                  ref={interactiveImageRef}
                  imageFile={uploadedFile}
                  onSelectionChange={handleMarkingsChange}
                  maxDisplayWidth={600}
                  maxDisplayHeight={450}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-slate-700 rounded-lg border-2 border-dashed border-slate-600 text-slate-400">
                <UploadCloud className="w-16 h-16 mb-4" />
                <p className="text-lg">Upload an image to get started</p>
              </div>
            )}
          </div>

          {/* Right Column: Controls and Results */}
          <div className="flex flex-col space-y-6">
            <div className="bg-slate-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-3 text-sky-400">
                Controls
              </h2>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleLearn}
                  disabled={!uploadedFile || !hasMarkings || isLoading}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lightbulb className="w-5 h-5 mr-2" />
                  {isLoading ? "Learning..." : "Learn About Markings"}
                </button>
                <button
                  onClick={handleClear}
                  disabled={isLoading && !uploadedFile} // Condition might need review based on desired behavior when loading
                  className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Clear All
                </button>
              </div>
            </div>

            {error && (
              <div
                className="bg-red-700/50 border border-red-500 text-red-100 px-4 py-3 rounded-lg shadow-md flex items-start"
                role="alert"
              >
                <AlertTriangle className="w-5 h-5 mr-3 mt-1 text-red-300" />
                <div>
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline ml-1">{error}</span>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center h-48 bg-slate-700 rounded-lg p-4 shadow-md">
                <LoadingSpinner />
                <p className="mt-4 text-slate-300">AI is thinking...</p>
              </div>
            )}

            {geminiResponse && !isLoading && (
              <div className="bg-slate-700 p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-3 text-sky-400">
                  Explanation
                </h2>
                <div className="prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap">
                  {geminiResponse}
                </div>
              </div>
            )}
            {!geminiResponse &&
              !isLoading &&
              !error &&
              uploadedFile &&
              hasMarkings && (
                <div className="flex flex-col items-center justify-center h-48 bg-slate-700 rounded-lg p-4 text-slate-400 shadow-md">
                  <Lightbulb className="w-12 h-12 mb-3" />
                  <p>
                    Click "Learn About Markings" to get an explanation for the
                    marked area.
                  </p>
                </div>
              )}
            {!geminiResponse &&
              !isLoading &&
              !error &&
              uploadedFile &&
              !hasMarkings && (
                <div className="flex flex-col items-center justify-center h-48 bg-slate-700 rounded-lg p-4 text-slate-400 shadow-md">
                  <Edit3 className="w-12 h-12 mb-3 text-sky-500" />
                  <p>
                    Use your cursor to mark or underline parts of the image you
                    want to understand.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
