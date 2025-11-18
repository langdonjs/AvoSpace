'use client';

import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';

export type FriendsPopupRef = {
  open: () => void;
  close: () => void;
};

interface Friend {
  uid: string;
  username: string;
  kao: string;
}

type FriendsPopupProps = {
  currentUser?: User | null;
};

const FriendsPopup = forwardRef<FriendsPopupRef, FriendsPopupProps>(function FriendsPopup(
  { currentUser },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }));

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser || !isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          setFriends([]);
          return;
        }
        
        const userData = userDoc.data();
        const friendsList = userData.friends || [];
        
        if (friendsList.length === 0) {
          setFriends([]);
          return;
        }
        
        const friendsData: Friend[] = [];
        for (const friendId of friendsList) {
          try {
            const friendDocRef = doc(db, "users", friendId);
            const friendDoc = await getDoc(friendDocRef);
            
            if (friendDoc.exists()) {
              const friendData = friendDoc.data();
              friendsData.push({
                uid: friendId,
                username: friendData.username || 'Unknown User',
                kao: friendData.kao || '(^ᗜ^)'
              });
            }
          } catch (err) {
            console.error(`Error fetching friend ${friendId}:`, err);
          }
        }
        
        setFriends(friendsData);
      } catch (err: any) {
        console.error('Error fetching friends:', err);
        setError(err?.message || 'Failed to load friends');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [currentUser, isOpen]);

  const handleFriendClick = (friend: Friend) => {
    router.push(`/user/${friend.uid}`);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ 
        background: 'rgba(0,0,0,0.5)', 
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderRadius: '16px',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0" style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            color: 'var(--gray-900)'
          }}>
            Your Friends
          </h5>
          <button
            className="btn-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            style={{ fontSize: '1.25rem' }}
          ></button>
        </div>
        
        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: '12px' }}>
            {error}
          </div>
        )}
        
        {!loading && !error && friends.length === 0 && (
          <div className="text-center py-5">
            <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
              You don't have any friends yet.
            </p>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              Start making connections!
            </p>
          </div>
        )}
        
        {!loading && !error && friends.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {friends.map((friend) => (
              <div
                key={friend.uid}
                onClick={() => handleFriendClick(friend)}
                style={{ 
                  cursor: 'pointer',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--gray-200)',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--avocado-green-light)';
                  e.currentTarget.style.borderColor = 'var(--avocado-green)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--gray-200)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ fontSize: '2rem', lineHeight: 1 }}>
                  {friend.kao}
                </div>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '1rem',
                  color: 'var(--gray-900)'
                }}>
                  {friend.username}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default FriendsPopup;