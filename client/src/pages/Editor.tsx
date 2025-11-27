import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useNote } from "@/hooks/useNotes";
import { doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  FileText, 
  Check, 
  Loader2,
  Copy,
  UserPlus,
  X,
  Users,
  Lock
} from "lucide-react";
import { jsPDF } from "jspdf";
import type { Collaborator } from "@shared/schema";

export default function Editor() {
  const params = useParams<{ id: string }>();
  const noteId = params.id;
  const { user } = useAuth();
  const { note, loading, error, permission } = useNote(noteId || null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaboratorPermission, setCollaboratorPermission] = useState<"viewer" | "editor">("viewer");
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContent = useRef({ title: "", content: "" });

  // Permission checks
  const isOwner = permission === "owner";
  const canEdit = permission === "owner" || permission === "editor";
  const hasAccess = permission !== "none";

  // Initialize local state from note
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      lastSavedContent.current = { title: note.title, content: note.content };
    }
  }, [note?.id]);

  // Update local state when note changes from another user
  useEffect(() => {
    if (note && saveStatus !== "saving") {
      if (
        note.title !== lastSavedContent.current.title ||
        note.content !== lastSavedContent.current.content
      ) {
        setTitle(note.title);
        setContent(note.content);
        lastSavedContent.current = { title: note.title, content: note.content };
      }
    }
  }, [note?.title, note?.content, note?.updatedAt]);

  // Auto-save with debounce
  const saveNote = useCallback(async (newTitle: string, newContent: string) => {
    if (!noteId || !canEdit) return;

    setSaveStatus("saving");
    try {
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, {
        title: newTitle,
        content: newContent,
        updatedAt: Timestamp.now(),
      });
      lastSavedContent.current = { title: newTitle, content: newContent };
      setSaveStatus("saved");
    } catch (err) {
      console.error("Failed to save:", err);
      setSaveStatus("idle");
    }
  }, [noteId, canEdit]);

  const debouncedSave = useCallback((newTitle: string, newContent: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(newTitle, newContent);
    }, 1000);
  }, [saveNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave(newTitle, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedSave(title, newContent);
  };

  // Export functions
  const exportAsPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    pdf.setFontSize(20);
    pdf.text(title || "Untitled Note", margin, margin + 10);

    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(content, maxWidth);
    pdf.text(lines, margin, margin + 25);

    pdf.save(`${title || "note"}.pdf`);
    toast({ title: "Exported as PDF" });
  };

  const exportAsText = () => {
    const text = `${title}\n\n${content}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported as text file" });
  };

  // Share functions
  const copyShareLink = (mode: "view" | "edit") => {
    const url = `${window.location.origin}/share/${noteId}?mode=${mode}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  const addCollaborator = async () => {
    if (!noteId || !collaboratorEmail.trim() || !note) return;
    
    setIsAddingCollaborator(true);
    try {
      const noteRef = doc(db, "notes", noteId);
      const noteSnap = await getDoc(noteRef);
      
      if (!noteSnap.exists()) throw new Error("Note not found");
      
      const noteData = noteSnap.data();
      const collaborators = [...(noteData.collaborators || [])];
      const collaboratorEmails = [...(noteData.collaboratorEmails || [])];
      
      const existingIndex = collaborators.findIndex((c: Collaborator) => c.email === collaboratorEmail);
      
      if (existingIndex >= 0) {
        collaborators[existingIndex].permission = collaboratorPermission;
      } else {
        collaborators.push({
          email: collaboratorEmail.trim(),
          permission: collaboratorPermission,
          addedAt: Date.now(),
        });
        if (!collaboratorEmails.includes(collaboratorEmail.trim())) {
          collaboratorEmails.push(collaboratorEmail.trim());
        }
      }

      await updateDoc(noteRef, { 
        collaborators,
        collaboratorEmails,
        updatedAt: Timestamp.now(),
      });

      setCollaboratorEmail("");
      toast({ title: "Collaborator added" });
    } catch (err) {
      console.error("Failed to add collaborator:", err);
      toast({ title: "Failed to add collaborator", variant: "destructive" });
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const removeCollaborator = async (email: string) => {
    if (!noteId || !note) return;

    try {
      const noteRef = doc(db, "notes", noteId);
      const noteSnap = await getDoc(noteRef);
      
      if (!noteSnap.exists()) throw new Error("Note not found");
      
      const noteData = noteSnap.data();
      const collaborators = (noteData.collaborators || []).filter((c: Collaborator) => c.email !== email);
      const collaboratorEmails = (noteData.collaboratorEmails || []).filter((e: string) => e !== email);
      
      await updateDoc(noteRef, { 
        collaborators,
        collaboratorEmails,
        updatedAt: Timestamp.now(),
      });
      toast({ title: "Collaborator removed" });
    } catch (err) {
      console.error("Failed to remove collaborator:", err);
      toast({ title: "Failed to remove collaborator", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border sticky top-0 bg-background z-50">
          <div className="container mx-auto px-6 py-4 flex items-center gap-4">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-10 flex-1 max-w-2xl" />
            <Skeleton className="h-9 w-24" />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <Skeleton className="h-8 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  // No access - user is not owner or collaborator
  if (!hasAccess && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          You don't have permission to view this note. Contact the owner to request access.
        </p>
        <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Note not found</h2>
        <p className="text-muted-foreground mb-6">This note may have been deleted or you don't have access.</p>
        <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4 flex-wrap">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            disabled={!canEdit}
            className="flex-1 max-w-2xl text-xl font-semibold border-0 focus-visible:ring-0 px-2"
            data-testid="input-title"
          />

          <div className="flex items-center gap-2 ml-auto">
            {/* Save status */}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="w-3 h-3" />
                  Saved
                </>
              )}
            </span>

            {/* Collaborators avatars */}
            {note.collaborators.length > 0 && (
              <div className="flex -space-x-2 mr-2">
                {note.collaborators.slice(0, 3).map((collab, i) => (
                  <Avatar key={i} className="w-8 h-8 border-2 border-background">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {collab.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {note.collaborators.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                    +{note.collaborators.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Share button (only for owner) */}
            {isOwner && (
              <Button 
                onClick={() => setShareDialogOpen(true)}
                className="gap-2"
                data-testid="button-share"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            )}

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-export">
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportAsPDF} data-testid="button-export-pdf">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsText} data-testid="button-export-txt">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Read-only banner for viewers */}
        {!canEdit && (
          <div className="bg-primary/10 px-6 py-2 text-center">
            <p className="text-sm text-primary font-medium">
              You're viewing this note as a viewer. Request edit access from the owner.
            </p>
          </div>
        )}
      </header>

      {/* Editor content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing..."
          disabled={!canEdit}
          className="min-h-[calc(100vh-250px)] text-lg leading-relaxed border-0 focus-visible:ring-0 resize-none"
          data-testid="textarea-content"
        />
      </main>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Note</DialogTitle>
            <DialogDescription>
              Share this note with others via link or invite collaborators by email.
            </DialogDescription>
          </DialogHeader>

          {/* Share links */}
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Share via link</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => copyShareLink("view")}
                  data-testid="button-copy-view-link"
                >
                  <Copy className="w-4 h-4" />
                  Copy viewer link
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => copyShareLink("edit")}
                  data-testid="button-copy-edit-link"
                >
                  <Copy className="w-4 h-4" />
                  Copy editor link
                </Button>
              </div>
            </div>

            {/* Add collaborator */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Add collaborators</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  className="flex-1"
                  data-testid="input-collaborator-email"
                />
                <Select 
                  value={collaboratorPermission} 
                  onValueChange={(v) => setCollaboratorPermission(v as "viewer" | "editor")}
                >
                  <SelectTrigger className="w-28" data-testid="select-permission">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={addCollaborator}
                  disabled={!collaboratorEmail.trim() || isAddingCollaborator}
                  size="icon"
                  data-testid="button-add-collaborator"
                >
                  {isAddingCollaborator ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Current collaborators */}
            {note.collaborators.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Current collaborators</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {note.collaborators.map((collab, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {collab.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground truncate">{collab.email}</span>
                        <Badge variant="secondary" className="shrink-0">
                          {collab.permission}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeCollaborator(collab.email)}
                        data-testid={`button-remove-collaborator-${i}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
