'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, DocumentData, query, orderBy, collection, getDocs, where } from "firebase/firestore";
import FriendsPopup, { FriendsPopupRef } from '../../../../components/FriendsPopup';
import UserFriendsPopup, { UserFriendsPopupRef } from '../../../../components/UserFriendsPopup';
import UserPost from '../../../../components/UserPost';

interface UserProfile {
    username: string;
    bgColor: string;
    kao: string;
    accessory: string;
    leftSide: string;
    leftCheek: string;
    leftEye: string;
    mouth: string;
    rightEye: string;
    rightCheek: string;
    rightSide: string;
}

export default function UserProfile() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFriend, setIsFriend] = useState(false);
    const [isLoadingFriend, setIsLoadingFriend] = useState(false);
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;
    const friendsPopupRef = useRef<FriendsPopupRef | null>(null);
    const userFriendsPopupRef = useRef<UserFriendsPopupRef | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setCurrentUser(firebaseUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!userId) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const docRef = doc(db, "users", userId);
                const docSnap = await getDoc(docRef);
                
                if (!docSnap.exists()) {
                    setError('User not found');
                    return;
                }
                
                const data = docSnap.data();
                const profile: UserProfile = {
                    username: data.username || 'Unknown User',
                    bgColor: data.bgColor || '#ffffff',
                    kao: data.kao || '(^ᗜ^)',
                    accessory: data.accessory || '',
                    leftSide: data.leftSide || '(',
                    leftCheek: data.leftCheek || '',
                    leftEye: data.leftEye || '^',
                    mouth: data.mouth || 'ᗜ',
                    rightEye: data.rightEye || '^',
                    rightCheek: data.rightCheek || '',
                    rightSide: data.rightSide || ')'
                };
                
                setUserProfile(profile);
            } catch (err: any) {
                console.error('Error fetching user profile:', err);
                setError(err?.message || 'Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId]);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!userId) return;
            try {
                const q = query(collection(db, 'posts'), where("uid", "==", userId));
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
                
                setUserPosts(posts);
            } catch (err: any) {
                setError(err?.message || 'Failed to load user\'s posts');
                console.error('Error fetching user profile:', err);
            }
        };
        fetchPosts();
    }, [userId]);

    useEffect(() => {
        const checkFriendship = async () => {
            if (!currentUser || !userId || currentUser.uid === userId) return;
            
            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const friends = userData.friends || [];
                    setIsFriend(friends.includes(userId));
                }
            } catch (err) {
                console.error('Error checking friendship:', err);
            }
        };

        checkFriendship();
    }, [currentUser, userId]);

    const handleAddFriend = async () => {
        if (!currentUser || !userId || currentUser.uid === userId) return;
        
        setIsLoadingFriend(true);
        
        try {
            const currentUserDocRef = doc(db, "users", currentUser.uid);
            const targetUserDocRef = doc(db, "users", userId);
            
            if (isFriend) {
                // Remove friend
                await updateDoc(currentUserDocRef, {
                    friends: arrayRemove(userId)
                });
                await updateDoc(targetUserDocRef, {
                    friends: arrayRemove(currentUser.uid)
                });
                setIsFriend(false);
            } else {
                // Add friend
                await updateDoc(currentUserDocRef, {
                    friends: arrayUnion(userId)
                });
                await updateDoc(targetUserDocRef, {
                    friends: arrayUnion(currentUser.uid)
                });
                setIsFriend(true);
            }
        } catch (err: any) {
            console.error('Error updating friendship:', err);
            setError(err?.message || 'Failed to update friendship');
        } finally {
            setIsLoadingFriend(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid nav-margin bg-light">
                <div className="d-flex justify-content-center align-items-center vh-100">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !userProfile) {
        return (
            <div className="container-fluid nav-margin bg-light">
                <div className="d-flex justify-content-center align-items-center vh-100">
                    <div className="text-center">
                        <h2>Error</h2>
                        <p>{error || 'User not found'}</p>
                        <button className="btn btn-primary" onClick={() => router.push('/account')}>
                            Back to Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid nav-margin bg-light">
            <div className="row">
                <div
                    className="col-3 bg-light vh-100 fixed-top sidebar"
                    style={{ position: 'fixed', top: '9vh', bottom: 0, overflowY: 'auto' }}
                >
                    <ul className="px-4 mt-4 list-unstyled fs-5">
                        <li className="py-2" 
                            onClick={() => router.push('/home')}
                            style={{ cursor: 'pointer' }}>Home</li>
                        <li className="py-2" 
                            onClick={() => router.push('/account')}
                            style={{ cursor: 'pointer' }}>My Account</li>
                        <li className="py-2">Favorites</li>
                    </ul>
                </div>

                <div
                    className="col-9"
                    style={{
                        marginTop: '6vh', marginLeft: '25%', paddingTop: '5vh', height: '91vh', overflowY: 'auto', 
                        borderTopLeftRadius: '5vh', background: userProfile.bgColor
                    }}
                >
                    <div className="container-fluid">
                        <div className="row" style={{ paddingTop: '5vh' }}>
                            {/* Left Third - All Elements Stacked */}
                            <div className="col-12 col-md-4 px-4">
                                <div className="d-flex flex-column gap-3">
                                    {/* Kao */}
                                    <div style={{ fontSize: '4rem', whiteSpace: 'nowrap', overflow: 'visible' }}>
                                        {userProfile.kao}
                                    </div>
                                    
                                    {/* Username */}
                                    <h2 className="mb-3" style={{ wordWrap: 'break-word' }}>
                                        {userProfile.username}
                                    </h2>
                                    
                                    {/* Friends Icon */}
                                    <button 
                                        className="btn btn-link no-underline text-inherit hover:underline p-0 border-0 bg-transparent align-self-start"
                                        style={{ fontSize: '2rem', textDecoration: 'none' }}
                                        onClick={() => {
                                            if (currentUser && currentUser.uid === userId) {
                                                friendsPopupRef.current?.open();
                                            } else {
                                                userFriendsPopupRef.current?.open();
                                            }
                                        }}
                                        title={currentUser && currentUser.uid === userId ? "Your Friends" : `${userProfile.username}'s Friends`}
                                    >
                                        𖠋♡𖠋
                                    </button>
                                    
                                    {/* Add Friend Button */}
                                    {currentUser && currentUser.uid !== userId && (
                                        <button
                                            className={`btn align-self-start ${isFriend ? 'btn-outline-danger' : 'btn-primary'}`}
                                            onClick={handleAddFriend}
                                            disabled={isLoadingFriend}
                                        >
                                            {isLoadingFriend ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    {isFriend ? 'Removing...' : 'Adding...'}
                                                </>
                                            ) : (
                                                isFriend ? 'Remove Friend' : 'Add Friend'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Right Two Thirds - User Posts */}
                            <div className="col-12 col-md-8 px-4">
                                <div className="mb-4">
                                    {currentUser && currentUser.uid === userId && (
                                        <div className="alert alert-info mb-3">
                                            This is your own profile. <a href="/account" className="alert-link">Go to your account page</a> to edit your profile or make posts.
                                        </div>
                                    )}
                                    
                                    {!currentUser && (
                                        <div className="alert alert-warning mb-3">
                                            <a href="/login" className="alert-link">Sign in</a> to add this user as a friend.
                                        </div>
                                    )}
                                </div>
                                
                                <h4 className="mb-3">{userProfile.username}'s Posts</h4>
                                {userPosts.length === 0 ? (
                                    <p className="text-muted">No posts yet.</p>
                                ) : (
                                    <div>
                                        {userPosts.map((post, idx) => (
                                            <UserPost 
                                                key={idx}
                                                text={post.text}
                                                uid={post.uid}
                                                date={post.date}
                                                likes={post.likes}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FriendsPopup
                ref={friendsPopupRef}
                currentUser={currentUser}
            />
            <UserFriendsPopup
                ref={userFriendsPopupRef}
                targetUserId={userId}
                currentUser={currentUser}
            />
        </div>
    );
}