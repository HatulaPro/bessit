import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

export const ImageHidesOnError: React.FC<ImageProps & { alt: string }> = (
  props
) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
  }, [props.src]);

  return !hidden ? (
    <Image {...props} alt={props.alt} onError={() => setHidden(true)} />
  ) : null;
};
