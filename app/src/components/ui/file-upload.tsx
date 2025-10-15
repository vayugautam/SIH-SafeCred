'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { Label } from './label'
import { Card, CardContent } from './card'
import { Upload, X, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from './use-toast'

export interface UploadedFile {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  documentType: string
}

interface FileUploadProps {
  documentType: string
  label: string
  applicationId?: string
  onUploadComplete?: (file: UploadedFile) => void
  existingFiles?: UploadedFile[]
  maxSize?: number // in MB
  accept?: string
}

export function FileUpload({
  documentType,
  label,
  applicationId,
  onUploadComplete,
  existingFiles = [],
  maxSize = 5,
  accept = '.pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    const file = files[0]

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'Error',
        description: `File size exceeds ${maxSize}MB limit`,
        variant: 'destructive'
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)
      if (applicationId) {
        formData.append('applicationId', applicationId)
      }

      const token = localStorage.getItem('token')
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      const uploadedFile = data.document

      setUploadedFiles(prev => [...prev, uploadedFile])
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
        variant: 'success'
      })

      if (onUploadComplete) {
        onUploadComplete(uploadedFile)
      }

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (fileId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/documents?id=${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
      
      toast({
        title: 'Success',
        description: 'File deleted successfully',
        variant: 'success'
      })

    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive'
      })
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onButtonClick}
                  disabled={uploading}
                >
                  Choose File
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  or drag and drop
                </p>
              </div>
              <p className="text-xs text-gray-400">
                PDF, JPG, PNG, CSV, Excel up to {maxSize}MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded Files</Label>
          {uploadedFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{file.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={file.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
