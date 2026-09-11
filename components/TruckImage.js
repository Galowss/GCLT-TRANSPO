import Image from 'next/image';

const SAFE_HOSTS = ['images.unsplash.com', 'firebasestorage.googleapis.com'];

const FILL_STYLE = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

function isSafeForImage(src) {
  if (!src) return false;
  const s = String(src);
  if (s.startsWith('data:')) return false;
  if (typeof URL !== 'undefined') {
    try {
      if (s.startsWith('/')) return true;
      const url = new URL(s);
      return SAFE_HOSTS.includes(url.hostname);
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * TruckImage — renders truck photos safely.
 * next/image only supports configured hosts and local /public paths; truck
 * images can also be base64 data: URLs or arbitrary external URLs, which
 * would make next/image throw at runtime. Those fall back to a plain <img>.
 */
export default function TruckImage({ src, alt, fill, sizes, priority, className, style, ...rest }) {
  const safe = isSafeForImage(src);
  if (!safe) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || 'Truck'}
        className={className}
        style={{ ...(fill ? FILL_STYLE : {}), ...(style || {}) }}
        {...rest}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt || 'Truck'}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      style={style}
      {...rest}
    />
  );
}