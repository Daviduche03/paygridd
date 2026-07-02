import { forwardRef, useState, useCallback } from "react";

type ImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  loading?: "lazy" | "eager";
  fill?: boolean;
  [key: string]: any;
};

const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ src, alt, width, height, className, style, priority, loading, fill, ...props }, ref) => {
    const [error, setError] = useState(false);

    const handleError = useCallback(() => setError(true), []);

    if (error) {
      return null;
    }

    const imgStyle = fill
      ? { objectFit: "cover", width: "100%", height: "100%", ...style }
      : style;

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        style={imgStyle}
        loading={priority ? "eager" : loading || "lazy"}
        onError={handleError}
        {...props}
      />
    );
  }
);

Image.displayName = "Image";

export default Image;
export { Image };
