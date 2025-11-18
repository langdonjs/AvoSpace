'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState<string>('');
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Fetch username
                const fetchUsername = async () => {
                    try {
                        const userDocRef = doc(db, "users", firebaseUser.uid);
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            setUsername(data.username || 'Account');
                        } else {
                            setUsername('Account');
                        }
                    } catch (error) {
                        console.error("Error fetching username:", error);
                        setUsername('Account');
                    }
                };
                fetchUsername();
            } else {
                setUsername('');
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogoClick = (e: React.MouseEvent) => {
        if (!user) {
          e.preventDefault();
        }
    };
    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };
    

    const isLoginPage = pathname === '/';

    return (
        <nav className="navbar navbar-expand-lg navbar-light px-4 fixed-top">
            <Link className="navbar-brand" href="/home" onClick={handleLogoClick}>
                <img src="/AvoSpace.png" className="image-fluid" style={{height: '40px'}} />
            </Link>
            {!isLoginPage && user && (
                <div className="navbar-nav ms-auto d-flex flex-row align-items-center">
                    <Link className="nav-link" href="/account" style={{ fontWeight: 500 }}>
                        {username || 'Account'}
                    </Link>
                    <button className="btn btn-link nav-link" onClick={handleLogout} style={{margin: 0}}>
                        Logout
                    </button>
                </div>
            )}
        </nav>
    )
}