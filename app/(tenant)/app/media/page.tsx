'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useMedia, useUploadMedia, useDeleteMedia, useUpdateMedia } from "@/app/(tenant)/hooks/useMedia";
import {
  ImageIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  XIcon,
  TrashIcon,
  TagIcon,
  EyeIcon,
  PencilIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
} from "../../components/icons";
import Select from "@/app/(tenant)/components/ui/Select";
import { Pagination } from "@/app/(tenant)/components/ui/Pagination";
import ConfirmModal from '@/app/components/ConfirmModal';
import { MediaSidebar } from "../../components/media/MediaSidebar";
import { MediaQuickView } from "../../components/media/MediaQuickView";

type ViewMode = "grid" | "list";
type MediaAsset = {
  id: number;
  type: 'image' | 'video' | 'carousel';
  name: string;
  caption?: string | null;
  urls: string[];
  url?: string;
  thumbnail_url?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export default function MediaLibraryPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [previewMedia, setPreviewMedia] = useState<{ id: string; url: string; type?: string } | null>(null);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [showDeleteMediaId, setShowDeleteMediaId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for sidebar and quick view
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [quickViewAsset, setQuickViewAsset] = useState<MediaAsset | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: assets = [], isLoading, error } = useMedia({
    q: query || undefined,
    type: type || undefined
  });
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const updateMutation = useUpdateMedia();

  // Get all unique tags from assets
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    assets.forEach((asset) => {
      asset.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [assets]);

  const filtered = useMemo(() => {
    let result = assets.map((asset) => ({
      ...asset,
      url: asset.url || asset.urls?.[0] || "",
      thumbnail_url: asset.thumbnail_url || asset.urls?.[0] || "",
    }));

    // Filter by selected tags
    if (selectedTags.length > 0) {
      result = result.filter((asset) =>
        selectedTags.some((tag) => asset.tags?.includes(tag))
      );
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        cutoff.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        cutoff.setMonth(now.getMonth() - 1);
      }
      result = result.filter((asset) => new Date(asset.created_at) >= cutoff);
    }

    return result;
  }, [assets, selectedTags, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedMedia = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, type]);

  const toggleMedia = (mediaId: string | number) => {
    const idStr = String(mediaId);
    if (selectedMediaIds.includes(idStr)) {
      setSelectedMediaIds(selectedMediaIds.filter((id) => id !== idStr));
    } else {
      setSelectedMediaIds([...selectedMediaIds, idStr]);
    }
  };

  const selectAll = () => {
    setSelectedMediaIds(filtered.map((asset) => String(asset.id)));
  };

  const clearSelection = () => {
    setSelectedMediaIds([]);
    setIsBulkActionOpen(false);
  };

  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };
  const confirmBulkDelete = () => {
    selectedMediaIds.forEach((id) => {
      deleteMutation.mutate(id);
    });
    clearSelection();
    setShowBulkDeleteConfirm(false);
  };

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    // Validate files before upload
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      // Check file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        errors.push(`${file.name}: Invalid file type. Only images and videos are supported.`);
        return;
      }

      // Check file size (50MB limit for videos, 10MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for videos, 10MB for images
      if (file.size > maxSize) {
        const maxSizeMB = isVideo ? 50 : 10;
        errors.push(`${file.name}: File too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      // Still try to upload valid files
      if (validFiles.length === 0) {
        return; // No valid files to upload
      }
    }

    if (validFiles.length === 0) {
      toast.error('No valid files to upload');
      return;
    }

    // Create FormData with valid files
    const form = new FormData();
    validFiles.forEach((file) => {
      form.append("file", file);
    });

    try {
      await uploadMutation.mutateAsync(form);
      setIsUploadOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Show success message with file count
      if (validFiles.length > 0) {
        const videoCount = validFiles.filter(f => f.type.startsWith('video/')).length;
        const imageCount = validFiles.filter(f => f.type.startsWith('image/')).length;
        let message = 'Media uploaded successfully';
        if (videoCount > 0 && imageCount > 0) {
          message = `${imageCount} image(s) and ${videoCount} video(s) uploaded`;
        } else if (videoCount > 0) {
          message = `${videoCount} video(s) uploaded successfully`;
        } else {
          message = `${imageCount} image(s) uploaded successfully`;
        }
        toast.success(message);
      }
    } catch (error: any) {
      void error;
      // Don't close modal on error so user can retry
    }
  }

  // Close bulk actions when no items selected
  useEffect(() => {
    if (selectedMediaIds.length === 0) {
      setIsBulkActionOpen(false);
    }
  }, [selectedMediaIds.length]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we're leaving the container (not entering a child)
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  }, []);

  // Handle quick view update
  const handleQuickViewUpdate = useCallback((id: string, data: { caption?: string; tags?: string[] }) => {
    updateMutation.mutate({ assetId: id, payload: data });
  }, [updateMutation]);

  // Handle quick view delete
  const handleQuickViewDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
    setQuickViewAsset(null);
  }, [deleteMutation]);

  return (
    <div
      className="space-y-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
          <div className="rounded-2xl border-4 border-dashed border-primary bg-white/90 dark:bg-gray-800/90 p-12 text-center shadow-2xl">
            <ArrowUpTrayIcon className="mx-auto h-16 w-16 text-primary mb-4" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white">Drop files to upload</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Images and videos supported</p>
          </div>
        </div>
      )}

      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6 shadow-xl dark:border-gray-600 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:p-8 md:p-10">
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <div className="absolute inset-0 dark:hidden" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
          <div className="absolute inset-0 hidden dark:block" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <ImageIcon className="h-6 w-6 text-white/90 sm:h-7 sm:w-7" />
                <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Media Library</h1>
              </div>
              <p className="text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
                Manage your images and videos for posts and campaigns
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
              >
                <PlusIcon className="w-4 h-4" />
                Upload Media
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search media by name, caption, or tags..."
              className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-500 transition hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`rounded-lg border p-2.5 transition ${!sidebarCollapsed
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary'
                }`}
              title={sidebarCollapsed ? "Show filters" : "Hide filters"}
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
            {(type || selectedTags.length > 0 || dateRange !== 'all') && (
              <button
                onClick={() => {
                  setType(undefined);
                  setQuery("");
                  setSelectedTags([]);
                  setDateRange('all');
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary"
                title="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-2 transition ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              aria-label="Grid view"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-2 transition ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              aria-label="List view"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Inline Filter Panel */}
        {!sidebarCollapsed && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex flex-wrap gap-6">
              {/* Type Filter */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: undefined, label: 'All' },
                    { value: 'image', label: 'Images' },
                    { value: 'video', label: 'Videos' },
                    { value: 'carousel', label: 'Carousels' },
                  ].map((option) => (
                    <button
                      key={option.value ?? 'all'}
                      onClick={() => setType(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${type === option.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Upload Date</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'all' as const, label: 'All Time' },
                    { value: 'today' as const, label: 'Today' },
                    { value: 'week' as const, label: 'This Week' },
                    { value: 'month' as const, label: 'This Month' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${dateRange === option.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              {availableTags.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.slice(0, 10).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedTags.includes(tag)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selection Controls */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {selectedMediaIds.length > 0 ? (
                  <>
                    <span className="text-primary">{selectedMediaIds.length}</span> media item{selectedMediaIds.length !== 1 ? "s" : ""} selected
                  </>
                ) : (
                  <span className="text-gray-500">No media selected</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedMediaIds.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsBulkActionOpen(!isBulkActionOpen)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  <TagIcon className="h-3.5 w-3.5" />
                  Bulk Actions
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Delete Selected
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
                >
                  Clear
                </button>
              </>
            )}
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Select All
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Menu */}
      {isBulkActionOpen && selectedMediaIds.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Bulk Actions</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              <TagIcon className="h-4 w-4" />
              Add Tags
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Captions
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-video animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
          <XIcon className="mx-auto h-12 w-12 text-rose-400" />
          <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load media</p>
          <p className="mt-1 text-xs text-rose-700">{error.message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
          <ImageIcon className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-semibold text-gray-900">No media found</p>
          <p className="mt-2 text-sm text-gray-600">Upload your first image or video to get started.</p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
          >
            <PlusIcon className="w-4 h-4" />
            Upload Media
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedMedia.map((asset, index) => {
              const isSelected = selectedMediaIds.includes(String(asset.id));
              const selectionIndex = isSelected ? selectedMediaIds.indexOf(String(asset.id)) + 1 : null;
              return (
                <div key={asset.id} className="relative group">
                  <div
                    className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${isSelected
                      ? "border-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]"
                      : "border-gray-200 hover:border-primary/50 hover:shadow-md"
                      } bg-white`}
                    onClick={() => toggleMedia(asset.id)}
                    onDoubleClick={() => setQuickViewAsset(asset as MediaAsset)}
                  >
                    <div className="relative aspect-video overflow-hidden bg-gray-50">
                      {asset.type === 'video' ? (
                        <video
                          src={asset.url}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.thumbnail_url || asset.url}
                          alt={asset.caption || `Media ${index + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      )}
                      {/* Selection Badge */}
                      {isSelected && (
                        <>
                          <div className="absolute inset-0 bg-primary/10" />
                          <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg">
                            {selectionIndex}
                          </div>
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                            <CheckCircleIcon className="h-4 w-4" />
                          </div>
                        </>
                      )}
                      {/* Type Badge */}
                      <span className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                        {asset.type}
                      </span>
                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const previewUrl = (asset.url || asset.thumbnail_url || "") as string;
                          if (previewUrl) {
                            setPreviewMedia({ id: String(asset.id), url: previewUrl, type: asset.type });
                          }
                        }}
                        className="absolute left-2 bottom-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm"
                        aria-label="Preview media"
                      >
                        {asset.type === 'video' ? (
                          <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="space-y-2 p-3">
                      <p className="line-clamp-2 text-xs text-gray-600">{asset.caption || "No caption"}</p>
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.slice(0, 2).map((t) => (
                            <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                              {t}
                            </span>
                          ))}
                          {asset.tags.length > 2 && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                              +{asset.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit functionality
                          }}
                          className="flex items-center gap-1 font-medium text-primary hover:text-primary/80 transition"
                        >
                          <PencilIcon className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteMediaId(String(asset.id));
                          }}
                          className="flex items-center gap-1 font-medium text-rose-600 hover:text-rose-700 transition"
                        >
                          <TrashIcon className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filtered.length}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedMedia.map((asset) => {
              const isSelected = selectedMediaIds.includes(String(asset.id));
              return (
                <div
                  key={asset.id}
                  className={`flex items-center gap-4 rounded-xl border-2 p-4 transition ${isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white hover:border-primary/50"
                    }`}
                >
                  <div
                    className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg"
                    onClick={() => toggleMedia(asset.id)}
                  >
                    {asset.type === 'video' ? (
                      <video
                        src={asset.url}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.thumbnail_url || asset.url}
                        alt={asset.caption || "Media"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <CheckCircleIcon className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{asset.caption || "No caption"}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500 capitalize">{asset.type}</span>
                      {asset.tags && asset.tags.length > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <div className="flex flex-wrap gap-1">
                            {asset.tags.slice(0, 3).map((t) => (
                              <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                {t}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const previewUrl = (asset.url || asset.thumbnail_url || "") as string;
                        if (previewUrl) {
                          setPreviewMedia({ id: String(asset.id), url: previewUrl, type: asset.type });
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                    >
                      {asset.type === 'video' ? (
                        <svg className="h-3.5 w-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        <EyeIcon className="h-3.5 w-3.5" />
                      )}
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteMediaId(String(asset.id));
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filtered.length}
              />
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            {previewMedia.type === 'video' ? (
              <video
                src={previewMedia.url}
                controls
                className="max-h-[90vh] rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewMedia.url}
                alt="Preview"
                className="max-h-[90vh] rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute right-4 top-4 rounded-full bg-black/70 p-2 text-white transition hover:bg-black/90"
              aria-label="Close preview"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upload Media</h2>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close upload modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <ArrowUpTrayIcon className="h-8 w-8 text-primary" />
                </div>
                <p className="mb-2 text-sm font-semibold text-gray-900">Choose files to upload</p>
                <p className="mb-4 text-xs text-gray-500">Images and videos are supported</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
                >
                  <PlusIcon className="h-4 w-4" />
                  Select Files
                </label>
              </div>
              {uploadMutation.isPending && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-800">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600/20 border-t-blue-600" />
                  Uploading...
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteMediaId && (
        <ConfirmModal
          open={true}
          title="Delete media"
          description="Are you sure you want to delete this media? This cannot be undone."
          confirmText="Delete"
          onConfirm={() => { deleteMutation.mutate(showDeleteMediaId); setShowDeleteMediaId(null); }}
          onCancel={() => setShowDeleteMediaId(null)}
        />
      )}

      {showBulkDeleteConfirm && (
        <ConfirmModal
          open={true}
          title="Delete selected media"
          description={`Are you sure you want to delete ${selectedMediaIds.length} media item(s)? This cannot be undone.`}
          confirmText="Delete"
          onConfirm={confirmBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
        />
      )}

      {/* Quick View Panel (Modal) */}
      {quickViewAsset && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setQuickViewAsset(null)}
          />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-80 shadow-xl">
            <MediaQuickView
              asset={quickViewAsset}
              onClose={() => setQuickViewAsset(null)}
              onDelete={handleQuickViewDelete}
              onUpdate={handleQuickViewUpdate}
              isDeleting={deleteMutation.isPending}
              isUpdating={updateMutation.isPending}
            />
          </div>
        </>
      )}

    </div>
  );
}
