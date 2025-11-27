import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useNotes } from "@/hooks/useNotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Pin, 
  PinOff, 
  MoreVertical, 
  Trash2, 
  LogOut,
  FileText,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Note } from "@shared/schema";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { notes, loading, createNote, deleteNote, togglePin } = useNotes();
  const [, setLocation] = useLocation();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const pinnedNotes = notes.filter((note) => note.pinned);
  const unpinnedNotes = notes.filter((note) => !note.pinned);

  const handleCreateNote = async () => {
    setIsCreating(true);
    try {
      const noteId = await createNote();
      setLocation(`/editor/${noteId}`);
    } catch (error) {
      console.error("Failed to create note:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border sticky top-0 bg-background z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold text-foreground cursor-pointer">
              <span className="text-primary">N</span>otes Edu Mamae
            </h1>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="font-semibold text-foreground truncate">{user?.displayName || "User"}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} data-testid="button-signout">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        {/* Pinned notes section */}
        {pinnedNotes.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Pin className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Pinned</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onTogglePin={() => togglePin(note.id, note.pinned)}
                  onDelete={() => setDeleteConfirm(note.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All notes section */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {pinnedNotes.length > 0 ? "Other Notes" : "Your Notes"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          {notes.length === 0 ? (
            <EmptyState onCreateNote={handleCreateNote} isCreating={isCreating} />
          ) : unpinnedNotes.length === 0 && pinnedNotes.length > 0 ? (
            <p className="text-center text-muted-foreground py-8">
              All your notes are pinned!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unpinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onTogglePin={() => togglePin(note.id, note.pinned)}
                  onDelete={() => setDeleteConfirm(note.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating create button */}
      <Button
        onClick={handleCreateNote}
        disabled={isCreating}
        size="lg"
        className="fixed bottom-8 right-8 rounded-full shadow-lg w-14 h-14 p-0"
        data-testid="button-create-note"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the note and remove it from all collaborators.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteNote(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NoteCard({
  note,
  onTogglePin,
  onDelete,
}: {
  note: Note;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/editor/${note.id}`);
  };

  const contentPreview = note.content
    .replace(/\n/g, " ")
    .slice(0, 150)
    .trim();

  return (
    <Card 
      className="group border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover-elevate"
      onClick={handleClick}
      data-testid={`card-note-${note.id}`}
    >
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
            {note.title || "Untitled Note"}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
                data-testid={`button-note-menu-${note.id}`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onTogglePin} data-testid={`button-toggle-pin-${note.id}`}>
                {note.pinned ? (
                  <>
                    <PinOff className="w-4 h-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
                data-testid={`button-delete-note-${note.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {contentPreview ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {contentPreview}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">
            No content yet
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
          </span>
          {note.collaborators.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{note.collaborators.length}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ 
  onCreateNote, 
  isCreating 
}: { 
  onCreateNote: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <FileText className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold text-foreground mb-2">
        No notes yet
      </h3>
      <p className="text-muted-foreground mb-8 max-w-md">
        Create your first note to get started. You can write, organize, and share your thoughts with others.
      </p>
      <Button 
        onClick={onCreateNote} 
        disabled={isCreating}
        size="lg"
        className="gap-2"
        data-testid="button-create-first-note"
      >
        <Plus className="w-5 h-5" />
        Create your first note
      </Button>
    </div>
  );
}
