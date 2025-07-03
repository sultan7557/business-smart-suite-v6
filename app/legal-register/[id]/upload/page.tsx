import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"
import prisma from "@/lib/prisma"
import { hasPermission } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import LegalRegisterDocumentUpload from "../../legal-register-document-upload"

interface UploadDocumentPageProps {
  params: {
    id: string
  }
}

export default async function UploadDocumentPage({ params }: UploadDocumentPageProps) {
  const canEdit = await hasPermission("write")

  if (!canEdit) {
    redirect(`/legal-register/${params.id}`)
  }

  const legalRegister = await prisma.legalRegister.findUnique({
    where: { id: params.id },
  })

  if (!legalRegister) {
    notFound()
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href={`/legal-register/${params.id}`} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to legal register details
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Upload Document</h1>

      <div className="max-w-2xl">
        <LegalRegisterDocumentUpload legalRegisterId={params.id} />
      </div>
    </div>
  )
}