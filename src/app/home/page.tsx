'use client';
import Post from '../../../components/Post';
import PostComposer, { PostComposerRef } from '../../../components/PostComposer';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, DocumentData, where, query, limit, startAfter, endBefore, limitToLast, orderBy, DocumentSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';
import choyImg from '../../images/choy.png';
import drewskiImg from '../../images/drewski.png';
import goatImg from '../../images/goat.png';
import rohanImg from '../../images/rohan.png';
import tonyImg from '../../images/tony.png';
import vivekImg from '../../images/vivek.png';
import lochanImg from '../../images/lochan.png';
import phillipImg from '../../images/phillip.png';
import sahirImg from '../../images/sahir.png';
import timImg from '../../images/tim.png';

interface Friend {
  uid: string;
  username: string;
  kao: string;
}

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<DocumentData[]>([]);
  const [friendsPosts, setFriendsPosts] = useState<DocumentData[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'friends' | 'favorites' | 'jiggle'>('home');
  const [loading, setLoading] = useState<boolean>(true);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const composerRef = useRef<PostComposerRef | null>(null);
  const [ user, setUser ] = useState<any>(null);
  const [profileName, setProfileName] = useState<string>('this_person');
  const [kao, setKao] = useState<string>('❀༉ʕ˵˃ᗜ˂ ʔ');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSnapshots, setPageSnapshots] = useState<{ [key: number]: { first: DocumentSnapshot | null, last: DocumentSnapshot | null } }>({});
  const [hasNextPage, setHasNextPage] = useState(true);
  const POSTS_PER_PAGE = 10;
  
  const [friends, setFriends] = useState<Friend[]>([]);

  // Jiggle game state
  const jiggleMembers = [
    { name: 'Andrew', image: choyImg.src },
    { name: 'Drewski', image: drewskiImg.src },
    { name: 'Maithreya', image: goatImg.src },
    { name: 'Rohan', image: rohanImg.src },
    { name: 'Tony', image: tonyImg.src },
    { name: 'Vivek', image: vivekImg.src },
    { name: 'Lochan', image: lochanImg.src },
    { name: 'Phillip', image: phillipImg.src },
    { name: 'Sahir', image: sahirImg.src },
    { name: 'Tim', image: timImg.src },
  ];
  const [jiggleIndex, setJiggleIndex] = useState(0);
  const [isJiggling, setIsJiggling] = useState(false);
  const [jigglePower, setJigglePower] = useState(1);
  const [lastJiggleClick, setLastJiggleClick] = useState<number | null>(null);
  const [jigglePops, setJigglePops] = useState<{ id: number; left: number; top: number }[]>([]);

  const handleRandomJiggle = () => {
    const now = Date.now();

    // If the user clicks again quickly, increase power (speed + size)
    let nextPower = 1;
    if (lastJiggleClick !== null && now - lastJiggleClick < 600) {
      nextPower = Math.min(jigglePower + 1, 5); // cap at 5
    } else {
      nextPower = 1;
    }

    const next = Math.floor(Math.random() * jiggleMembers.length);
    setJiggleIndex(next);
    setJigglePower(nextPower);
    setLastJiggleClick(now);
    setIsJiggling(true);

    // Add a floating "Jiggle" text at a random position within the jiggle area
    const id = now + Math.random();
    const left = 15 + Math.random() * 70; // % from left
    const top = 10 + Math.random() * 50;  // % from top
    setJigglePops((prev) => [...prev, { id, left, top }]);

    // Remove after animation completes
    setTimeout(() => {
      setJigglePops((prev) => prev.filter((p) => p.id !== id));
    }, 900);
  };

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

  const fetchPosts = async (page: number = 1, direction: 'next' | 'prev' | 'first' = 'first') => {
    try {
      setLoading(true);
      let q;
      
      if (direction === 'first' || page === 1) {
        // First page - no cursor needed
        q = query(
          collection(db, 'posts'),
          orderBy('date', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      } else if (direction === 'next' && pageSnapshots[page - 1]?.last) {
        // Next page - start after last doc of previous page
        q = query(
          collection(db, 'posts'),
          orderBy('date', 'desc'),
          startAfter(pageSnapshots[page - 1].last),
          limit(POSTS_PER_PAGE)
        );
      } else if (direction === 'prev' && pageSnapshots[page + 1]?.first) {
        // Previous page - end before first doc of next page
        q = query(
          collection(db, 'posts'),
          orderBy('date', 'desc'),
          endBefore(pageSnapshots[page + 1].first),
          limitToLast(POSTS_PER_PAGE)
        );
      } else {
        // Fallback to first page
        q = query(
          collection(db, 'posts'),
          orderBy('date', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      }
      
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length === 0) {
        setPosts([]);
        setHasNextPage(false);
        setLoading(false);
        return;
      }
      
      // Store snapshots for this page
      const newPageSnapshots = { ...pageSnapshots };
      newPageSnapshots[page] = {
        first: snapshot.docs[0],
        last: snapshot.docs[snapshot.docs.length - 1]
      };
      setPageSnapshots(newPageSnapshots);
      
      let newPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort by date (should already be sorted, but just in case)
      newPosts.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB.getTime() - dateA.getTime();
      });
      
      setPosts(newPosts);
      
      // Check if there are more posts by trying to fetch one more
      const checkNextQuery = query(
        collection(db, 'posts'),
        orderBy('date', 'desc'),
        startAfter(snapshot.docs[snapshot.docs.length - 1]),
        limit(1)
      );
      const checkSnapshot = await getDocs(checkNextQuery);
      setHasNextPage(checkSnapshot.docs.length > 0);
      
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load posts');
      setLoading(false);
    }
  };

  const goToNextPage = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPosts(nextPage, 'next');
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchPosts(prevPage, 'prev');
    }
  };

  useEffect(() => {
    fetchPosts(1, 'first');
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
              className={activeTab === 'jiggle' ? 'active' : ''}
              onClick={() => setActiveTab('jiggle')}
              style={{ 
                padding: '1rem 1.25rem',
                marginBottom: '0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: activeTab === 'jiggle' ? 'var(--white)' : 'var(--gray-700)',
                backgroundColor: activeTab === 'jiggle' ? 'var(--avocado-green)' : 'transparent'
              }}
            >
              Jiggle Game
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
                
                {/* Pagination Controls */}
                {!loading && !error && posts.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginTop: '2rem',
                    width: '100%'
                  }}>
                    {currentPage > 1 && (
                      <button 
                        onClick={goToPrevPage}
                        style={{
                          padding: '0.75rem 1.5rem',
                          borderRadius: '12px',
                          border: '1px solid var(--gray-300)',
                          backgroundColor: 'var(--white)',
                          color: 'var(--gray-700)',
                          fontWeight: 500,
                          fontSize: '0.9375rem',
                          cursor: 'pointer',
                          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--avocado-green-light)';
                          e.currentTarget.style.borderColor = 'var(--avocado-green)';
                          e.currentTarget.style.color = 'var(--avocado-green)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--white)';
                          e.currentTarget.style.borderColor = 'var(--gray-300)';
                          e.currentTarget.style.color = 'var(--gray-700)';
                        }}
                      >
                        ← Previous
                      </button>
                    )}
                    
                    <div style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--avocado-green-light)',
                      color: 'var(--gray-900)',
                      fontWeight: 700,
                      fontSize: '0.9375rem'
                    }}>
                      Page {currentPage}
                    </div>
                    
                    {hasNextPage && (
                      <button 
                        onClick={goToNextPage}
                        style={{
                          padding: '0.75rem 1.5rem',
                          borderRadius: '12px',
                          border: '1px solid var(--gray-300)',
                          backgroundColor: 'var(--white)',
                          color: 'var(--gray-700)',
                          fontWeight: 500,
                          fontSize: '0.9375rem',
                          cursor: 'pointer',
                          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--avocado-green-light)';
                          e.currentTarget.style.borderColor = 'var(--avocado-green)';
                          e.currentTarget.style.color = 'var(--avocado-green)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--white)';
                          e.currentTarget.style.borderColor = 'var(--gray-300)';
                          e.currentTarget.style.color = 'var(--gray-700)';
                        }}
                      >
                        Next →
                      </button>
                    )}
                  </div>
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

            {activeTab === 'jiggle' && (
              <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
                <h1 style={{ 
                  fontSize: '1.875rem', 
                  fontWeight: 600, 
                  marginBottom: '1.5rem',
                  color: 'var(--gray-900)',
                  textAlign: 'center'
                }}>
                  Jiggle a Codeology Member
                </h1>

                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}>
                  <div style={{ 
                    width: '220px',
                    height: '220px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    backgroundColor: 'var(--gray-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={jiggleMembers[jiggleIndex].image}
                      alt={jiggleMembers[jiggleIndex].name}
                      className={isJiggling ? 'jiggle-image' : ''}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        animationDuration: `${0.5 / jigglePower}s`
                      }}
                      onAnimationEnd={() => setIsJiggling(false)}
                    />
                  </div>

                  <div style={{ 
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--gray-900)'
                  }}>
                    {jiggleMembers[jiggleIndex].name}
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleRandomJiggle}
                    style={{
                      borderRadius: '999px',
                      padding: '0.75rem 1.75rem',
                      fontSize: '0.9375rem',
                      fontWeight: 600
                    }}
                  >
                    Jiggle!
                  </button>

                  {/* Floating "Jiggle" texts */}
                  {jigglePops.map((pop) => (
                    <div
                      key={pop.id}
                      className="jiggle-pop"
                      style={{
                        left: `${pop.left}%`,
                        top: `${pop.top}%`
                      }}
                    >
                      Jiggle
                    </div>
                  ))}
                </div>
              </div>
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
          // When a new post is created, reset to page 1 and refresh
          setCurrentPage(1);
          setPageSnapshots({});
          fetchPosts(1, 'first');
          
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