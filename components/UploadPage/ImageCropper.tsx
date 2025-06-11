import React, { useState, useCallback, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from "@/components/ui/button"

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  maxHeight: number
  aspectRatio?: number
  quality?: number
}

export function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  maxHeight,
  aspectRatio = 1,
  quality = 0.95,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 100, height: 100, x: 0, y: 0 })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const aspectRatioRef = useRef(aspectRatio)

  const onLoad = useCallback((img: HTMLImageElement) => {
    setImageRef(img)
    
    const ratio = aspectRatioRef.current || 1
    let widthPercent = 100
    let heightPercent = 100
    if (ratio >= 1) {
      // landscape or square
      heightPercent = 100 / ratio
    } else {
      widthPercent = 100 * ratio
    }
    const newCrop = { unit: '%', width: widthPercent, height: heightPercent, x: 0, y: 0 } as Crop
    setCrop(newCrop)
    setCompletedCrop({
      unit: 'px',
      width: (img.naturalWidth * widthPercent) / 100,
      height: (img.naturalHeight * heightPercent) / 100,
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

      canvas.toBlob(
        (blob) => {
          if (blob) onCropComplete(blob)
        },
        'image/jpeg',
        quality
      )
    }
  }, [completedCrop, imageRef, onCropComplete, quality])

  return (
    <div className="p-4" style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}>
      <ReactCrop
        crop={crop}
        onChange={(c, percentCrop) => setCrop(percentCrop)}
        onComplete={(c) => setCompletedCrop(c)}
        aspect={aspectRatioRef.current}
        maxWidth={1260}
        maxHeight={1260}
      >
        <img
          src={imageUrl}
          alt="Crop me"
          onLoad={(e) => onLoad(e.currentTarget)}
          style={{ 
            maxHeight: `${maxHeight - 100}px`,
            width: 'auto',
            maxWidth: '100%',
            display: 'block'
          }}
        />
      </ReactCrop>
      <div className="mt-4 flex justify-end space-x-2">
        <Button onClick={onCancel} variant="outline" type="button">Cancel</Button>
        <Button onClick={getCroppedImg} type="button">Save Image</Button>
      </div>
    </div>
  )
}
