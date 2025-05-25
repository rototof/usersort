import { useState } from 'react';

export default function ImageUploader({ onImageSelected }) {
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageSelected(file); // Pass the selected file to the parent component
  };

  return (
    <div className="p-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        className="mb-2"
      />
      {preview && (
        <img src={preview} alt="Preview" className="max-w-full h-auto rounded shadow" />
      )}
    </div>
  );
}
