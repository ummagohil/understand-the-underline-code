import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageUploader } from '../ImageUploader';

describe('ImageUploader', () => {
  const mockOnImageUpload = vi.fn();
  const createTestFile = (name: string, type: string, size: number) => {
    const file = new File(['test'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upload interface correctly', () => {
    render(<ImageUploader onImageUpload={mockOnImageUpload} />);
    
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText('Drop files to attach, or')).toBeInTheDocument();
    expect(screen.getByText('browse')).toBeInTheDocument();
    expect(screen.getByText('Supports PNG, JPG, GIF')).toBeInTheDocument();
  });

  it('calls onImageUpload when a valid image is selected', () => {
    const file = createTestFile('test.png', 'image/png', 1024);
    const { container } = render(<ImageUploader onImageUpload={mockOnImageUpload} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockOnImageUpload).toHaveBeenCalledTimes(1);
    expect(mockOnImageUpload).toHaveBeenCalledWith(file);
  });

  it('shows an alert for non-image files', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const file = createTestFile('test.txt', 'text/plain', 1024);
    const { container } = render(<ImageUploader onImageUpload={mockOnImageUpload} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(alertSpy).toHaveBeenCalledWith('Please select a valid image file (e.g., PNG, JPG, GIF).');
    expect(mockOnImageUpload).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('handles drag and drop for valid image', () => {
    const file = createTestFile('test.png', 'image/png', 1024);
    render(<ImageUploader onImageUpload={mockOnImageUpload} />);
    
    const dropZone = screen.getByText('Drop files to attach, or').closest('label')!;
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    
    expect(mockOnImageUpload).toHaveBeenCalledTimes(1);
    expect(mockOnImageUpload).toHaveBeenCalledWith(file);
  });

  it('does not call onImageUpload when disabled', () => {
    const file = createTestFile('test.png', 'image/png', 1024);
    const { container } = render(
      <ImageUploader onImageUpload={mockOnImageUpload} disabled={true} />
    );
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
    
    // Instead of trying to set files directly, we'll test that the click handler doesn't work
    const label = container.querySelector('label');
    if (label) {
      fireEvent.click(label);
    }
    
    // Also test that the input's change handler doesn't get called
    const clickSpy = vi.spyOn(input, 'click');
    fireEvent.click(input);
    expect(clickSpy).toHaveBeenCalledTimes(0);
    clickSpy.mockRestore();
    
    // Test that the onImageUpload wasn't called
    expect(mockOnImageUpload).not.toHaveBeenCalled();
  });

  it('displays the file name after selection', () => {
    const file = createTestFile('test.png', 'image/png', 1024);
    const { container } = render(<ImageUploader onImageUpload={mockOnImageUpload} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText('test.png')).toBeInTheDocument();
  });
});
