'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export type PostComposerRef = {
  open: () => void;
  close: () => void;
};

type PostComposerProps = {
  onPostCreated?: (doc: {
    text: string;
    date: string;
    likes: number;
    uid: string;
  }) => void;
};

const PostComposer = forwardRef<PostComposerRef, PostComposerProps>(function PostComposer(
  { onPostCreated},
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }));

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const now = new Date();
      const newDoc = {
        text: text.trim(),
        date: `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`,
        likes: 0,
        uid: auth.currentUser?.uid || '',
      };
      await addDoc(collection(db, 'posts'), newDoc);
      onPostCreated?.(newDoc);
      setText('');
      setIsOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          width: 'min(90vw, 600px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 className="mb-3">Create Post</h5>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <textarea
          className="form-control mb-3"
          rows={5}
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
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
            disabled={isSubmitting || !text.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default PostComposer;


