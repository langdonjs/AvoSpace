'use client';
import Post from '../../../components/Post';
import PostComposer, { PostComposerRef } from '../../../components/PostComposer';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, DocumentData, query, orderBy, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<DocumentData[]>([]);
  const [friendsPosts, setFriendsPosts] = useState<DocumentData[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'friends'>('home');
  const [loading, setLoading] = useState<boolean>(true);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const composerRef = useRef<PostComposerRef | null>(null);
  const [ user, setUser ] = useState<any>(null);
  const [profileName, setProfileName] = useState<string>('this_person');
  const [kao, setKao] = useState<string>('❀༉ʕ˵˃ᗜ˂ ʔ');

  useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });
        return () => unsubscribe();
    }, []);

  const fetchFriendsPosts = async () => {
    if (!user?.uid) return;
    
    setFriendsLoading(true);
    try {
      // Get user's friends list
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setFriendsPosts([]);
        return;
      }
      
      const userData = userDoc.data();
      const friendsList = userData.friends || [];
      
      if (friendsList.length === 0) {
        setFriendsPosts([]);
        return;
      }
      
      // Fetch posts from all friends
      const friendsPostsData: DocumentData[] = [];
      for (const friendId of friendsList) {
        try {
          const friendPostsQuery = query(collection(db, 'posts'), where("uid", "==", friendId));
          const friendPostsSnapshot = await getDocs(friendPostsQuery);
          const friendPosts = friendPostsSnapshot.docs.map(d => d.data());
          friendsPostsData.push(...friendPosts);
        } catch (err) {
          console.error(`Error fetching posts for friend ${friendId}:`, err);
        }
      }
      
      // Sort by date (newest first) with proper date handling
      friendsPostsData.sort((a, b) => {
        // Handle different date formats
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // If dates are invalid, put them at the end
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB.getTime() - dateA.getTime();
      });
      setFriendsPosts(friendsPostsData);
    } catch (err: any) {
      console.error('Error fetching friends posts:', err);
      setError(err?.message || 'Failed to load friends posts');
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Fetch all posts without ordering to avoid index issues
        const q = query(collection(db, 'posts'));
        const snapshot = await getDocs(q);
        let posts = snapshot.docs.map(d => d.data());
        
        // Sort posts by date manually (newest first)
        posts.sort((a, b) => {
          // Handle different date formats
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          
          // If dates are invalid, put them at the end
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          
          return dateB.getTime() - dateA.getTime();
        });
        
        setPosts(posts);
      } catch (err: any) {
        setError(err?.message || 'Failed to load posts');
      }
    };
    fetchPosts();
    const getUserInfo = async () => {
      try {
        if (user != null) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const data = docSnap.data()
              setProfileName(data.username)
              setKao(data.kao)
          }
        } 
      } catch (err: any) {
        setError(err?.message || 'Failed to load user info');
      }
    }
    getUserInfo();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'friends' && user?.uid) {
      fetchFriendsPosts();
    }
  }, [activeTab, user]);

  return (
    <div className="container-fluid nav-margin bg-light">
      <div className="row">
        <div
          className="col-3 bg-light vh-100 fixed-top sidebar"
          style={{ position: 'fixed', top: '9vh', bottom: 0, overflowY: 'auto' }}
        >
          <ul className="px-4 mt-4 list-unstyled fs-5">
            <li className="py-2" 
                onClick={() => setActiveTab('home')}
                style={{ cursor: 'pointer', color: activeTab === 'home' ? '#007bff' : 'inherit' }}>
                Home
            </li>
            <li className="py-2" 
                onClick={() => setActiveTab('friends')}
                style={{ cursor: 'pointer', color: activeTab === 'friends' ? '#007bff' : 'inherit' }}>
                Friends
            </li>
            <li className="py-2" style={{ cursor: 'pointer' }} onClick={() => composerRef.current?.open()}>Post</li>
            <li className="py-2">Favorites</li>
          </ul>
        </div>

        <div
          className="col-9 bg-white"
          style={{
            marginTop: '6vh', marginLeft: '25%', paddingTop: '5vh', height: '91vh', overflowY: 'auto', 
              borderTopLeftRadius: '5vh',
          }}
        >
          <div className="container">
            <h1>{activeTab === 'home' ? 'Home' : 'Friends'}</h1>
            
            {activeTab === 'home' && (
              <>
                {loading && <div>Loading...</div>}
                {error && <div className="text-danger">{error}</div>}
                {!loading && !error && posts.map((doc, idx) => (
                  <div key={idx}>
                    <Post text={doc.text} uid={doc.uid || ''} date={doc.date} />
                  </div>
                ))}
              </>
            )}
            
            {activeTab === 'friends' && (
              <>
                {friendsLoading && <div>Loading friends posts...</div>}
                {!friendsLoading && friendsPosts.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No posts from friends yet.</p>
                    <p className="text-muted">Add some friends to see their posts here!</p>
                  </div>
                )}
                {!friendsLoading && friendsPosts.length > 0 && friendsPosts.map((doc, idx) => (
                  <div key={idx}>
                    <Post text={doc.text} uid={doc.uid || ''} date={doc.date} />
                  </div>
                ))}
              </>
            )}
            
          </div>
        </div>
      </div>
      <PostComposer
        ref={composerRef}
        onPostCreated={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
          // If we're viewing friends tab and this is a friend's post, add it to friends feed too
          if (activeTab === 'friends' && user?.uid && newPost.uid !== user.uid) {
            // Check if this user is a friend
            const checkIfFriend = async () => {
              try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                  const userData = userDoc.data() as any;
                  const friendsList = userData.friends || [];
                  if (friendsList.includes(newPost.uid)) {
                    setFriendsPosts((prev) => [newPost, ...prev]);
                  }
                }
              } catch (err) {
                console.error('Error checking if user is friend:', err);
              }
            };
            checkIfFriend();
          }
        }}
      />
    </div>
  );
}