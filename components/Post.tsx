import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';



export default function Post({ text="", uid="", date="4/11/2025", likes=0, tags="" }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [kao, setKao] = useState<string>('❀༉ʕ˵˃ᗜ˂ ʔ');
    const [username, setUsername] = useState<string>('this_person');

    useEffect(() => {
        const fetchUserInfo = async () => {
          try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const data = userSnap.data()
              setUsername(data.username)
              setKao(data.kao)
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          } finally {
              setLoading(false);
          }
        };
        fetchUserInfo();
    }, [uid]);

    if (loading) {
      return <div>Loading post information...</div>;
    }

    const handlePostClick = () => {
        if (uid && uid.trim() !== '') {
            router.push(`/user/${uid}`);
        }
    };

    return (
        <div 
            className="card p-3 my-3 shadow sm" 
            style={{ cursor: uid && uid.trim() !== '' ? 'pointer' : 'default' }}
            onClick={handlePostClick}
        >
            <div className="card-body">
                <h3 className="card-title">
                    {kao}
                </h3>
                <h5 className="card-subtitle mb-2 text-muted">
                    @{username} | {date}
                    
                </h5>
                <p className="card-text">{text}</p>
            </div>
        </div>
    );
}