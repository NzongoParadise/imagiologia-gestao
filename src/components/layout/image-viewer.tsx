"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";

interface ImageViewerProps {
  images: Array<{
    id: number;
    url: string;
    name: string;
    thumbnail?: string;
  }>;
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function ImageViewer({
  images,
  initialIndex = 0,
  open,
  onClose,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];

  // Sync initialIndex prop
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Reset zoom/rotation on image change
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Define handlers before useEffect that references them
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation((prev) => prev + 90);

  const handleDownload = async () => {
    if (!currentImage) return;
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentImage.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = currentImage.url;
      a.download = currentImage.name;
      a.target = "_blank";
      a.click();
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setDragging(false);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) {
          document.exitFullscreen();
          setFullscreen(false);
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, fullscreen, onClose, goToPrev, goToNext]);

  if (!open || !currentImage) return null;

  const hasMultipleImages = images.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95">
      {/* Header */}
      <div className="absolute left-0 top-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          {hasMultipleImages && (
            <span className="text-sm text-white/60">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>
        <p className="text-sm text-white/80 truncate max-w-md">
          {currentImage.name}
        </p>
      </div>

      {/* Main Image */}
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? "grab" : "default" }}
      >
        <motion.img
          key={currentImage.id}
          src={currentImage.url}
          alt={currentImage.name}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            maxWidth: "90%",
            maxHeight: "85%",
            objectFit: "contain",
          }}
          className="select-none"
          draggable={false}
        />
      </div>

      {/* Navigation Arrows */}
      {hasMultipleImages && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Seguinte"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Toolbar */}
      <div className="absolute left-1/2 bottom-6 -translate-x-1/2 flex items-center gap-1 rounded-xl bg-white/10 backdrop-blur-xl p-1.5">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 disabled:opacity-30 transition-colors"
          aria-label="Afastar"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="min-w-[3rem] text-center text-xs font-medium text-white/80">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 5}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 disabled:opacity-30 transition-colors"
          aria-label="Aproximar"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button
          onClick={handleRotate}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 transition-colors"
          aria-label="Rodar"
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 transition-colors"
          aria-label={fullscreen ? "Sair de ecrã inteiro" : "Ecrã inteiro"}
        >
          {fullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={handleDownload}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 transition-colors"
          aria-label="Descarregar"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>

      {/* Thumbnail strip */}
      {hasMultipleImages && (
        <div className="absolute left-0 right-0 bottom-24 flex justify-center gap-2 px-4">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                idx === currentIndex
                  ? "border-white opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80"
              )}
            >
              <img
                src={img.thumbnail || img.url}
                alt={img.name}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ImageGallery({
  images,
  className,
}: {
  images: Array<{ id: number; url: string; name: string }>;
  className?: string;
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
        <ImageIcon className="h-12 w-12 mb-3" />
        <p className="text-sm">Nenhuma imagem disponível</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", className)}>
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => {
              setSelectedIndex(idx);
              setViewerOpen(true);
            }}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all hover:ring-2 hover:ring-primary/50"
          >
            <img
              src={img.url}
              alt={img.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      {viewerOpen && (
        <ImageViewer
          images={images}
          initialIndex={selectedIndex}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

