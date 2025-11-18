import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Post({ text="", uid="", date="4/11/2025", likes=0, tags="", postId="" }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [kao, setKao] = useState<string>('❀༉ʕ˵˃ᗜ˂ ʔ');
    const [username, setUsername] = useState<string>('this_person');
    const [showPostDetail, setShowPostDetail] = useState(false);

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
      return (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="spinner-border spinner-border-sm" role="status"></div>
            <span style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>Loading post...</span>
          </div>
        </div>
      );
    }

    const handlePostClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on username
        if ((e.target as HTMLElement).closest('.username-link')) {
            return;
        }
        // Show post detail modal or navigate to post detail page
        setShowPostDetail(true);
    };

    const handleUsernameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (uid && uid.trim() !== '') {
            router.push(`/user/${uid}`);
        }
    };

    return (
        <>
            <div 
                className="card" 
                style={{ 
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onClick={handlePostClick}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                <div className="card-body" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '2rem', lineHeight: 1 }}>{kao}</div>
                        <div style={{ flex: 1 }}>
                            <div 
                                className="username-link"
                                onClick={handleUsernameClick}
                                style={{ 
                                    fontWeight: 600, 
                                    fontSize: '0.9375rem', 
                                    color: 'var(--avocado-green)',
                                    marginBottom: '0.25rem',
                                    cursor: 'pointer',
                                    display: 'inline-block',
                                    transition: 'color 150ms ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--avocado-green-hover)';
                                    e.currentTarget.style.textDecoration = 'underline';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--avocado-green)';
                                    e.currentTarget.style.textDecoration = 'none';
                                }}
                            >
                                @{username}
                            </div>
                            <div style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--gray-600)'
                            }}>
                                {date}
                            </div>
                        </div>
                    </div>
                    <p className="card-text" style={{ 
                        margin: 0, 
                        fontSize: '0.9375rem', 
                        lineHeight: 1.6,
                        color: 'var(--gray-800)'
                    }}>
                        {text}
                    </p>
                </div>
            </div>

            {/* Post Detail Modal */}
            {showPostDetail && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1050,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setShowPostDetail(false)}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            borderRadius: '16px',
                            boxShadow: 'var(--shadow-xl)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="card-body" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                    <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{kao}</div>
                                    <div>
                                        <div 
                                            className="username-link"
                                            onClick={handleUsernameClick}
                                            style={{ 
                                                fontWeight: 600, 
                                                fontSize: '1.125rem', 
                                                color: 'var(--avocado-green)',
                                                marginBottom: '0.25rem',
                                                cursor: 'pointer',
                                                display: 'inline-block',
                                                transition: 'color 150ms ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = 'var(--avocado-green-hover)';
                                                e.currentTarget.style.textDecoration = 'underline';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = 'var(--avocado-green)';
                                                e.currentTarget.style.textDecoration = 'none';
                                            }}
                                        >
                                            @{username}
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.875rem', 
                                            color: 'var(--gray-600)'
                                        }}>
                                            {date}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPostDetail(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        color: 'var(--gray-500)',
                                        padding: '0.25rem',
                                        lineHeight: 1
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <p style={{ 
                                margin: 0, 
                                fontSize: '1.125rem', 
                                lineHeight: 1.8,
                                color: 'var(--gray-800)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {text}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}