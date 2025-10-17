import React, { useState, useCallback, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { getExtensionFromMimeType, stripFileExtension } from '@/lib/imageUtils'

export interface CropResultMetadata {
  originalFileName?: string
  mimeType: string
  suggestedFileName?: string
  hadTransparency?: boolean
}

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageBlob: Blob, metadata?: CropResultMetadata) => void
  onCancel: () => void
  maxHeight: number
  aspectRatio?: number
  quality?: number
  minZoom?: number
  maxZoom?: number
  originalFileName?: string
  originalMimeType?: string
  outputMimeType?: string
  desiredFileName?: string
  backgroundFillColor?: string
}

type CropConstraints = {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
}

export function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  maxHeight,
  aspectRatio = 1,
  quality = 0.95,
  minZoom = 0.3,
  maxZoom = 1,
  originalFileName,
  originalMimeType,
  outputMimeType,
  desiredFileName,
  backgroundFillColor = '#ffffff',
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 100, height: 100, x: 0, y: 0 })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const [cropConstraints, setCropConstraints] = useState<CropConstraints | null>(null)
  const aspectRatioRef = useRef(aspectRatio)
  const minZoomRef = useRef(minZoom)
  const maxZoomRef = useRef(maxZoom)

  useEffect(() => {
    aspectRatioRef.current = aspectRatio
  }, [aspectRatio])

  useEffect(() => {
    minZoomRef.current = minZoom
  }, [minZoom])

  useEffect(() => {
    maxZoomRef.current = maxZoom
  }, [maxZoom])

  const onLoad = useCallback((img: HTMLImageElement) => {
    setImageRef(img)

    const imageAspect = img.naturalWidth / img.naturalHeight || 1
    const desiredAspect = aspectRatioRef.current && aspectRatioRef.current > 0 ? aspectRatioRef.current : imageAspect

    let widthPercent = 100
    let heightPercent = (100 * imageAspect) / desiredAspect

    if (heightPercent > 100) {
      heightPercent = 100
      widthPercent = (100 * desiredAspect) / imageAspect
    }

    const xPercent = (100 - widthPercent) / 2
    const yPercent = (100 - heightPercent) / 2

    const newCrop = {
      unit: '%',
      width: widthPercent,
      height: heightPercent,
      x: xPercent,
      y: yPercent,
    } as Crop
    setCrop(newCrop)

    const renderedWidth = img.width || img.naturalWidth
    const renderedHeight = img.height || img.naturalHeight

    const widthPx = (renderedWidth * widthPercent) / 100
    const heightPx = (renderedHeight * heightPercent) / 100
    const xPx = (renderedWidth * xPercent) / 100
    const yPx = (renderedHeight * yPercent) / 100

    const requestedMinZoom = minZoomRef.current ?? 0.3
    const requestedMaxZoom = maxZoomRef.current ?? 1
    const safeMaxZoom = Math.max(requestedMaxZoom, 0.01)
    const safeMinZoom = Math.min(Math.max(requestedMinZoom, 0.01), safeMaxZoom)

    setCompletedCrop({
      unit: 'px',
      width: widthPx,
      height: heightPx,
      x: xPx,
      y: yPx,
    })

    setCropConstraints({
      minWidth: widthPx * safeMinZoom,
      minHeight: heightPx * safeMinZoom,
      maxWidth: widthPx * safeMaxZoom,
      maxHeight: heightPx * safeMaxZoom,
    })
  }, [])

  const getCroppedImg = useCallback(() => {
    if (!completedCrop || !imageRef) return

    const canvas = document.createElement('canvas')
    const scaleX = imageRef.naturalWidth / imageRef.width
    const scaleY = imageRef.naturalHeight / imageRef.height
    // Preserve the original image resolution when generating the crop
    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return
    }

    const preferredMimeType = outputMimeType || originalMimeType || 'image/jpeg'

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(
      imageRef,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    )

    let hadTransparency = false
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { data } = imageData
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          hadTransparency = true
          break
        }
      }
    } catch (error) {
      console.warn('Unable to analyze image transparency', error)
    }

    const supportsTransparency = (mimeType?: string) => {
      if (!mimeType) return false
      const normalized = mimeType.toLowerCase()
      return normalized.includes('png') || normalized.includes('webp') || normalized.includes('avif')
    }

    const baseNameSource = desiredFileName || originalFileName || 'cropped-image'
    const baseName = stripFileExtension(baseNameSource).trim() || 'cropped-image'

    let targetMimeType = preferredMimeType
    if (hadTransparency && !supportsTransparency(preferredMimeType)) {
      targetMimeType = 'image/png'
    }

    if (!supportsTransparency(targetMimeType)) {
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = backgroundFillColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'
    }

    const finalizeBlob = (mimeTypeToUse: string) => {
      const shouldApplyQuality =
        mimeTypeToUse.includes('jpeg') ||
        mimeTypeToUse.includes('jpg') ||
        mimeTypeToUse.includes('webp')

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            if (mimeTypeToUse !== 'image/png') {
              finalizeBlob('image/png')
            }
            return
          }

          const resultingMimeType = blob.type || mimeTypeToUse || 'image/png'
          const extension = getExtensionFromMimeType(resultingMimeType)
          const suggestedFileName = `${baseName}.${extension}`

          onCropComplete(blob, {
            originalFileName,
            mimeType: resultingMimeType,
            suggestedFileName,
            hadTransparency,
          })
        },
        mimeTypeToUse,
        shouldApplyQuality ? quality : undefined
      )
    }

    finalizeBlob(targetMimeType)
  }, [
    completedCrop,
    imageRef,
    onCropComplete,
    quality,
    originalFileName,
    originalMimeType,
    outputMimeType,
    desiredFileName,
    backgroundFillColor,
  ])

  return (
    <div className="p-4" style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}>
      <ReactCrop
        crop={crop}
        onChange={(c, percentCrop) => setCrop(percentCrop)}
        onComplete={(c) => setCompletedCrop(c)}
        aspect={aspectRatioRef.current}
        minWidth={cropConstraints?.minWidth ?? undefined}
        minHeight={cropConstraints?.minHeight ?? undefined}
        maxWidth={cropConstraints?.maxWidth ?? undefined}
        maxHeight={cropConstraints?.maxHeight ?? undefined}
      >
        <Image
          src={imageUrl}
          alt="Crop me"
          onLoad={(e) => onLoad(e.currentTarget)}
          width={800}
          height={600}
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
