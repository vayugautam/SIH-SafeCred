'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'
import { Loader2 } from 'lucide-react'

const DOCUMENT_TYPES = [
  { type: 'bank_statement', label: 'Bank Statements' },
  { type: 'education_fees', label: 'Education Fee Receipts' },
  { type: 'electricity', label: 'Electricity Bills' },
  { type: 'recharge', label: 'Mobile Recharge Receipts' },
  { type: 'income_proof', label: 'Income Proof' },
  { type: 'identity_proof', label: 'Identity Proof' },
  { type: 'address_proof', label: 'Address Proof' },
  { type: 'other', label: 'Other Documents' }
]

export default function DocumentsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Record<string, UploadedFile[]>>({})

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents')

      if (!response.ok) throw new Error('Failed to load documents')

      const data = await response.json()
      
      // Group documents by type
      const grouped: Record<string, UploadedFile[]> = {}
      if (data.documents && Array.isArray(data.documents)) {
        data.documents.forEach((doc: UploadedFile) => {
          if (!grouped[doc.documentType]) {
            grouped[doc.documentType] = []
          }
          grouped[doc.documentType].push(doc)
        })
      }

      setDocuments(grouped)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      loadDocuments()
    }
  }, [status, router, loadDocuments])

  const handleUploadComplete = (documentType: string, file: UploadedFile) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: [...(prev[documentType] || []), file]
    }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>
            Upload and manage your supporting documents for loan applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={DOCUMENT_TYPES[0].type} className="w-full">
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
              {DOCUMENT_TYPES.map((docType) => (
                <TabsTrigger key={docType.type} value={docType.type}>
                  {docType.label.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {DOCUMENT_TYPES.map((docType) => (
              <TabsContent key={docType.type} value={docType.type} className="mt-6">
                <FileUpload
                  documentType={docType.type}
                  label={docType.label}
                  existingFiles={documents[docType.type] || []}
                  onUploadComplete={(file) => handleUploadComplete(docType.type, file)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
