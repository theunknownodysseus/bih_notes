import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useNote } from "@/hooks/useNotes";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Download, 
  FileText, 
  Check, 
  Loader2,
  Eye,
  Edit3,
  Lock,
  LogIn
} from "lucide-react";
import { jsPDF } from "jspdf";

export default function SharedView() {
  const params = useParams<{ id: string }>();
  const noteId = params.id;
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const requestedMode = searchParams.get("mode") || "view";
  
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { note, loading, error, permission } = useNote(noteId || null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContent = useRef({ title: "", content: "" });

  // Determine actual permission based on user's role and requested mode
  const isOwner = permission === "owner";
  const isEditor = permission === "editor";
  const isViewer = permission === "viewer";
  const hasAccess = permission !== "none";
  
  // User can edit if they are owner/editor AND requested edit mode
  const canEdit = (isOwner || isEditor) && requestedMode === "edit";

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
    if (canEdit) debouncedSave(newTitle, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (canEdit) debouncedSave(title, newContent);
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border sticky top-0 bg-background z-50">
          <div className="container mx-auto px-6 py-4 flex items-center gap-4">
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

  // Not signed in - prompt to sign in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <LogIn className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Sign in required</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Please sign in to view this shared note. Only authorized users can access shared content.
        </p>
        <Button onClick={signInWithGoogle} size="lg" className="gap-2" data-testid="button-signin-shared">
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </Button>
      </div>
    );
  }

  // User is signed in but doesn't have access
  if (!hasAccess && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          You don't have permission to view this note. Contact the owner at <span className="font-medium">{note?.ownerEmail}</span> to request access.
        </p>
        <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Note not found</h2>
        <p className="text-muted-foreground mb-6">This note may have been deleted or the link is invalid.</p>
        <Button onClick={() => setLocation("/dashboard")} data-testid="button-go-dashboard">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              <span className="text-primary">N</span>otes Edu Mamae
            </h1>
          </div>

          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            disabled={!canEdit}
            className="flex-1 max-w-2xl text-xl font-semibold border-0 focus-visible:ring-0 px-2"
            data-testid="input-shared-title"
          />

          <div className="flex items-center gap-2 ml-auto">
            {/* Save status */}
            {canEdit && (
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
            )}

            {/* Owner info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>by</span>
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {note.ownerName?.charAt(0) || note.ownerEmail?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-32">{note.ownerName || note.ownerEmail}</span>
            </div>

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-shared-export">
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportAsPDF} data-testid="button-shared-export-pdf">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsText} data-testid="button-shared-export-txt">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dashboard link */}
            <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-dashboard">
              Dashboard
            </Button>
          </div>
        </div>

        {/* Permission banner */}
        <div className={`px-6 py-2 text-center ${canEdit ? 'bg-green-500/10' : 'bg-primary/10'}`}>
          <p className={`text-sm font-medium flex items-center justify-center gap-2 ${canEdit ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
            {canEdit ? (
              <>
                <Edit3 className="w-4 h-4" />
                You can edit this note
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                You're viewing this note as a {isViewer ? "viewer" : "read-only"}
              </>
            )}
          </p>
        </div>
      </header>

      {/* Editor content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder={canEdit ? "Start writing..." : "No content yet"}
          disabled={!canEdit}
          className="min-h-[calc(100vh-300px)] text-lg leading-relaxed border-0 focus-visible:ring-0 resize-none"
          data-testid="textarea-shared-content"
        />
      </main>
    </div>
  );
}
