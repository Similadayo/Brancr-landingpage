'use client';

import { useState, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { tenantApi } from "@/lib/api";

export type UploadedMedia = {
  id: string;
  url: string;
  type: "image" | "video" | "carousel";
  name?: string;
  thumbnail_url?: string;
};

type UploadStatus = {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  mediaId?: string;
  error?: string;
};

type MediaUploaderProps = {
  onUploadComplete: (media: UploadedMedia[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
};

const MAX_FILE_SIZE_MB = 50;
const MAX_FILES = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/mov", "video/webm"];

export default function MediaUploader({
  onUploadComplete,
  maxFiles = MAX_FILES,
  acceptedTypes = ACCEPTED_TYPES,
  maxFileSize = MAX_FILE_SIZE_MB,
}: MediaUploaderProps) {
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedMedia | null> => {
      // Validate file
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`${file.name}: File exceeds ${maxFileSize}MB limit`);
        return null;
      }
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only images and videos are supported`);
        return null;
      }

      const formData = new FormData();
      formData.append("files", file);

      try {
        const response = await tenantApi.mediaUpload(formData);
        if (response.assets && Array.isArray(response.assets) && response.assets.length > 0) {
          const asset = response.assets[0] as any;
          return {
            id: asset.id,
            url: asset.url,
            type: asset.type || (file.type.startsWith("image/") ? "image" : "video"),
            name: file.name,
            thumbnail_url: asset.thumbnail_url,
          };
        }
        throw new Error("No asset returned from upload");
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message || "Upload failed"}`);
        throw error;
      }
    },
    [maxFileSize, acceptedTypes, validateFile]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.slice(0, maxFiles);

      if (validFiles.length === 0) {
        toast.error("No valid files selected");
        return;
      }

      if (validFiles.length < fileArray.length) {
        toast.error(`Only ${maxFiles} files can be uploaded at once`);
      }

      // Initialize upload statuses
      const statuses: UploadStatus[] = validFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading",
      }));
      setUploadStatuses(statuses);

      // Upload files in parallel
      const uploadPromises = validFiles.map(async (file, index) => {
        try {
          const media = await uploadFile(file);
          if (media) {
            setUploadStatuses((prev) => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                progress: 100,
                status: "success",
                mediaId: media.id,
              };
              return updated;
            });
            return media;
          }
        } catch (error) {
          setUploadStatuses((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              status: "error",
              error: "Upload failed",
            };
            return updated;
          });
        }
        return null;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r): r is UploadedMedia => r !== null);

      if (successfulUploads.length > 0) {
        onUploadComplete(successfulUploads);
        toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
      }
    },
    [maxFiles, uploadFile, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        void handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        void handleFiles(files);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((index: number) => {
    setUploadStatuses((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-upload successful files to notify parent
      const successful = updated.filter((s) => s.status === "success" && s.mediaId);
      if (successful.length > 0) {
        // This is a simplified version - in a real app, you'd want to track uploaded media IDs
      }
      return updated;
    });
  }, []);

  const hasUploads = uploadStatuses.length > 0;
  const hasSuccessfulUploads = uploadStatuses.some((s) => s.status === "success");

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
            📤
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Drag and drop files here</p>
            <p className="mt-1 text-xs text-gray-500">or</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90"
            >
              Choose Files
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Supports images and videos • Max {maxFileSize}MB per file • Up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {hasUploads && (
        <div className="space-y-2">
          {uploadStatuses.map((status, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{status.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(status.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {status.status === "uploading" && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                      <span className="text-xs text-gray-500">Uploading...</span>
                    </div>
                  )}
                  {status.status === "success" && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-xs text-green-600">Uploaded</span>
                    </div>
                  )}
                  {status.status === "error" && (
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      <span className="text-xs text-red-600">{status.error || "Failed"}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {status.status === "uploading" && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasSuccessfulUploads && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs text-green-800">
          ✓ Files uploaded successfully. Continue to the next step to select media.
        </div>
      )}
    </div>
  );
}

