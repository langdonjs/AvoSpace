'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, DocumentData, query, orderBy, collection, getDocs, where } from "firebase/firestore";
import PostComposer, { PostComposerRef } from '../../../components/PostComposer';
import EditComposer, { EditComposerRef } from '../../../components/EditComposer';
// import FriendsPopup, { FriendsPopupRef } from '../../../components/FriendsPopup';
import UserPost from '../../../components/UserPost';

export default function Account() {
    const [ user, setUser ] = useState<User | null>(null);
    const [ username, setUsername ] = useState('this_person');
    const [ bgColor, setBgColor ] = useState('#ffffff');
    const [ userPosts, setUserPosts ] = useState<DocumentData[]>([]);
    const router = useRouter();
    const composerRef = useRef<PostComposerRef | null>(null);
    const editComposerRef = useRef<EditComposerRef | null>(null);
    // const friendsPopupRef = useRef<FriendsPopupRef | null>(null);
    
    // Kaomoji part states
    const [ accessory, setAccessory ] = useState('');
    const [ leftSide, setLeftSide ] = useState('(');
    const [ leftCheek, setLeftCheek ] = useState('');
    const [ leftEye, setLeftEye ] = useState('^');
    const [ mouth, setMouth ] = useState('ᗜ');
    const [ rightEye, setRightEye ] = useState('^');
    const [ rightCheek, setRightCheek ] = useState('');
    const [ rightSide, setRightSide ] = useState(')');
    const [ kao, setKao ] = useState('(^ᗜ^)');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const getUserInfo = async () => {
            if (user != null) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUsername(data.username || 'this_person');
                    setBgColor(data.bgColor || '#ffffff');
                    setKao(data.kao || '(^ᗜ^)');
                    
                    // Set individual kaomoji parts
                    setAccessory(data.accessory || '');
                    setLeftSide(data.leftSide || '(');
                    setLeftCheek(data.leftCheek || '');
                    setLeftEye(data.leftEye || '^');
                    setMouth(data.mouth || 'ᗜ');
                    setRightEye(data.rightEye || '^');
                    setRightCheek(data.rightCheek || '');
                    setRightSide(data.rightSide || ')');
                }
            }
        };
        getUserInfo();
    }, [user]);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!user?.uid) return;
            try {
                // Fetch posts without orderBy to avoid index requirement
                const q = query(collection(db, 'posts'), where("uid", "==", user.uid));
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
                console.error('Error fetching user posts:', err);
            }
        };
        fetchPosts();
    }, [user]);

    const handleEditCreated = (userData: {
        username: string;
        accessory: string;
        leftSide: string;
        leftCheek: string;
        leftEye: string;
        mouth: string;
        rightEye: string;
        rightCheek: string;
        rightSide: string;
        bgColor: string;
    }) => {
        // Update local state with the new data
        setUsername(userData.username);
        setBgColor(userData.bgColor);
        // Reconstruct the kaomoji from the individual parts
        const newKao = `${userData.accessory}${userData.leftSide}${userData.leftCheek}${userData.leftEye}${userData.mouth}${userData.rightEye}${userData.rightCheek}${userData.rightSide}`;
        setKao(newKao);
        setAccessory(userData.accessory);
        setLeftSide(userData.leftSide);
        setLeftCheek(userData.leftCheek);
        setLeftEye(userData.leftEye);
        setMouth(userData.mouth);
        setRightEye(userData.rightEye);
        setRightCheek(userData.rightCheek);
        setRightSide(userData.rightSide);
    };

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
                        <li className="py-2" style={{ cursor: 'pointer' }} onClick={() => composerRef.current?.open()}>Post</li>
                        <li className="py-2">Favorites</li>
                        <li className="py-2"
                            style={{ cursor: 'pointer' }} onClick={() => editComposerRef.current?.open()}>
                            Edit
                        </li>
                    </ul>
                </div>

                <div
                    className="col-9"
                    style={{
                        marginTop: '6vh', marginLeft: '25%', paddingTop: '5vh', height: '91vh', overflowY: 'auto', 
                        borderTopLeftRadius: '5vh', background: bgColor
                    }}
                >
                    <div className="container-fluid">
                        <div className="row" style={{ paddingTop: '5vh' }}>
                            {/* Left Third - All Elements Stacked */}
                            <div className="col-12 col-md-4 px-4">
                                <div className="d-flex flex-column gap-3">
                                    {/* Kao */}
                                    <div style={{ fontSize: '4rem', whiteSpace: 'nowrap', overflow: 'visible' }}>
                                        {kao}
                                    </div>
                                    
                                    {/* Username */}
                                    <h2 className="mb-3" style={{ wordWrap: 'break-word' }}>
                                        {username}
                                    </h2>
                                    
                                    {/* Friends Icon */}
                                    {/* <button 
                                        className="btn btn-link no-underline text-inherit hover:underline p-0 border-0 bg-transparent align-self-start"
                                        style={{ fontSize: '2rem', textDecoration: 'none' }}
                                        onClick={() => friendsPopupRef.current?.open()}
                                        title="Your Friends"
                                    >
                                        𖠋♡𖠋
                                    </button> */}
                                </div>
                            </div>
                            
                            {/* Right Two Thirds - User Posts */}
                            <div className="col-12 col-md-8 px-4">
                                <h4 className="mb-3">Your Posts</h4>
                                {userPosts.length === 0 ? (
                                    <p className="text-muted">No posts yet. <button 
                                        className="btn btn-link p-0" 
                                        onClick={() => composerRef.current?.open()}
                                        style={{ textDecoration: 'underline' }}
                                    >
                                        Create your first post!
                                    </button></p>
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
            <PostComposer
                ref={composerRef}
                onPostCreated={(doc) => setUserPosts((prev) => [doc, ...prev])}
            />
            <EditComposer
                ref={editComposerRef}
                defaultUsername={username}
                defaultAccessory={accessory}
                defaultLeftSide={leftSide}
                defaultLeftCheek={leftCheek}
                defaultLeftEye={leftEye}
                defaultMouth={mouth}
                defaultRightEye={rightEye}
                defaultRightCheek={rightCheek}
                defaultRightSide={rightSide}
                defaultBgColor={bgColor}
                onEditCreated={handleEditCreated}
            />
            {/* <FriendsPopup
                ref={friendsPopupRef}
                currentUser={user}
            /> */}
        </div>
    );
}