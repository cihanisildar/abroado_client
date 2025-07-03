'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import Image from 'next/image';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  existingImages: string[]; // URLs of existing images
  newImages: File[]; // New image files to upload
  onExistingImagesChange: (imageUrls: string[]) => void;
  onNewImagesChange: (files: File[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({ 
  existingImages, 
  newImages, 
  onExistingImagesChange, 
  onNewImagesChange, 
  maxImages = 5, 
  className = '' 
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalImages = existingImages.length + newImages.length;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (!files.length) return;

    // Check if adding these files would exceed the max limit
    if (totalImages + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    onNewImagesChange([...newImages, ...validFiles]);
    toast.success(`${validFiles.length} image${validFiles.length > 1 ? 's' : ''} selected!`);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingImage = (indexToRemove: number) => {
    const newExistingImages = existingImages.filter((_, index) => index !== indexToRemove);
    onExistingImagesChange(newExistingImages);
    toast.success('Image removed');
  };

  const removeNewImage = (indexToRemove: number) => {
    const updatedNewImages = newImages.filter((_, index) => index !== indexToRemove);
    onNewImagesChange(updatedNewImages);
    toast.success('Image removed');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-gray-700 mb-2 block">
        Images ({totalImages}/{maxImages})
      </Label>
      
      {/* Image Preview Grid */}
      {totalImages > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {/* Existing Images */}
          {existingImages.map((imageUrl, index) => (
            <Card key={`existing-${index}`} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={imageUrl}
                    alt={`Existing image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Existing
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* New Images */}
          {newImages.map((file, index) => (
            <Card key={`new-${index}`} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`New image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    New
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {totalImages < maxImages && (
        <Card className="border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-orange-50 rounded-full">
                  <ImageIcon className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Upload Images
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add up to {maxImages - totalImages} more image{maxImages - totalImages !== 1 ? 's' : ''} (JPG, PNG, GIF, max 5MB each)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openFileDialog}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Images
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-gray-500 mt-2">
        {totalImages >= maxImages 
          ? `Maximum of ${maxImages} images reached. Remove an image to add a different one.`
          : `You can upload ${maxImages - totalImages} more image${maxImages - totalImages !== 1 ? 's' : ''}`
        }
      </p>
    </div>
  );
} 