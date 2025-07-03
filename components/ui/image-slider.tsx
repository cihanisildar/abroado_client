'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

interface ImageSliderProps {
  images: string[];
  className?: string;
  compact?: boolean; // For smaller preview mode
}

export function ImageSlider({ images, className = '', compact = false }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') setIsFullscreen(false);
  };

  return (
    <>
      <Card className={`overflow-hidden ${className}`}>
        <CardContent className="p-0">
          <div 
            className="relative group"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Main Image */}
            <div className={`relative w-full bg-gray-100 rounded-lg overflow-hidden ${compact ? 'h-64' : 'h-[500px]'} cursor-zoom-in`} onClick={() => setIsFullscreen(true)}>
              <Image
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1} of ${images.length}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                priority={currentIndex === 0}
              />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-80 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white border-0 rounded-full w-10 h-10 p-0 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevious();
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-80 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white border-0 rounded-full w-10 h-10 p-0 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}


            </div>

            {/* Dot Indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex 
                        ? 'bg-white shadow' 
                        : 'bg-white/40 hover:bg-white/70'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(index);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent fullscreen>
          {/* Visually hidden title for accessibility */}
          <DialogHeader>
            <DialogTitle className="sr-only">Image preview</DialogTitle>
          </DialogHeader>

          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="w-5 h-5" />
          </Button>

          <div 
            className="relative w-full h-screen flex items-center justify-center"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <Image
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1} of ${images.length}`}
              fill
              className="object-contain"
              sizes="100vw"
            />

            {/* Fullscreen Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Fullscreen Dot Indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-black/60 backdrop-blur-sm px-4 py-1 rounded-full space-x-3">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      index === currentIndex 
                        ? 'bg-white shadow' 
                        : 'bg-white/40 hover:bg-white/70'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(index);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 