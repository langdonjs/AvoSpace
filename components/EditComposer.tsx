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
      <div className="mb-2">
        <label>{label}</label>
        <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
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
      style={{ background: 'rgba(0,0,0,0.4)', zIndex: 1050 }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded shadow p-4"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 600px)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 className="mb-3">Edit Profile</h5>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        
        <div className="mb-3">
          <label>Username</label>
          <input 
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        
        {/* Live Kaomoji Preview */}
        <div className="mb-4 p-3 border rounded" style={{ background: bgColor }}>
          <label className="form-label fw-bold">Live Preview:</label>
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
          <label>Background Color</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="form-control form-control-color"
          />
        </div>
        
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default EditComposer;