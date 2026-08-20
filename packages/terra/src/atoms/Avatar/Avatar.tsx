import React, { useState } from 'react';
import styles from './Avatar.module.css';

// ============================================================================
// TYPES
// ============================================================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Image source. Falls back to `initials` if missing or fails to load. */
  src?: string;

  /** Accessible label / alt text for the image. */
  alt?: string;

  /**
   * Fallback content shown when there's no `src` or the image fails to
   * load — typically 1-2 letters. Truncated to 2 characters visually.
   */
  initials?: string;

  /**
   * @default 'md'
   */
  size?: AvatarSize;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Avatar - circular user/entity representation. Renders an image when
 * `src` loads successfully, otherwise falls back to `initials` on a
 * neutral background — including when the image fails to load
 * (broken URL, offline, 404), handled via `onError`.
 *
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="Jane Doe" initials="JD" />
 * <Avatar initials="JD" size="lg" />
 * <Avatar size="sm" /> // generic fallback icon
 * ```
 */
export function Avatar({
  src,
  alt = '',
  initials,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = src && !imageFailed;

  return (
    <span
      className={[styles.avatar, styles[`size-${size}`], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className={styles.image}
          onError={() => setImageFailed(true)}
        />
      ) : initials ? (
        <span className={styles.initials} aria-hidden={!!alt}>
          {initials.slice(0, 2)}
        </span>
      ) : (
        <svg
          className={styles.fallbackIcon}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9z" />
        </svg>
      )}
    </span>
  );
}

Avatar.displayName = 'Avatar';

export type { AvatarProps, AvatarSize };
