'use client';

import { useState, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { tenantApi } from "@/lib/api";
import { XIcon, ArrowUpIcon, ArrowDownIcon } from "../icons";
import MediaLibraryModal from '@/app/(tenant)/components/media/MediaLibraryModal';

type ImageUploaderProps = {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
};

export default function ImageUploader({ images, onChange, maxImages = 10, label = "Images" }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleFileSelect = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxImages - images.length;
      const validFiles = fileArray.slice(0, remainingSlots);

      if (validFiles.length === 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      if (validFiles.length < fileArray.length) {
        toast.error(`Only ${remainingSlots} more image(s) can be uploaded`);
      }

      setIsUploading(true);

      try {
        const uploadPromises = validFiles.map(async (file) => {
          // Validate file
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`${file.name}: File exceeds 10MB limit`);
          }
          if (!file.type.startsWith('image/')) {
            throw new Error(`${file.name}: Only images are supported`);
          }

          const formData = new FormData();
          formData.append("file", file);

          const response = await tenantApi.mediaUpload(formData);
          
          // Handle different response formats
          let asset: any = null;
          if (Array.isArray(response)) {
            asset = response[0];
          } else if ((response as any).assets && Array.isArray((response as any).assets)) {
            asset = (response as any).assets[0];
          } else if ((response as any).id || (response as any).asset_id) {
            asset = response;
          }
          
          if (asset && (asset.id || asset.asset_id)) {
            const urls = asset.urls || (asset.url ? [asset.url] : []);
            return urls[0] || asset.url || "";
          }
          
          throw new Error(`No URL returned from upload`);
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        onChange([...images, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
      } catch (error: any) {
        toast.error(error.message || "Failed to upload images");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [images, maxImages, onChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        void handleFileSelect(files);
      }
    },
    [handleFileSelect]
  );

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < images.length) {
      [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
      onChange(newImages);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-100">
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'up')}
                    className="p-1.5 rounded bg-white/90 hover:bg-white transition"
                    title="Move up"
                  >
                    <ArrowUpIcon className="w-4 h-4 text-gray-700" />
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'down')}
                    className="p-1.5 rounded bg-white/90 hover:bg-white transition"
                    title="Move down"
                  >
                    <ArrowDownIcon className="w-4 h-4 text-gray-700" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1.5 rounded bg-white/90 hover:bg-white transition"
                  title="Remove"
                >
                  <XIcon className="w-4 h-4 text-red-600" />
                </button>
              </div>
              {index === 0 && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-white text-[10px] font-semibold rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Choose images to upload"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:flex-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  Uploading...
                </span>
              ) : (
                `+ Add Image${images.length < maxImages - 1 ? 's' : ''} (${images.length}/${maxImages})`
              )}
            </button>

            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              disabled={isUploading}
              className="w-full sm:w-auto inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Choose from library
            </button>
          </div>
        </div>
      )}

      {images.length >= maxImages && (
        <p className="text-xs text-gray-500">Maximum {maxImages} images reached</p>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(urls) => {
          const remaining = maxImages - images.length;
          const chosen = urls.slice(0, remaining);
          if (chosen.length === 0) return;
          onChange([...images, ...chosen]);
          toast.success(`${chosen.length} image(s) added from library`);
          setLibraryOpen(false);
        }}
      />
    </div>
  );
}
