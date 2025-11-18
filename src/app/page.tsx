'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleAuth = async () => {
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/home');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await setDoc(doc(db, "users", userCredential.user.uid), {
            bgColor: "#ffffff",
            kao: "(^ᗜ^)",
            username: email.split('@')[0],
            friends: []
          });
        }
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user document exists, if not create one
      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          bgColor: "#ffffff",
          kao: "(^ᗜ^)",
          username: result.user.displayName || result.user.email?.split('@')[0] || 'user',
          friends: []
        });
      }
      
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      backgroundColor: 'var(--off-white)',
      overflow: 'hidden'
    }}>
      {/* Left Side - Branding */}
      <div style={{
        flex: '0 0 55%',
        background: 'linear-gradient(135deg, var(--avocado-green) 0%, var(--avocado-green-hover) 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '4rem 6rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}></div>
        
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 800,
          marginBottom: '1rem',
          letterSpacing: '-0.03em',
          lineHeight: 1.1
        }}>
          AvoSpace
        </h1>
        <p style={{
          fontSize: '1.5rem',
          fontWeight: 400,
          marginBottom: '2rem',
          opacity: 0.9
        }}>
          Where developers connect
        </p>
        <p style={{
          fontSize: '1.125rem',
          opacity: 0.8,
          maxWidth: '500px',
          lineHeight: 1.6
        }}>
          Join the community of developers sharing ideas, building projects, and growing together in Codeology.
        </p>
        
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }}></div>
      </div>

      {/* Right Side - Auth Form */}
      <div style={{
        flex: '0 0 45%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'var(--white)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px'
        }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: 'var(--gray-900)',
              marginBottom: '0.5rem'
            }}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ 
              color: 'var(--gray-600)', 
              fontSize: '0.9375rem' 
            }}>
              {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
            </p>
          </div>

          {error && (
            <div style={{
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}
          
          <input 
            className="form-control mb-3"
            type="email"
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{
              borderRadius: '12px',
              border: '1px solid var(--gray-300)',
              padding: '0.875rem 1rem',
              fontSize: '0.9375rem',
              transition: 'all 200ms ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--avocado-green)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
          />
          <input 
            type="password" 
            className="form-control mb-4"
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
            style={{
              borderRadius: '12px',
              border: '1px solid var(--gray-300)',
              padding: '0.875rem 1rem',
              fontSize: '0.9375rem',
              transition: 'all 200ms ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--avocado-green)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
          />
          
          <button 
            className="btn btn-primary w-100 mb-3" 
            onClick={handleAuth}
            disabled={loading || !email || !password}
            style={{
              borderRadius: '12px',
              padding: '0.875rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              border: 'none'
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLogin ? 'Sign in' : 'Create account'
            )}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
            color: 'var(--gray-500)',
            fontSize: '0.875rem'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--gray-300)' }}></div>
            <span style={{ padding: '0 1rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--gray-300)' }}></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '12px',
              border: '1px solid var(--gray-300)',
              backgroundColor: 'var(--white)',
              color: 'var(--gray-700)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              marginBottom: '1.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-50)';
              e.currentTarget.style.borderColor = 'var(--gray-400)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--white)';
              e.currentTarget.style.borderColor = 'var(--gray-300)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-link" 
              onClick={() => setIsLogin(!isLogin)}
              style={{
                textDecoration: 'none',
                color: 'var(--gray-600)',
                fontSize: '0.875rem',
                padding: '0.5rem'
              }}
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
