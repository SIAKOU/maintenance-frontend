import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, FileText, Video, Music } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { useToast } from '@/hooks/use-toast';

interface ImagePreviewProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // en bytes
  allowedTypes?: string[];
  label?: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB par défaut
  allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'video/mp4', 'video/avi', 'video/mov',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  label = "Fichiers",
  accept = "image/*,video/*,.pdf,.doc,.docx,.txt",
  multiple = true,
  className = ""
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-6 w-6" />;
    if (file.type.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (file.type.startsWith('audio/')) return <Music className="h-6 w-6" />;
    return <FileText className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Type de fichier non autorisé",
        description: `${file.name} n'est pas un type de fichier autorisé`,
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: `${file.name} dépasse la taille maximale de ${formatFileSize(maxSize)}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Trop de fichiers",
        description: `Maximum ${maxFiles} fichiers autorisés`,
        variant: "destructive",
      });
      return;
    }

    const validFiles = newFiles.filter(validateFile);
    
    if (validFiles.length > 0) {
      // Créer les aperçus pour les images
      validFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPreviews(prev => ({
              ...prev,
              [file.name]: event.target?.result as string
            }));
          };
          reader.readAsDataURL(file);
        }
      });

      onFilesChange([...files, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    const newFiles = files.filter((_, i) => i !== index);
    
    // Supprimer l'aperçu
    if (previews[fileToRemove.name]) {
      setPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[fileToRemove.name];
        return newPreviews;
      });
    }
    
    onFilesChange(newFiles);
  };

  const clearAll = () => {
    onFilesChange([]);
    setPreviews({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center space-x-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="flex-1"
          />
          {files.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAll}
            >
              <X className="h-4 w-4 mr-1" />
              Tout supprimer
            </Button>
          )}
        </div>
        {files.length > 0 && (
          <div className="text-sm text-gray-500">
            {files.length} fichier(s) sélectionné(s) - {files.reduce((acc, file) => acc + file.size, 0) > 0 ? 
              `Total: ${formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}` : ''}
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative group border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Bouton supprimer */}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* Aperçu */}
              <div className="aspect-square mb-2 overflow-hidden rounded">
                {previews[file.name] ? (
                  <img
                    src={previews[file.name]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    {getFileIcon(file)}
                  </div>
                )}
              </div>

              {/* Informations du fichier */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {file.type.split('/')[1] || file.type}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePreview; 