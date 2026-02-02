// video-api.ts - PAS besoin de "use client" ici
import { db } from "./firebase-api";
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  increment, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc,
  where
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export interface Video {
  id: string;
  url: string;
  title: string;
  userId: string;
  userName: string;
  userPhoto: string;
  likes: number;
  views: number;
  createdAt: Timestamp;
  videoId?: string;
}

export interface Like {
  userId: string;
  videoId: string;
  likedAt: Timestamp;
}

// Fonction pour extraire l'ID YouTube
export const extractYouTubeId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v') || 
                   urlObj.pathname.split('/').pop();
    return videoId && videoId.length === 11 ? videoId : null;
  } catch {
    // Pour les URLs courtes comme youtu.be/VIDEO_ID
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&\n?#]+)/);
    return match && match[1].length === 11 ? match[1] : null;
  }
};

// Créer une nouvelle vidéo
export const createVideo = async (url: string, title: string): Promise<string | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error("Utilisateur non connecté");
      return null;
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      console.error("URL YouTube invalide");
      return null;
    }

    const videoData = {
      url,
      title,
      userId: user.uid,
      userName: user.displayName || "Utilisateur anonyme",
      userPhoto: user.photoURL || "",
      likes: 0,
      views: 0,
      createdAt: serverTimestamp(),
      videoId
    };

    const docRef = await addDoc(collection(db, "videos"), videoData);
    console.log("Vidéo créée avec ID:", docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la création de la vidéo:", error);
    return null;
  }
};

// Récupérer toutes les vidéos avec filtrage
export const getVideos = async (filter: string = 'recent'): Promise<Video[]> => {
  try {
    let videosQuery;
    
    switch(filter) {
      case 'views':
        videosQuery = query(collection(db, "videos"), orderBy("views", "desc"));
        break;
      case 'likes':
        videosQuery = query(collection(db, "videos"), orderBy("likes", "desc"));
        break;
      case 'oldest':
        videosQuery = query(collection(db, "videos"), orderBy("createdAt", "asc"));
        break;
      case 'recent':
      default:
        videosQuery = query(collection(db, "videos"), orderBy("createdAt", "desc"));
        break;
    }
    
    const querySnapshot = await getDocs(videosQuery);
    
    const videos: Video[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        id: doc.id,
        url: data.url || '',
        title: data.title || 'Sans titre',
        userId: data.userId || '',
        userName: data.userName || 'Anonyme',
        userPhoto: data.userPhoto || '',
        likes: data.likes || 0,
        views: data.views || 0,
        createdAt: data.createdAt || serverTimestamp(),
        videoId: data.videoId
      } as Video);
    });
    
    return videos;
  } catch (error) {
    console.error("Erreur lors de la récupération des vidéos:", error);
    return [];
  }
};

// Ajouter une vue
export const addView = async (videoId: string): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      // Si l'utilisateur n'est pas connecté, on incrémente quand même
      const videoRef = doc(db, "videos", videoId);
      await updateDoc(videoRef, {
        views: increment(1)
      });
      return;
    }

    // Vérifier si l'utilisateur a déjà vu cette vidéo
    const viewRef = doc(db, "videos", videoId, "views", user.uid);
    const viewDoc = await getDoc(viewRef);

    if (!viewDoc.exists()) {
      // Marquer comme vu
      await setDoc(viewRef, {
        viewedAt: serverTimestamp()
      });

      // Incrémenter le compteur de vues
      const videoRef = doc(db, "videos", videoId);
      await updateDoc(videoRef, {
        views: increment(1)
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la vue:", error);
  }
};

// Gérer les likes
export const toggleLike = async (videoId: string): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error("Utilisateur non connecté");
      return false;
    }

    const likeRef = doc(db, "videos", videoId, "likes", user.uid);
    const likeDoc = await getDoc(likeRef);

    const videoRef = doc(db, "videos", videoId);

    if (likeDoc.exists()) {
      // Retirer le like
      await updateDoc(videoRef, {
        likes: increment(-1)
      });
      return false;
    } else {
      // Ajouter le like
      await setDoc(likeRef, {
        likedAt: serverTimestamp()
      });
      await updateDoc(videoRef, {
        likes: increment(1)
      });
      return true;
    }
  } catch (error) {
    console.error("Erreur lors du like:", error);
    return false;
  }
};

// Vérifier si l'utilisateur a aimé une vidéo
export const checkUserLiked = async (videoId: string): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return false;

    const likeRef = doc(db, "videos", videoId, "likes", user.uid);
    const likeDoc = await getDoc(likeRef);
    
    return likeDoc.exists();
  } catch (error) {
    console.error("Erreur lors de la vérification du like:", error);
    return false;
  }
};

// Récupérer l'URL d'embed YouTube
export const getYouTubeEmbedUrl = (url: string): string => {
  const videoId = extractYouTubeId(url);
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1`;
};