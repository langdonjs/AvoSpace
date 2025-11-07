import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function UserPost({ text="", uid="", date="4/11/2025", likes=0 }) {
    const [loading, setLoading] = useState(true);
    const [kao, setKao] = useState<string>('(^ᗜ^)');
    const [username, setUsername] = useState<string>('Unknown User');

    useEffect(() => {
        const fetchUserInfo = async () => {
          try {
            if (!uid || uid.trim() === '') {
              setLoading(false);
              return;
            }
            
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              setUsername(data.username || 'Unknown User');
              setKao(data.kao || '(^ᗜ^)');
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
      return (
        <div className="card p-3 mb-3 shadow-sm">
          <div className="card-body">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            Loading post information...
          </div>
        </div>
      );
    }

    return (
        <div className="card p-3 mb-3 shadow-sm">
            <div className="card-body">
                <h5 className="card-title mb-2" style={{ fontSize: '1.5rem' }}>
                    {kao}
                </h5>
                <h6 className="card-subtitle mb-2 text-muted">
                    @{username} | {date}
                </h6>
                <p className="card-text">{text}</p>
            </div>
        </div>
    );
}