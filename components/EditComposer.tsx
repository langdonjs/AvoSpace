'use client'
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type EditComposerRef = {
  open: () => void;
  close: () => void;
};

type EditComposerProps = {
  onEditCreated?: (doc: {
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
  }) => void;
  defaultUsername?: string;
  defaultAccessory?: string;
  defaultLeftSide?: string;
  defaultLeftCheek?: string;
  defaultLeftEye?: string;
  defaultMouth?: string;
  defaultRightEye?: string;
  defaultRightCheek?: string;
  defaultRightSide?: string;
  defaultBgColor?: string;
};

const EditComposer = forwardRef<EditComposerRef, EditComposerProps>(function EditComposer(
  { onEditCreated, defaultUsername = 'this_person', defaultAccessory = '', defaultLeftSide = '(', defaultLeftCheek = '', 
    defaultLeftEye = '^', defaultMouth = 'ᗜ', defaultRightEye = '^', defaultRightCheek = '', defaultRightSide = ')', defaultBgColor = '#ffffff'},
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State variables
  const [username, setUsername] = useState(defaultUsername);
  const [bgColor, setBgColor] = useState(defaultBgColor);
  const [accessory, setAccessory] = useState(defaultAccessory);
  const [leftSide, setLeftSide] = useState(defaultLeftSide);
  const [leftCheek, setLeftCheek] = useState(defaultLeftCheek);
  const [leftEye, setLeftEye] = useState(defaultLeftEye);
  const [mouth, setMouth] = useState(defaultMouth);
  const [rightEye, setRightEye] = useState(defaultRightEye);
  const [rightCheek, setRightCheek] = useState(defaultRightCheek);
  const [rightSide, setRightSide] = useState(defaultRightSide);

  // Update state when props change
  useEffect(() => {
    setUsername(defaultUsername);
    setBgColor(defaultBgColor);
    setAccessory(defaultAccessory);
    setLeftSide(defaultLeftSide);
    setLeftCheek(defaultLeftCheek);
    setLeftEye(defaultLeftEye);
    setMouth(defaultMouth);
    setRightEye(defaultRightEye);
    setRightCheek(defaultRightCheek);
    setRightSide(defaultRightSide);
  }, [defaultUsername, defaultBgColor, defaultAccessory, defaultLeftSide, defaultLeftCheek, defaultLeftEye, defaultMouth, defaultRightEye, defaultRightCheek, defaultRightSide]);

  const accessories = ['', '✧', '𝜗ৎ','⋆˚꩜｡','⋆˚࿔', 'ꉂ', 'ദി', '✧ദ്ദി', '❀༉', '♡', '⸜', '٩', 'و', '⸝', 'ᕙ','ᕗ'];
  const leftSides = ['(', '[', '𐔌', 'ʕ', '|', '૮'];
  const rightSides = [')', ']', '𐦯', 'ʔ', '|', 'ა'];
  const cheeks = [' ', '^','˵','՞', '｡', '*', '๑', '..','ᐢ', '⸝⸝'];
  const leftEyes = ['˃', '╥', 'ᵔ','•', '•̀', '-','◞', '꩜⁭', '°', '.', '≧', '◜','¬', 'ᴗ͈', 'ˆ'];
  const rightEyes = ['˂', '╥', 'ᵔ','•', '•́','-', '◟', '꩜⁭', '°','.', '≦', '◝', '¬', 'ᴗ͈', 'ˆ'];
  const mouths = ['', 'ᗜ', '▽', '﹏', 'ヮ', '‿', '⤙', '꒳', '˕', '˘', '𐃷',' ̫','⌓','‸', 'ᴗ'];

  function Dropdown({ label, options, value, onChange }: {
    label: string;
    options: string[];
    value: string;
    onChange: (val: string) => void;
  }) {
    return (
      <div className="mb-3">
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: 500,
          color: 'var(--gray-700)',
          fontSize: '0.875rem'
        }}>
          {label}
        </label>
        <select 
          className="form-select" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          style={{
            borderRadius: '12px',
            border: '1px solid var(--gray-300)',
            padding: '0.75rem 1rem'
          }}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt || '(none)'}</option>
          ))}
        </select>
      </div>
    );
  }

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }));

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const newKao = `${accessory}${leftSide}${leftCheek}${leftEye}${mouth}${rightEye}${rightCheek}${rightSide}`;
      const userData = {
        username: username.trim(),
        accessory,
        leftSide,
        leftCheek,
        leftEye,
        mouth,
        rightEye,
        rightCheek,
        rightSide,
        bgColor,
        kao: newKao,
      };
      
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, userData);
      
      onEditCreated?.(userData);
      setIsOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live preview of the kaomoji
  const liveKaomoji = `${accessory}${leftSide}${leftCheek}${leftEye}${mouth}${rightEye}${rightCheek}${rightSide}`;

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
          maxWidth: '600px',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderRadius: '16px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 className="mb-4" style={{ 
          fontSize: '1.5rem', 
          fontWeight: 600, 
          color: 'var(--gray-900)',
          marginBottom: '1.5rem'
        }}>
          Edit Profile
        </h5>
        {error && (
          <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: '12px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        
        <div className="mb-3">
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: 500,
            color: 'var(--gray-700)',
            fontSize: '0.875rem'
          }}>
            Username
          </label>
          <input 
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              borderRadius: '12px',
              border: '1px solid var(--gray-300)',
              padding: '0.75rem 1rem'
            }}
          />
        </div>
        
        <div className="mb-4 p-3 border rounded" style={{ 
          background: bgColor,
          borderRadius: '12px',
          border: '1px solid var(--gray-200) !important'
        }}>
          <label className="form-label fw-bold" style={{ 
            display: 'block',
            marginBottom: '0.75rem',
            color: 'var(--gray-900)',
            fontSize: '0.875rem'
          }}>
            Live Preview:
          </label>
          <div className="text-center" style={{ fontSize: '2.5rem', minHeight: '3rem' }}>
            {liveKaomoji}
          </div>
        </div>
        
        <Dropdown label="Accessory" options={accessories} value={accessory} onChange={setAccessory} />
        <Dropdown label="Left Side" options={leftSides} value={leftSide} onChange={setLeftSide} />
        <Dropdown label="Left Cheek" options={cheeks} value={leftCheek} onChange={setLeftCheek} />
        <Dropdown label="Left Eye" options={leftEyes} value={leftEye} onChange={setLeftEye} />
        <Dropdown label="Mouth" options={mouths} value={mouth} onChange={setMouth} />
        <Dropdown label="Right Eye" options={rightEyes} value={rightEye} onChange={setRightEye} />
        <Dropdown label="Right Cheek" options={cheeks} value={rightCheek} onChange={setRightCheek} />
        <Dropdown label="Right Side" options={rightSides} value={rightSide} onChange={setRightSide} />
        
        <div className="mb-3">
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: 500,
            color: 'var(--gray-700)',
            fontSize: '0.875rem'
          }}>
            Background Color
          </label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="form-control form-control-color"
            style={{
              borderRadius: '12px',
              border: '1px solid var(--gray-300)',
              width: '100%',
              height: '48px'
            }}
          />
        </div>
        
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            style={{ borderRadius: '12px' }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ borderRadius: '12px' }}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default EditComposer;