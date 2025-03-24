import { useState, useEffect } from "react";

export const Slider = () => {
  const [strictness, setStrictness] = useState<number | null>(null);

  useEffect(() => {
    const fetchStrictness = async () => {
      try {
        const value = await filterStrictness.getValue();

        setStrictness(value);
      } catch (error) {
        console.error("Failed to fetch strictness value:", error);
        setStrictness(50);
      }
    };

    fetchStrictness();
  }, []);

  useEffect(() => {
    if (strictness !== null) {
      const timeoutId = setTimeout(async () => {
        await filterStrictness.setValue(strictness);
        chrome.runtime.sendMessage({
          type: "UPDATE_STRICTNESS",
          value: await filterStrictness.getValue()
        });
      }, 250);

      return () => clearTimeout(timeoutId);
    }
  }, [strictness]);

  const handleStrictnessChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStrictness(parseFloat(event.target.value));
  };

  return (
    <div className="flex flex-col items-center w-full p-4">
      {strictness !== null ? (
        <>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={strictness}
            onChange={handleStrictnessChange}
            className="w-full cursor-pointer"
          />
          <span className="mt-2 text-lg font-semibold">
            Value: {strictness}
          </span>
        </>
      ) : (
        <span className="text-gray-500">Loading...</span>
      )}
    </div>
  );
};
