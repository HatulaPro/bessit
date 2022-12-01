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
  const currentTabRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (currentTabRef.current) {
      currentTabRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentTab, currentTabRef]);
  return (
    <div className="w-full">
      <div className="flex justify-center overflow-hidden rounded-t-xl bg-zinc-700 text-xl">
        {Object.keys(data).map((key) => {
          if (!data.hasOwnProperty(key)) return null;
          return (
            <button
              className={cx(
                "flex-1 p-2 hover:bg-zinc-600",
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
      <div className="flex overflow-hidden">
        {Object.keys(data).map((key) => {
          if (!data.hasOwnProperty(key)) return null;
          return (
            <div
              ref={key === currentTab ? currentTabRef : undefined}
              className={cx(
                "w-full flex-1 flex-shrink-0 basis-full transition-all delay-150",
                key !== currentTab && "invisible"
              )}
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
