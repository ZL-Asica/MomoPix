import { useState } from 'react';

import Skeleton from './Skeleton';

interface LazyImageProperties {
  src: string;
  alt?: string;
  errorPlaceholder?: string;
  onClick?: () => void;
}

const LazyImage = ({
  src,
  alt = 'Image',
  errorPlaceholder = 'Load Failed',
  onClick,
}: LazyImageProperties) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const handleLoad = () => {
    setLoaded(true);
    setTimeout(() => setShowSkeleton(false), 300);
  };

  return (
    <div
      role='button'
      tabIndex={0}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
      onClick={onClick}
      onKeyDown={(event_) => {
        if (event_.key === 'Enter' || event_.key === ' ') {
          onClick?.();
        }
      }}
    >
      {/* Skeleton Placeholder */}
      {showSkeleton && (
        <Skeleton
          variant='rectangular'
          width='100%'
          height='100%'
        />
      )}

      {/* Lazy Load Image */}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={() => {
          setError(true);
          setShowSkeleton(false);
        }}
        style={{
          display: loaded && !error ? 'block' : 'none',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          cursor: 'pointer',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* Placeholder for Error */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#888',
            fontSize: '14px',
          }}
        >
          {errorPlaceholder}
        </div>
      )}
    </div>
  );
};

export default LazyImage;
