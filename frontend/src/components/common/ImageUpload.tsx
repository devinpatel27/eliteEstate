'use client';

import { useRef, useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({ value, onChange, disabled, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const displaySrc = preview || value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div
        className={cn(
          'relative w-20 h-20 rounded-full border-2 border-dashed border-border bg-muted overflow-hidden flex items-center justify-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {displaySrc ? (
          <>
            <Image src={displaySrc} alt="Profile" fill className="object-cover" sizes="80px" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload Photo
          </Button>
          {displaySrc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPEG, PNG or WebP. Max 5MB.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
