import { useState, useRef } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadCardImage } from '../cloudinary/config';
import { useAuth } from '../context/useAuth';
import SBCard from '../components/Card/SBCard';
import './CardUpload.css';

const RARITIES = [
  { value: 'common',    label: '⚪ Common',    defaultWeight: 60 },
  { value: 'uncommon',  label: '🟢 Uncommon',  defaultWeight: 25 },
  { value: 'rare',      label: '🔵 Rare',      defaultWeight: 10 },
  { value: 'epic',      label: '🟣 Epic',      defaultWeight: 4  },
  { value: 'legendary', label: '⭐ Legendary', defaultWeight: 1  },
];

const DEFAULT_FORM = {
  name: '',
  rarity: 'common',
  description: '',
  weight: 60,
};

const CardUpload = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      // Seltenheit wechseln → Standardgewicht anpassen
      if (name === 'rarity') {
        const found = RARITIES.find((r) => r.value === value);
        updated.weight = found?.defaultWeight ?? 50;
      }
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) { setError('Bitte ein Bild auswählen!'); return; }
    if (!form.name.trim()) { setError('Bitte einen Namen eingeben!'); return; }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Bild zu Cloudinary hochladen
      const cloudResult = await uploadCardImage(imageFile, setUploadProgress);

      // 2. Karten-Dokument in Firestore speichern
      await addDoc(collection(db, 'cards'), {
        name: form.name.trim(),
        rarity: form.rarity,
        description: form.description.trim(),
        weight: parseInt(form.weight, 10),
        imagePublicId: cloudResult.publicId,
        imageUrl: cloudResult.url,
        uploadedBy: user.uid,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setForm(DEFAULT_FORM);
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
      fileRef.current && (fileRef.current.value = '');
    } catch (err) {
      console.error(err);
      setError(`Fehler: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Vorschau-Karte für Live-Preview
  const previewCard = {
    name: form.name || 'Kartenname',
    rarity: form.rarity,
    description: form.description,
    imagePublicId: null,
    emoji: RARITIES.find((r) => r.value === form.rarity)?.label.split(' ')[0],
  };

  return (
    <div className="page upload-page">
      <h1 className="page-title text-gradient">🛠️ Karten-Workshop</h1>
      <p className="page-subtitle">Erstelle neue Karten für das Santa-Blanca TCG!</p>

      <div className="upload-layout">
        {/* ─── Formular ────────────────────────────────────────── */}
        <form className="upload-form glass-elevated" onSubmit={handleSubmit}>

          {/* Bild-Upload Zone */}
          <div
            className={`upload-dropzone ${imagePreview ? 'has-image' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Vorschau" className="upload-dropzone__preview" />
            ) : (
              <div className="upload-dropzone__placeholder">
                <span className="upload-dropzone__icon">🖼️</span>
                <span>Bild hierher ziehen oder klicken</span>
                <span className="upload-dropzone__hint">PNG, JPG, WEBP</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Fortschrittsbalken während Upload */}
          {uploading && (
            <div className="upload-progress-bar">
              <div className="upload-progress-bar__fill" style={{ width: `${uploadProgress}%` }} />
              <span>{uploadProgress}%</span>
            </div>
          )}

          {/* Kartenname */}
          <div className="upload-field">
            <label>Kartenname *</label>
            <input className="input" name="name" type="text" placeholder="z.B. Ignis, der Feuerbringer" value={form.name} onChange={handleChange} required />
          </div>

          {/* Seltenheit */}
          <div className="upload-field">
            <label>Seltenheit *</label>
            <div className="rarity-selector">
              {RARITIES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`rarity-btn rarity-btn--${r.value} ${form.rarity === r.value ? 'active' : ''}`}
                  onClick={() => handleChange({ target: { name: 'rarity', value: r.value } })}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pack-Häufigkeit (Weight) */}
          <div className="upload-field">
            <label>
              Pack-Häufigkeit: <strong style={{ color: 'var(--color-accent)' }}>{form.weight}%</strong>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 400, marginLeft: 8 }}>
                (wie oft diese Karte relativ zu anderen der gleichen Seltenheit erscheint)
              </span>
            </label>
            <input
              type="range"
              className="upload-slider"
              name="weight"
              min="1"
              max="100"
              value={form.weight}
              onChange={handleChange}
            />
            <div className="upload-slider-labels">
              <span>Sehr selten</span>
              <span>Normal</span>
              <span>Sehr häufig</span>
            </div>
          </div>

          {/* Beschreibung */}
          <div className="upload-field">
            <label>Karten-Beschreibung</label>
            <textarea
              className="input"
              name="description"
              rows={3}
              placeholder="Was macht diese Karte besonders?"
              value={form.description}
              onChange={handleChange}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <div className="upload-error">{error}</div>}
          {success && (
            <div className="upload-success">
              ✅ Karte erfolgreich hochgeladen und ab sofort in den Booster-Packs!
            </div>
          )}

          <button className="btn btn-gold btn-lg" type="submit" disabled={uploading}>
            {uploading ? `⏳ Hochladen... ${uploadProgress}%` : '🚀 Karte hochladen & veröffentlichen'}
          </button>
        </form>

        {/* ─── Live-Vorschau ────────────────────────────────────── */}
        <div className="upload-preview">
          <h3 className="upload-preview__title">Live-Vorschau</h3>
          <SBCard card={{ ...previewCard, imagePublicId: null }} size="large" revealed={false} />
          <div className={`upload-preview__rarity-info badge badge-${form.rarity}`}>
            Basis-Wahrscheinlichkeit: {RARITIES.find(r => r.value === form.rarity)?.defaultWeight}%
            {form.weight !== RARITIES.find(r => r.value === form.rarity)?.defaultWeight && (
              <span> → Angepasst: {form.weight}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardUpload;
