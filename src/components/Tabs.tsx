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
      <div className="justify-left mt-2 flex overflow-hidden border-b-2 border-zinc-700 text-lg text-white">
        {Object.keys(data).map((key) => {
          if (!data.hasOwnProperty(key)) return null;
          return (
            <button
              className={cx(
                "border-2 border-b-0 px-2 py-1 transition-colors first:rounded-tl-md last:rounded-tr-md hover:bg-zinc-800",
                currentTab === key ? "border-zinc-700" : "border-transparent"
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
