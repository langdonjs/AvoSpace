'use client';
import Post from '../../../components/Post';
import PostComposer, { PostComposerRef } from '../../../components/PostComposer';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, DocumentData, where, query, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

interface Friend {
  uid: string;
  username: string;
  kao: string;
}

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<DocumentData[]>([]);
  const [friendsPosts, setFriendsPosts] = useState<DocumentData[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'friends' | 'favorites'>('home');
  const [loading, setLoading] = useState<boolean>(true);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const composerRef = useRef<PostComposerRef | null>(null);
  const [ user, setUser ] = useState<any>(null);
  const [profileName, setProfileName] = useState<string>('this_person');
  const [kao, setKao] = useState<string>('❀༉ʕ˵˃ᗜ˂ ʔ');
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });
        return () => unsubscribe();
    }, []);

  // Fetch friends list
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.uid) return;
      
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const friendsList = userData.friends || [];
          
          const friendsData: Friend[] = [];
          for (const friendId of friendsList) {
            try {
              const friendDocRef = doc(db, "users", friendId);
              const friendDoc = await getDoc(friendDocRef);
              
              if (friendDoc.exists()) {
                const friendData = friendDoc.data();
                friendsData.push({
                  uid: friendId,
                  username: friendData.username || 'Unknown',
                  kao: friendData.kao || '(^ᗜ^)'
                });
              }
            } catch (err) {
              console.error(`Error fetching friend ${friendId}:`, err);
            }
          }
          
          setFriends(friendsData);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    };

    fetchFriends();
  }, [user]);

  const fetchFriendsPosts = async () => {
    if (!user?.uid) return;
    
    setFriendsLoading(true);
    try {
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
      
      friendsPostsData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
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

  const fetchPosts = async (loadMore = false) => {
    try {
      let q;
      if (loadMore && lastVisible) {
        q = query(collection(db, 'posts'), startAfter(lastVisible), limit(10));
      } else {
        q = query(collection(db, 'posts'), limit(10));
      }
      
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length === 0) {
        setHasMore(false);
        return;
      }
      
      let newPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      newPosts.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB.getTime() - dateA.getTime();
      });
      
      if (loadMore) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
    } catch (err: any) {
      setError(err?.message || 'Failed to load posts');
    }
  };

  useEffect(() => {
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
    <div className="container-fluid nav-margin" style={{ 
      backgroundColor: 'var(--off-white)',
      minHeight: '100vh'
    }}>
      <div style={{ display: 'flex' }}>
        {/* Left Sidebar */}
        <div
          className="sidebar"
          style={{ 
            position: 'fixed', 
            top: '64px', 
            bottom: 0, 
            overflowY: 'auto',
            backgroundColor: 'var(--white)',
            borderRight: '1px solid var(--gray-200)',
            padding: '2rem 1.5rem',
            width: '220px',
            left: 0
          }}
        >
          <ul className="list-unstyled" style={{ margin: 0, padding: 0 }}>
            <li 
              className={activeTab === 'home' ? 'active' : ''}
              onClick={() => setActiveTab('home')}
              style={{ 
                padding: '1rem 1.25rem',
                marginBottom: '0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: activeTab === 'home' ? 'var(--white)' : 'var(--gray-700)',
                backgroundColor: activeTab === 'home' ? 'var(--avocado-green)' : 'transparent'
              }}
            >
              Home
            </li>
            <li 
              className={activeTab === 'friends' ? 'active' : ''}
              onClick={() => setActiveTab('friends')}
              style={{ 
                padding: '1rem 1.25rem',
                marginBottom: '0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: activeTab === 'friends' ? 'var(--white)' : 'var(--gray-700)',
                backgroundColor: activeTab === 'friends' ? 'var(--avocado-green)' : 'transparent'
              }}
            >
              Friends
            </li>
            <li 
              onClick={() => composerRef.current?.open()}
              style={{ 
                padding: '1rem 1.25rem',
                marginBottom: '0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--gray-700)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--avocado-green-light)';
                e.currentTarget.style.color = 'var(--avocado-green)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--gray-700)';
              }}
            >
              Post
            </li>
            <li 
              className={activeTab === 'favorites' ? 'active' : ''}
              onClick={() => setActiveTab('favorites')}
              style={{ 
                padding: '1rem 1.25rem',
                marginBottom: '0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: activeTab === 'favorites' ? 'var(--white)' : 'var(--gray-700)',
                backgroundColor: activeTab === 'favorites' ? 'var(--avocado-green)' : 'transparent'
              }}
            >
              Favorites
            </li>
          </ul>
        </div>

        {/* Center Feed */}
        <div
          style={{
            marginTop: '64px', 
            marginLeft: '220px',
            marginRight: '280px',
            paddingTop: '4rem', 
            paddingBottom: '4rem',
            paddingLeft: '2rem',
            paddingRight: '2rem',
            minHeight: 'calc(100vh - 64px)',
            backgroundColor: 'var(--white)',
            borderTopLeftRadius: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: 'calc(100% - 500px)'
          }}
        >
          <div style={{ 
            maxWidth: '614px', 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {activeTab === 'home' && (
              <>
                <div style={{ 
                  marginBottom: '3rem',
                  textAlign: 'center',
                  width: '100%'
                }}>
                  <h1 style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 700, 
                    marginBottom: '1rem',
                    color: 'var(--gray-900)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ 
                      color: 'var(--avocado-green)',
                      background: 'linear-gradient(135deg, var(--avocado-green) 0%, var(--avocado-green-hover) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 800,
                      letterSpacing: '-0.02em'
                    }}>
                      AvoSpace
                    </span>
                    <span style={{ color: 'var(--gray-700)', fontWeight: 400 }}>Feed</span>
                  </h1>
                  <p style={{ 
                    color: 'var(--gray-600)', 
                    fontSize: '1.125rem',
                    margin: 0,
                    lineHeight: 1.6
                  }}>
                    Discover and share moments in Codeology
                  </p>
                </div>
                
                {loading && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    padding: '4rem',
                    color: 'var(--gray-600)'
                  }}>
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger" style={{ borderRadius: '12px', marginBottom: '1.5rem', width: '100%' }}>
                    {error}
                  </div>
                )}
                {!loading && !error && posts.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '4rem 2rem',
                    backgroundColor: 'var(--gray-100)',
                    borderRadius: '16px',
                    border: '2px dashed var(--gray-300)',
                    width: '100%'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                    <p style={{ 
                      color: 'var(--gray-600)', 
                      fontSize: '1.125rem',
                      marginBottom: '0.5rem',
                      fontWeight: 500
                    }}>
                      No posts yet
                    </p>
                    <p style={{ 
                      color: 'var(--gray-500)', 
                      fontSize: '0.9375rem'
                    }}>
                      Be the first to share something!
                    </p>
                  </div>
                )}
                {!loading && !error && posts.map((doc, idx) => (
                  <div key={doc.id || idx} style={{ marginBottom: '1.5rem', width: '100%' }}>
                    <Post text={doc.text} uid={doc.uid || ''} date={doc.date} postId={doc.id || idx.toString()} />
                  </div>
                ))}
                {!loading && !error && hasMore && posts.length > 0 && (
                  <button 
                    onClick={() => fetchPosts(true)}
                    className="btn btn-outline-secondary"
                    style={{
                      borderRadius: '12px',
                      padding: '0.75rem 2rem',
                      marginTop: '1rem'
                    }}
                  >
                    Load More Posts
                  </button>
                )}
              </>
            )}
            
            {activeTab === 'friends' && (
              <>
                <h1 style={{ 
                  fontSize: '1.875rem', 
                  fontWeight: 600, 
                  marginBottom: '2rem',
                  color: 'var(--gray-900)',
                  width: '100%',
                  textAlign: 'left'
                }}>
                  Friends
                </h1>
                {friendsLoading && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    padding: '4rem',
                    color: 'var(--gray-600)',
                    width: '100%'
                  }}>
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                {!friendsLoading && friendsPosts.length === 0 && (
                  <div className="text-center" style={{ padding: '4rem 2rem', width: '100%' }}>
                    <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      No posts from friends yet.
                    </p>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                      Add some friends to see their posts here!
                    </p>
                  </div>
                )}
                {!friendsLoading && friendsPosts.length > 0 && friendsPosts.map((doc, idx) => (
                  <div key={idx} style={{ marginBottom: '1.5rem', width: '100%' }}>
                    <Post text={doc.text} uid={doc.uid || ''} date={doc.date} postId={doc.id || idx.toString()} />
                  </div>
                ))}
              </>
            )}

            {activeTab === 'favorites' && (
              <>
                <h1 style={{ 
                  fontSize: '1.875rem', 
                  fontWeight: 600, 
                  marginBottom: '2rem',
                  color: 'var(--gray-900)',
                  width: '100%',
                  textAlign: 'left'
                }}>
                  Favorites
                </h1>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '4rem 2rem',
                  backgroundColor: 'var(--gray-100)',
                  borderRadius: '16px',
                  border: '2px dashed var(--gray-300)',
                  width: '100%'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                  <p style={{ 
                    color: 'var(--gray-600)', 
                    fontSize: '1.125rem',
                    marginBottom: '0.5rem',
                    fontWeight: 500
                  }}>
                    No favorites yet
                  </p>
                  <p style={{ 
                    color: 'var(--gray-500)', 
                    fontSize: '0.9375rem'
                  }}>
                    Start favoriting posts to see them here!
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Friends List */}
        <div
          style={{
            position: 'fixed',
            top: '64px',
            right: 0,
            bottom: 0,
            width: '280px',
            backgroundColor: 'var(--white)',
            borderLeft: '1px solid var(--gray-200)',
            padding: '2rem 1.5rem',
            overflowY: 'auto'
          }}
        >
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--gray-900)',
            marginBottom: '1.5rem'
          }}>
            Friends ({friends.length})
          </h3>
          
          {friends.length === 0 ? (
            <p style={{
              color: 'var(--gray-500)',
              fontSize: '0.875rem',
              textAlign: 'center',
              padding: '2rem 0'
            }}>
              No friends yet. Start connecting!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {friends.map((friend) => (
                <div
                  key={friend.uid}
                  onClick={() => router.push(`/user/${friend.uid}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--avocado-green-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{friend.kao}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      color: 'var(--gray-900)'
                    }}>
                      {friend.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <PostComposer
        ref={composerRef}
        onPostCreated={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
          if (activeTab === 'friends' && user?.uid && newPost.uid !== user.uid) {
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