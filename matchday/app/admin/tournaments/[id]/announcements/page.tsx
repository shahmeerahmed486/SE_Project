"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Edit, Trash2, ArrowLeft, MessageSquare, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Announcement, Tournament } from "@/src/types"

export default function AnnouncementsPage({ params }: { params: { id: string } }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form fields
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("low")
  const [announcementId, setAnnouncementId] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const auth = getAuth()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        // Get tournament
        const tournamentDoc = await getDoc(doc(db, "tournaments", params.id))

        if (!tournamentDoc.exists()) {
          toast({
            title: "Tournament not found",
            description: "The requested tournament could not be found.",
            variant: "destructive",
          })
          router.push("/admin/tournaments")
          return
        }

        const tournamentData = tournamentDoc.data()
        setTournament({
          id: tournamentDoc.id,
          ...tournamentData
        } as Tournament)

        // Get announcements for this tournament
        const announcementsQuery = query(
          collection(db, "tournaments", params.id, "announcements"),
          orderBy("timestamp", "desc")
        )

        const announcementsSnapshot = await getDocs(announcementsQuery)
        const announcementsData: Announcement[] = []

        announcementsSnapshot.forEach((doc) => {
          announcementsData.push({
            id: doc.id,
            ...doc.data()
          } as Announcement)
        })

        setAnnouncements(announcementsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load tournament data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, params.id, router, toast])

  const resetForm = () => {
    setTitle("")
    setContent("")
    setPriority("low")
    setAnnouncementId("")
    setIsEditing(false)
  }

  const handleEditAnnouncement = (announcement: Announcement) => {
    setTitle(announcement.title)
    setContent(announcement.content)
    setPriority(announcement.priority)
    setAnnouncementId(announcement.id)
    setIsEditing(true)
  }

  const handleCreateAnnouncement = async () => {
    try {
      const announcementData: Omit<Announcement, "id"> = {
        tournamentId: params.id,
        title,
        content,
        description: content, // Using content as description for backward compatibility
        priority,
        timestamp: new Date().toISOString(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: new Date().toISOString()
      }

      await addDoc(collection(db, "tournaments", params.id, "announcements"), announcementData)

      toast({
        title: "Announcement created",
        description: "The announcement has been published.",
      })

      // Refresh announcements
      const announcementsQuery = query(
        collection(db, "tournaments", params.id, "announcements"),
        orderBy("timestamp", "desc")
      )

      const announcementsSnapshot = await getDocs(announcementsQuery)
      const announcementsData: Announcement[] = []

      announcementsSnapshot.forEach((doc) => {
        announcementsData.push({
          id: doc.id,
          ...doc.data()
        } as Announcement)
      })

      setAnnouncements(announcementsData)
      resetForm()
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAnnouncement = async () => {
    try {
      const announcementData: Partial<Announcement> = {
        title,
        content,
        description: content, // Using content as description for backward compatibility
        priority,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, "tournaments", params.id, "announcements", announcementId), announcementData)

      toast({
        title: "Announcement updated",
        description: "The announcement has been updated successfully.",
      })

      // Refresh announcements
      const announcementsQuery = query(
        collection(db, "tournaments", params.id, "announcements"),
        orderBy("timestamp", "desc")
      )

      const announcementsSnapshot = await getDocs(announcementsQuery)
      const announcementsData: Announcement[] = []

      announcementsSnapshot.forEach((doc) => {
        announcementsData.push({
          id: doc.id,
          ...doc.data()
        } as Announcement)
      })

      setAnnouncements(announcementsData)
      resetForm()
    } catch (error) {
      console.error("Error updating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to update announcement.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteDoc(doc(db, "tournaments", params.id, "announcements", announcementId))

        toast({
          title: "Announcement deleted",
          description: "The announcement has been deleted successfully.",
        })

        // Update state to remove the deleted announcement
        setAnnouncements(announcements.filter(a => a.id !== announcementId))
      } catch (error) {
        console.error("Error deleting announcement:", error)
        toast({
          title: "Error",
          description: "Failed to delete announcement.",
          variant: "destructive",
        })
      }
    }
  }

  if (!user || loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <Link href={`/admin/tournaments/${params.id}`} className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Tournament</span>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Manage Announcements: {tournament?.name}
        </h1>
      </div>

      <div className="grid gap-6">
        {/* Create/Edit Announcement */}
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Announcement" : "Create New Announcement"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Announcement details"
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleUpdateAnnouncement} className="flex-1">
                      Update Announcement
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleCreateAnnouncement} className="flex-1">
                    Publish Announcement
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Announcements List */}
        <Card>
          <CardHeader>
            <CardTitle>All Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No announcements yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-6">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <Badge variant={
                          announcement.priority === "high" ? "destructive" :
                            announcement.priority === "medium" ? "secondary" : "default"
                        }>
                          {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditAnnouncement(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="whitespace-pre-line">{announcement.content}</p>
                    <div className="text-sm text-muted-foreground mt-2">
                      Posted on {announcement.createdAt?.toDate ?
                        format(announcement.createdAt.toDate(), 'MMM dd, yyyy - HH:mm') :
                        format(new Date(announcement.timestamp), 'MMM dd, yyyy - HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 