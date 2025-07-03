import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const legalRegisterId = formData.get("legalRegisterId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!legalRegisterId) {
      return NextResponse.json({ error: "Legal Register ID is required" }, { status: 400 })
    }

    // In a real app, you would upload the file to a cloud storage service
    // and get a URL back. For this demo, we'll create a mock URL.
    const fileUrl = `/api/legal-register/documents/download/${Date.now()}-${file.name}`

    // Create document record in database
    const document = await prisma.legalRegisterDocument.create({
      data: {
        title: title || file.name,
        fileUrl,
        fileType: file.type,
        size: file.size,
        uploadedById: user.id as string,
        legalRegisterId,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const legalRegisterId = url.searchParams.get("legalRegisterId")

    if (!legalRegisterId) {
      return NextResponse.json({ error: "Legal Register ID is required" }, { status: 400 })
    }

    const documents = await prisma.legalRegisterDocument.findMany({
      where: {
        legalRegisterId,
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}