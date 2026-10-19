import { useState } from 'react';
import placeholder from '../assets/placeholder.svg';

// A subject's image with a failsafe: if there is no image URL, or the image
// fails to load (deleted file, broken link, offline), show the placeholder
// instead of the browser's broken-image icon.
function SubjectImage({ src, alt, className }) {
  // The URL that failed, rather than a true/false flag, so that moving to
  // another subject (a new src) automatically tries the new image.
  const [failedSrc, setFailedSrc] = useState(null);

  const usePlaceholder = !src || failedSrc === src;

  return (
    <img
      src={usePlaceholder ? placeholder : src}
      alt={usePlaceholder ? `${alt} (image unavailable)` : alt}
      className={className}
      // Load the image only when it is about to scroll into view.
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}

export default SubjectImage;
