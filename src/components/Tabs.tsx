import { useEffect, useRef, useState } from "react";
import { cx } from "../utils/general";

type TabsProps<T extends Record<string, JSX.Element>> = {
  data: T;
  defaultValue: keyof T;
};

export function Tabs<T extends Record<string, JSX.Element>>({
  data,
  defaultValue,
}: TabsProps<T>) {
  const [currentTab, setCurrentTab] = useState<keyof typeof data>(defaultValue);
  const tabParentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tabParentRef.current) {
      const keys = Object.keys(data).filter((x) => data.hasOwnProperty(x));
      const currentIndex = keys.indexOf(currentTab as string);
      tabParentRef.current.scrollTo({
        left: currentIndex * tabParentRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  }, [currentTab, tabParentRef, data]);

  return (
    <div className="w-full">
      <div className="mt-2 flex justify-center overflow-hidden rounded-t-xl bg-zinc-700 bg-opacity-50 text-lg text-white">
        {Object.keys(data).map((key) => {
          if (!data.hasOwnProperty(key)) return null;
          return (
            <button
              className={cx(
                "flex-1 p-1 hover:bg-zinc-700",
                currentTab === key && "underline decoration-cyan-500"
              )}
              key={key}
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab(key);
              }}
            >
              {key}
            </button>
          );
        })}
      </div>
      <div
        className="flex overflow-hidden"
        ref={tabParentRef}
        // TODO: not doing this might cause issues on mobile
        // onScroll={(e) => {
        //   const keys = Object.keys(data).filter((x) => data.hasOwnProperty(x));
        //   const nextKeyIndex = Math.floor(
        //     e.currentTarget.scrollLeft / e.currentTarget.clientWidth
        //   );
        //   if (keys[nextKeyIndex] !== currentTab) {
        //     setCurrentTab(keys[nextKeyIndex] as keyof typeof data);
        //   }
        // }}
      >
        {Object.keys(data).map((key) => {
          if (!data.hasOwnProperty(key)) return null;
          return (
            <div
              className="relative w-full flex-1 flex-shrink-0 basis-full"
              key={key}
            >
              {data[key]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
