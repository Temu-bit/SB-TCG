// Cloudinary CDN Helper
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sb_tcg_cards';
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

// Karten-Bild URL generieren (mit optionalen Transformationen)
export const getCardImageUrl = (publicId, options = {}) => {
  const { width = 400, height = 560, quality = 'auto', format = 'auto' } = options;
  return `${BASE_URL}/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
};

// Thumbnail URL (für Galerie-Grid)
export const getCardThumbnail = (publicId) =>
  getCardImageUrl(publicId, { width: 200, height: 280, quality: 80 });

// Fullsize URL (für Karten-Detail-Ansicht)
export const getCardFullsize = (publicId) =>
  getCardImageUrl(publicId, { width: 600, height: 840, quality: 90 });

// Placeholder falls kein Bild vorhanden
export const PLACEHOLDER_CARD = `${BASE_URL}/w_400,h_560,c_fill/sample`;

// Bild zu Cloudinary hochladen (Unsigned Upload Preset erforderlich)
export const uploadCardImage = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'sb-tcg/cards'); // Organisiert in einem Ordner

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    // Fortschritts-Callback
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          publicId: response.public_id,
          url: response.secure_url,
          width: response.width,
          height: response.height,
        });
      } else {
        reject(new Error(`Upload fehlgeschlagen: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Netzwerkfehler beim Upload'));
    xhr.send(formData);
  });
};

export { CLOUD_NAME, BASE_URL, UPLOAD_PRESET };
