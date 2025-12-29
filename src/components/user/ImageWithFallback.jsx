import React, { useState, useEffect } from "react";
import { getPlaceholderImage } from "../../utils/imageUtils";

const ImageWithFallback = ({
  src,
  alt,
  width = 150,
  height = 150,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackIndex, setFallbackIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const { localPlaceholder, fallbackOptions, validateImage } =
    getPlaceholderImage(width, height);

  useEffect(() => {
    const validateCurrentImage = async () => {
      setLoading(true);
      const isValid = await validateImage(currentSrc);
      if (!isValid && fallbackIndex < fallbackOptions.length) {
        setFallbackIndex((prev) => prev + 1);
        setCurrentSrc(
          fallbackIndex === -1
            ? localPlaceholder
            : fallbackOptions[fallbackIndex]
        );
      }
      setLoading(false);
    };
    validateCurrentImage();
  }, [currentSrc, fallbackIndex]);

  const handleError = () => {
    if (fallbackIndex < fallbackOptions.length) {
      setFallbackIndex((prev) => prev + 1);
      setCurrentSrc(
        fallbackIndex === -1 ? localPlaceholder : fallbackOptions[fallbackIndex]
      );
    }
  };

  if (loading) {
    return <div className="placeholder-glow" style={{ width, height }}></div>;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      style={{ maxWidth: "100%", height: "auto" }}
      {...props}
    />
  );
};

export default ImageWithFallback;
