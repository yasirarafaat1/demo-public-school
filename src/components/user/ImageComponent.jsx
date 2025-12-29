import React, { useState, useEffect } from "react";
import { getPlaceholderImage } from "../../utils/imageUtils";

const ImageComponent = ({
  src,
  alt,
  width = 150,
  height = 150,
  className,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const { fallbackOptions } = getPlaceholderImage(width, height);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    setImgSrc(src);
    setFallbackIndex(0);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    setIsLoading(false);
    if (fallbackIndex < fallbackOptions.length) {
      setImgSrc(fallbackOptions[fallbackIndex]);
      setFallbackIndex((prev) => prev + 1);
    }
  };

  const handleLoad = () => setIsLoading(false);

  return (
    <div className={`image-container ${isLoading ? "loading" : ""}`}>
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        onError={handleError}
        onLoad={handleLoad}
        className={className}
        {...props}
      />
      {isLoading && <div className="loading-spinner" />}
    </div>
  );
};

export default ImageComponent;
