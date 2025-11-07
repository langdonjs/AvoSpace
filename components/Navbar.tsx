'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';


export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
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
        <nav className="navbar navbar-expand-lg navbar-light bg-light px-4 fixed-top">
            <Link className="navbar-brand" href="/home" onClick={handleLogoClick}>
            <img src="/AvoSpace.png" className="image-fluid" style={{height: '6vh'}} /></Link>
            {!isLoginPage && user&& (
                <div className="navbar-nav ms-auto">
                    <Link className="nav-link" href="/account">Account</Link>
                    <button className="btn btn-link nav-link" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            )}
            
        </nav>
    )
}