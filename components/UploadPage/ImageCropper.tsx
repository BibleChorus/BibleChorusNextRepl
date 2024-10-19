import React, { useState, useCallback, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from "@/components/ui/button"
import Image from 'next/image' // Importing Next.js Image component

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  maxHeight: number // Change this to be required
}

export function ImageCropper({ imageUrl, onCropComplete, onCancel, maxHeight }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 100, height: 100, x: 0, y: 0 })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const aspectRatio = useRef(1)

  const onLoad = useCallback((img: HTMLImageElement) => {
    setImageRef(img)
    
    // Calculate the maximum crop size while maintaining aspect ratio
    const maxSize = Math.min(img.width, img.height, 1920)
    const cropPercentage = (maxSize / Math.max(img.width, img.height)) * 100
    const newCrop = { unit: '%', width: cropPercentage, height: cropPercentage, x: 0, y: 0 } as Crop
    setCrop(newCrop)
    // Set initial completedCrop
    setCompletedCrop({
      unit: 'px',
      width: (img.width * cropPercentage) / 100,
      height: (img.height * cropPercentage) / 100,
      x: 0,
      y: 0,
    })
  }, [])

  const getCroppedImg = useCallback(() => {
    if (!completedCrop || !imageRef) return

    const canvas = document.createElement('canvas')
    const scaleX = imageRef.naturalWidth / imageRef.width
    const scaleY = imageRef.naturalHeight / imageRef.height
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.drawImage(
        imageRef,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      )

      canvas.toBlob((blob) => {
        if (blob) onCropComplete(blob)
      }, 'image/jpeg', 1)
    }
  }, [completedCrop, imageRef, onCropComplete])

  return (
    <div className="p-4" style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}>
      <ReactCrop
        crop={crop}
        onChange={(c, percentCrop) => setCrop(percentCrop)}
        onComplete={(c) => setCompletedCrop(c)}
        aspect={aspectRatio.current}
        maxWidth={1260}
        maxHeight={1260}
      >
        <Image 
          src={imageUrl} 
          alt="Crop me" 
          onLoadingComplete={(img) => onLoad(img)} 
          style={{ maxHeight: `${maxHeight - 100}px`, width: 'auto' }} 
          layout="responsive" // Ensures responsive sizing
        />
      </ReactCrop>
      <div className="mt-4 flex justify-end space-x-2">
        <Button onClick={onCancel} variant="outline" type="button">Cancel</Button>
        <Button onClick={getCroppedImg} type="button">Save Image</Button>
      </div>
    </div>
  )
}
