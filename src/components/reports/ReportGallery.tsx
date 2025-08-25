import React, { useState, useCallback, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface Attachment {
  id: number;
  category: 'image' | 'document' | 'video';
  url: string;
  filename: string;
  type: string;
  size: number;
}

interface ReportGalleryProps {
  attachments: Attachment[];
}

export const ReportGallery: React.FC<ReportGalleryProps> = ({ attachments }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = attachments.filter(a => a.category === 'image');
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    
    switch (e.key) {
      case 'Escape':
        setLightboxIndex(null);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setLightboxIndex((prev) => 
          prev === null ? null : (prev - 1 + images.length) % images.length
        );
        break;
      case 'ArrowRight':
        e.preventDefault();
        setLightboxIndex((prev) => 
          prev === null ? null : (prev + 1) % images.length
        );
        break;
    }
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Aucune image attachée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((img, index) => (
        <button
          key={img.id}
          onClick={() => setLightboxIndex(index)}
          className="relative aspect-square overflow-hidden rounded-lg border hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <img
            src={img.url}
            alt={img.filename}
            className="object-cover w-full h-full transition-transform hover:scale-105"
          />
        </button>
      ))}
      
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <img
            src={images[lightboxIndex].url}
            alt={images[lightboxIndex].filename}
            className="max-w-[90%] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-0 right-0 text-center text-white">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};
