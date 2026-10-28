import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompression';

interface ReceiptUploadProps {
  pathPrefix: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

function randomId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function ReceiptUpload({ pathPrefix, value, onChange }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const path = `${pathPrefix}/${randomId()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, compressed, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('receipts').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload receipt photo.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
        Receipt Photo (optional)
      </label>

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20">
          <img src={value} alt="Receipt" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            aria-label="Remove receipt photo"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d4af37]/30 bg-[#102742] py-6 text-sm font-medium text-slate-300 transition hover:border-[#d4af37]/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera size={18} className="text-[#f5d78a]" />
          {uploading ? 'Uploading…' : 'Add receipt photo'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="mt-1.5 text-xs font-medium text-rose-300">{error}</p>}
    </div>
  );
}
