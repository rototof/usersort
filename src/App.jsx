import React, { useState, useRef, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";

async function pairwiseMergeSort(items, compare, progressCallback) {
  if (items.length <= 1) return items;

  const mid = Math.floor(items.length / 2);
  const left = await pairwiseMergeSort(items.slice(0, mid), compare, progressCallback);
  const right = await pairwiseMergeSort(items.slice(mid), compare, progressCallback);

  return await merge(left, right, compare, progressCallback);
}

async function merge(left, right, compare, progressCallback) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    const better = await compare(left[i], right[j]);
    if (better === left[i]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
    progressCallback();
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}

function isImage(item) {
  return typeof item !== "string" && item?.preview;
}

function estimateComparisons(n) {
  if (n < 2) return 0;
  return Math.ceil(n * Math.log2(n));
}

function estimateBestOnlyComparisons(n) {
  if (n < 2) return 0;
  return n - 1;
}

export default function UserSort() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [currentPair, setCurrentPair] = useState(null);
  const [sortedItems, setSortedItems] = useState(null);
  const [queue, setQueue] = useState([]);
  const fileInputRef = useRef(null);
  const [sortingStarted, setSortingStarted] = useState(false);
  const [comparisonsTotal, setComparisonsTotal] = useState(0);
  const [comparisonsDone, setComparisonsDone] = useState(0);
  const [popupImageIndex, setPopupImageIndex] = useState(null);

  const addItem = () => {
    if (input.trim()) {
      setItems([...items, input.trim()]);
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  const startSorting = async (findBestOnly = false) => {
    setSortingStarted(true);
    setComparisonsDone(0);
    const estimated = findBestOnly ? estimateBestOnlyComparisons(items.length) : estimateComparisons(items.length);
    setComparisonsTotal(estimated);

    const compare = async (a, b) => {
      return new Promise((resolve) => {
        setCurrentPair([a, b]);
        setQueue((prev) => [...prev, resolve]);
      });
    };

    const progressCallback = () => {
      setComparisonsDone((prev) => prev + 1);
    };

    let sorted;
    if (findBestOnly) {
      sorted = await findBestOnlyItem(items, compare, progressCallback);
    } else {
      sorted = await pairwiseMergeSort(items, compare, progressCallback);
    }
    setSortedItems(sorted);
    setCurrentPair(null);
  };

  // Hilfsfunktion: findet nur das beste Item (wie Turnierbaum)
  async function findBestOnlyItem(items, compare, progressCallback) {
    let contenders = [...items];
    while (contenders.length > 1) {
      const nextRound = [];
      for (let i = 0; i < contenders.length; i += 2) {
        if (i + 1 >= contenders.length) {
          nextRound.push(contenders[i]);
        } else {
          const better = await compare(contenders[i], contenders[i + 1]);
          nextRound.push(better);
          progressCallback();
        }
      }
      contenders = nextRound;
    }
    return [contenders[0]];
  }

  const handleChoice = (choice) => {
    const resolve = queue.shift();
    resolve(choice);
    setQueue(queue);
    setCurrentPair(null);
  };

  const reset = () => {
    setItems([]);
    setSortedItems(null);
    setCurrentPair(null);
    setQueue([]);
    setSortingStarted(false);
    setComparisonsTotal(0);
    setComparisonsDone(0);
    setPopupImageIndex(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    const newItems = files.map((file) => ({ file, name: file.name, preview: URL.createObjectURL(file) }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Popup-Funktionen
  const openPopupAtIndex = (index) => {
    setPopupImageIndex(index);
  };

  const closePopup = () => {
    setPopupImageIndex(null);
  };

  const showNextImage = () => {
    setPopupImageIndex((prev) => {
      if (prev === null) return null;
      return (prev + 1) % sortedItems.length;
    });
  };

  const showPrevImage = () => {
    setPopupImageIndex((prev) => {
      if (prev === null) return null;
      return (prev - 1 + sortedItems.length) % sortedItems.length;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (popupImageIndex === null) return;
      if (e.key === "ArrowRight") {
        showNextImage();
      } else if (e.key === "ArrowLeft") {
        showPrevImage();
      } else if (e.key === "Escape") {
        closePopup();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popupImageIndex, sortedItems]);

  // Zurück zum Start, mit Warnung falls in der Sortierung
  const handleTitleClick = () => {
    if (sortingStarted && !sortedItems) {
      if (!window.confirm("Du bist gerade dabei die Sortierung zu beantworten. Sortierung abbrechen?")) {
        return;
      }
    }
    reset();
  };

  return (
    <div className="p-4 max-w-full mx-auto h-screen overflow-hidden" onDrop={handleDrop} onDragOver={handleDragOver}>
      <h1
        className="text-3xl font-bold mb-4 cursor-pointer select-none"
        onClick={handleTitleClick}
        title="Klicke hier, um neu zu starten"
      >
        UserSort
      </h1>

      <div className="h-[calc(100%-4rem)] overflow-y-auto pr-2">
        {!sortedItems && !currentPair && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                className="border p-2 rounded w-full"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Neues Item..."
              />
              <Button onClick={addItem}>Hinzufügen</Button>
            </div>

            <div className="border-2 border-dashed border-gray-400 p-4 text-center rounded mb-4 text-gray-600">
              Ziehe hier Bilder hinein, um sie hinzuzufügen
            </div>

            {!sortingStarted && items.length > 0 && (
              <ul className="mb-4 max-h-60 overflow-auto">
                {items.map((item, idx) => (
                  <li key={idx} className="border p-2 rounded mb-1 flex items-center gap-2">
                    {isImage(item) ? (
                      <>
                        <img
                          src={item.preview}
                          alt={item.name || "preview"}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </>
                    ) : (
                      item
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-4">
              <Button
                onClick={() => startSorting(false)}
                disabled={items.length < 2}
                title="Sortiere alle Items"
              >
                Sortieren starten ({estimateComparisons(items.length)})
              </Button>
              <Button
                onClick={() => startSorting(true)}
                disabled={items.length < 2}
                title="Finde nur das beste Item"
              >
                Bestes Item finden ({estimateBestOnlyComparisons(items.length)})
              </Button>
            </div>
          </div>
        )}

        {currentPair && (
          <div className="flex flex-col h-full w-full">
            <div className="w-full bg-gray-200 h-2 rounded mb-2">
              <div
                className="bg-blue-500 h-2 rounded"
                style={{ width: `${(comparisonsDone / comparisonsTotal) * 100}%` }}
              ></div>
            </div>

            <div className="flex h-full w-full gap-4">
              {currentPair.map((item, idx) => (
                <Card key={idx} className="flex-1 h-full cursor-pointer" onClick={() => handleChoice(item)}>
                  <CardContent className="h-full flex flex-col items-center justify-center p-2">
                    {isImage(item) ? (
                      <>
                        <img
                          src={item.preview}
                          alt={item.name || "choice"}
                          className="max-h-[calc(100vh-10rem)] w-full object-contain mb-2 rounded"
                        />
                        <div className="text-sm text-gray-600 text-center break-all">{item.name}</div>
                      </>
                    ) : (
                      <div className="text-3xl font-semibold text-center">{item}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {sortedItems && !currentPair && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-2">Sortiertes Ergebnis:</h2>
            <ul className="mb-4 max-h-96 overflow-auto">
              {sortedItems.map((item, idx) => (
                <li
                  key={idx}
                  className="border p-2 rounded mb-1 flex items-center gap-2"
                >
                  <span className="font-semibold mr-2">{idx + 1}.</span>
                  {isImage(item) ? (
                    <>
                      <img
                        src={item.preview}
                        alt={item.name || "result"}
                        className="w-16 h-16 object-cover rounded cursor-pointer"
                        onClick={() => openPopupAtIndex(idx)}
                      />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </>
                  ) : (
                    <span>{item}</span>
                  )}
                </li>
              ))}
            </ul>
            <Button onClick={reset}>Neu starten</Button>
          </div>
        )}
      </div>

      {/* Popup für Bildanzeige mit Navigation */}
      {popupImageIndex !== null && (
        <div
          onClick={closePopup}
          className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 cursor-pointer"
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={sortedItems[popupImageIndex].preview}
              alt={sortedItems[popupImageIndex].name || "Großes Bild"}
              className="rounded shadow-lg max-h-[90vh] max-w-[90vw]"
            />
            {/* Navigation Buttons */}
            <button
              onClick={showPrevImage}
              className="absolute left-[-50px] top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
              aria-label="Vorheriges Bild"
            >
              ‹
            </button>
            <button
              onClick={showNextImage}
              className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
              aria-label="Nächstes Bild"
            >
              ›
            </button>
            {/* Schließen-Button */}
            <button
              onClick={closePopup}
              className="absolute top-[-40px] right-0 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
              aria-label="Popup schließen"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
