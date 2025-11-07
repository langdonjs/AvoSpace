'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from "firebase/firestore";

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in!');
        router.push('/account');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Signed up!');
        if (auth.currentUser != null) {
          await setDoc(doc(db, "users", auth.currentUser.uid), {
            bgColor: "#ffffff",
            kao: "(^ᗜ^)",
            username: email,
            friends: []
          });
        }
        
        router.push('/account');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="mt-5">
      <div className="container p-4 w-50 bg-light">
        <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>
        <input className="form-control my-2"
        placeholder="Email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} />
        <input type="password" 
        className="form-control my-2"
        placeholder="Password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary my-2" onClick={handleAuth}>{isLogin ? 'Login' : 'Sign Up'}</button>
        <button className="btn btn-link" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need to create an account?' : 'Already have an account?'}
        </button>
      </div>
    </div>

  );
}
