import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  UploadCloud, 
  Lightbulb, 
  AlertTriangle, 
  XCircle, 
  Edit3 
} from '../icons';

describe('Icons', () => {
  it('renders UploadCloud icon with default props', () => {
    const { container } = render(<UploadCloud />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('applies custom className to UploadCloud icon', () => {
    const { container } = render(<UploadCloud className="custom-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders Lightbulb icon with default props', () => {
    const { container } = render(<Lightbulb />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('renders AlertTriangle icon with default props', () => {
    const { container } = render(<AlertTriangle />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('renders XCircle icon with default props', () => {
    const { container } = render(<XCircle />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('renders Edit3 icon with default props', () => {
    const { container } = render(<Edit3 />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('applies custom className to all icons', () => {
    const icons = [
      { Component: UploadCloud, name: 'UploadCloud' },
      { Component: Lightbulb, name: 'Lightbulb' },
      { Component: AlertTriangle, name: 'AlertTriangle' },
      { Component: XCircle, name: 'XCircle' },
      { Component: Edit3, name: 'Edit3' },
    ];

    icons.forEach(({ Component, name }) => {
      const { container } = render(<Component className={`test-${name}`} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass(`test-${name}`);
    });
  });
});
