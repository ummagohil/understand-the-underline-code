
import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
        setFileName(file.name);
      } else {
        alert('Please select a valid image file (e.g., PNG, JPG, GIF).');
        setFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
       if (file.type.startsWith('image/')) {
        onImageUpload(file);
        setFileName(file.name);
      } else {
        alert('Please select a valid image file (e.g., PNG, JPG, GIF).');
        setFileName(null);
      }
    }
  }, [onImageUpload, disabled]);


  return (
    <div className="bg-slate-700 p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-3 text-sky-400">Upload Image</h2>
      <label
        htmlFor="image-upload-input"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-32 px-4 transition bg-slate-600 border-2 border-slate-500 border-dashed rounded-md appearance-none cursor-pointer hover:border-sky-400 focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="flex items-center space-x-2">
          <UploadCloud className="w-8 h-8 text-slate-400" />
          <span className="font-medium text-slate-300">
            {fileName ? `${fileName}` : 'Drop files to attach, or '}
            {!fileName && <span className="text-sky-400 underline">browse</span>}
          </span>
        </span>
         {!fileName && <span className="mt-1 text-xs text-slate-400">Supports PNG, JPG, GIF</span>}
      </label>
      <input
        id="image-upload-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only" 
        disabled={disabled}
      />
       {fileName && (
         <button 
            onClick={() => {
                setFileName(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                // Potentially call a prop to clear the image in App.tsx if needed
            }}
            className="mt-2 text-xs text-red-400 hover:text-red-300"
            disabled={disabled}
         >
            Clear uploaded file
         </button>
       )}
    </div>
  );
};
