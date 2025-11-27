import { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import type { Note, Collaborator } from "@shared/schema";

export function useNotes() {
  const { user } = useAuth();
  const [ownedNotes, setOwnedNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Combine owned and shared notes, removing duplicates
  const notes = [...ownedNotes, ...sharedNotes].reduce((acc, note) => {
    if (!acc.find(n => n.id === note.id)) {
      acc.push(note);
    }
    return acc;
  }, [] as Note[]).sort((a, b) => b.updatedAt - a.updatedAt);

  useEffect(() => {
    if (!user || !user.email) {
      setOwnedNotes([]);
      setSharedNotes([]);
      setLoading(false);
      return;
    }

    const notesRef = collection(db, "notes");
    
    // Query 1: Notes where user is the owner
    const ownerQuery = query(
      notesRef,
      where("owner", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    // Query 2: Notes where user is a collaborator (by email)
    // Using array-contains-any with the collaborator object pattern
    const collaboratorQuery = query(
      notesRef,
      where("collaboratorEmails", "array-contains", user.email)
    );

    let ownedLoaded = false;
    let sharedLoaded = false;

    const checkLoaded = () => {
      if (ownedLoaded && sharedLoaded) {
        setLoading(false);
      }
    };

    // Subscribe to owned notes
    const unsubscribeOwned = onSnapshot(ownerQuery, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notesData.push({
          id: doc.id,
          title: data.title || "",
          content: data.content || "",
          owner: data.owner,
          ownerEmail: data.ownerEmail || "",
          ownerName: data.ownerName || "",
          collaborators: data.collaborators || [],
          pinned: data.pinned || false,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
        });
      });
      setOwnedNotes(notesData);
      ownedLoaded = true;
      checkLoaded();
    }, (error) => {
      console.error("Error fetching owned notes:", error);
      ownedLoaded = true;
      checkLoaded();
    });

    // Subscribe to shared notes (where user is a collaborator)
    const unsubscribeShared = onSnapshot(collaboratorQuery, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notesData.push({
          id: doc.id,
          title: data.title || "",
          content: data.content || "",
          owner: data.owner,
          ownerEmail: data.ownerEmail || "",
          ownerName: data.ownerName || "",
          collaborators: data.collaborators || [],
          pinned: data.pinned || false,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
        });
      });
      setSharedNotes(notesData);
      sharedLoaded = true;
      checkLoaded();
    }, (error) => {
      // This query might fail if index is not created yet, that's okay
      console.error("Error fetching shared notes:", error);
      sharedLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubscribeOwned();
      unsubscribeShared();
    };
  }, [user]);

  const createNote = useCallback(async (title: string = "Untitled Note") => {
    if (!user) throw new Error("Must be logged in to create notes");

    const noteData = {
      title,
      content: "",
      owner: user.uid,
      ownerEmail: user.email || "",
      ownerName: user.displayName || "",
      collaborators: [],
      collaboratorEmails: [], // Denormalized array for querying
      pinned: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "notes"), noteData);
    return docRef.id;
  }, [user]);

  const updateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    const noteRef = doc(db, "notes", noteId);
    await updateDoc(noteRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    const noteRef = doc(db, "notes", noteId);
    await deleteDoc(noteRef);
  }, []);

  const togglePin = useCallback(async (noteId: string, currentPinned: boolean) => {
    await updateNote(noteId, { pinned: !currentPinned });
  }, [updateNote]);

  const addCollaborator = useCallback(async (
    noteId: string, 
    email: string, 
    permission: "viewer" | "editor"
  ) => {
    const noteRef = doc(db, "notes", noteId);
    const noteSnap = await getDoc(noteRef);
    
    if (!noteSnap.exists()) throw new Error("Note not found");
    
    const noteData = noteSnap.data();
    const collaborators = noteData.collaborators || [];
    const collaboratorEmails = noteData.collaboratorEmails || [];
    
    // Check if already a collaborator
    const existingIndex = collaborators.findIndex((c: Collaborator) => c.email === email);
    
    if (existingIndex >= 0) {
      // Update permission
      collaborators[existingIndex].permission = permission;
    } else {
      // Add new collaborator
      collaborators.push({
        email,
        permission,
        addedAt: Date.now(),
      });
      // Add email to denormalized array for querying
      if (!collaboratorEmails.includes(email)) {
        collaboratorEmails.push(email);
      }
    }
    
    await updateDoc(noteRef, { 
      collaborators,
      collaboratorEmails,
      updatedAt: Timestamp.now(),
    });
  }, []);

  const removeCollaborator = useCallback(async (noteId: string, email: string) => {
    const noteRef = doc(db, "notes", noteId);
    const noteSnap = await getDoc(noteRef);
    
    if (!noteSnap.exists()) throw new Error("Note not found");
    
    const noteData = noteSnap.data();
    const collaborators = (noteData.collaborators || []).filter(
      (c: Collaborator) => c.email !== email
    );
    const collaboratorEmails = (noteData.collaboratorEmails || []).filter(
      (e: string) => e !== email
    );
    
    await updateDoc(noteRef, { 
      collaborators,
      collaboratorEmails,
      updatedAt: Timestamp.now(),
    });
  }, []);

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    addCollaborator,
    removeCollaborator,
  };
}

// Hook for a single note with real-time updates and permission checking
export function useNote(noteId: string | null) {
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<"owner" | "editor" | "viewer" | "none">("none");

  useEffect(() => {
    if (!noteId) {
      setNote(null);
      setLoading(false);
      setPermission("none");
      return;
    }

    const noteRef = doc(db, "notes", noteId);
    
    const unsubscribe = onSnapshot(
      noteRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const noteData: Note = {
            id: snapshot.id,
            title: data.title || "",
            content: data.content || "",
            owner: data.owner,
            ownerEmail: data.ownerEmail || "",
            ownerName: data.ownerName || "",
            collaborators: data.collaborators || [],
            pinned: data.pinned || false,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
          };

          // Check user permission
          let userPermission: "owner" | "editor" | "viewer" | "none" = "none";
          
          if (user) {
            if (data.owner === user.uid) {
              userPermission = "owner";
            } else {
              const collaborator = (data.collaborators || []).find(
                (c: Collaborator) => c.email === user.email || c.uid === user.uid
              );
              if (collaborator) {
                userPermission = collaborator.permission;
              }
            }
          }

          setNote(noteData);
          setPermission(userPermission);
          setError(null);
        } else {
          setNote(null);
          setPermission("none");
          setError("Note not found");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching note:", err);
        setError("Failed to load note");
        setPermission("none");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [noteId, user]);

  return { note, loading, error, permission };
}
