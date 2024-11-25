import { useState } from 'react';

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
      {!loaded && !error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#e0e0e0',
            animation: 'wave 1.6s infinite',
          }}
        />
      )}

      {/* Lazy Load Image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        style={{
          display: loaded && !error ? 'block' : 'none',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          cursor: 'pointer',
        }}
      />

      {/* Placeholder for Error */}
      {error && (
        <div
          style={{
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

      {/* CSS for Skeleton Animation */}
      <style>
        {`
          @keyframes wave {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }

          div[style*="animation: wave"] {
            background: linear-gradient(
              90deg,
              #e0e0e0 25%,
              #f0f0f0 50%,
              #e0e0e0 75%
            );
            background-size: 200px 100%;
          }
        `}
      </style>
    </div>
  );
};

export default LazyImage;
