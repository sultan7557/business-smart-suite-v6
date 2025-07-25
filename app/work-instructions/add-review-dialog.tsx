"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { addWorkInstructionReview } from "@/app/actions/work-instruction-actions"
import { toast } from "@/components/ui/use-toast"

interface AddReviewDialogProps {
  workInstructionId: string
}

export default function AddReviewDialog({ workInstructionId }: AddReviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    details: "",
    reviewDate: new Date().toISOString().split("T")[0],
    nextReviewDate: "",
    reviewerName: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await addWorkInstructionReview(workInstructionId, {
        ...formData,
        reviewDate: new Date(formData.reviewDate),
        nextReviewDate: formData.nextReviewDate ? new Date(formData.nextReviewDate) : undefined,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Review added successfully",
        })
        setOpen(false)
        setFormData({
          details: "",
          reviewDate: new Date().toISOString().split("T")[0],
          nextReviewDate: "",
          reviewerName: "",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add review",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding review:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reviewerName">Reviewer Name</Label>
            <Input
              id="reviewerName"
              value={formData.reviewerName}
              onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="reviewDate">Review Date</Label>
            <Input
              id="reviewDate"
              type="date"
              value={formData.reviewDate}
              onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="nextReviewDate">Next Review Date (Optional)</Label>
            <Input
              id="nextReviewDate"
              type="date"
              value={formData.nextReviewDate}
              onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="details">Review Details</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              required
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
