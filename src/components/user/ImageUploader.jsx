import React, { useState } from "react";
import { getPlaceholderImage } from "../../utils/imageUtils";

const ImageUploader = ({
  onImageSelect,
  initialImage,
  width = 150,
  height = 150,
}) => {
  const [preview, setPreview] = useState(initialImage);
  const { handleFileUpload, fallbackOptions } = getPlaceholderImage(
    width,
    height
  );

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const dataUrl = await handleFileUpload(file);
      setPreview(dataUrl);
      onImageSelect?.(file);
    } catch (error) {
      console.error("Upload error:", error);
      setPreview(fallbackOptions[0]);
    }
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
        <img
          src={preview || fallbackOptions[0]}
          alt="Upload preview"
          width={width}
          height={height}
          className="preview-image"
        />
        <div className="upload-overlay">Click to upload</div>
      </label>
    </div>
  );
};

export default ImageUploader;
