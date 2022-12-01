import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, time: number) {
  const [current, setCurrent] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrent(value);
    }, time);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, current, setCurrent, time]);

  return current;
}
