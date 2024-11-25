import { useState, useEffect } from 'react';

import SelectionBox from './SelectionBox';

interface SelectableContainerProperties<T> {
  items: T[];
  itemSelector: (item: T) => HTMLElement | null; // Function to locate DOM element for an item
  isSelecting: boolean; // Whether the user is currently selecting items
  setIsSelecting: (isSelecting: boolean) => void; // Callback to set the selection state
  selectedItems: T[]; // Currently selected items
  onSelectionChange: (selectedItems: T[]) => void; // Callback for selected items
  color?: string; // Color of the selection box
  children: React.ReactNode; // Rendered children, typically the list of items
}

// Utility function to get coordinates from MouseEvent or TouchEvent
const getCoordinates = (
  event: MouseEvent | TouchEvent
): { x: number; y: number } => {
  if ('touches' in event) {
    const touch = event.touches[0] || event.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  return { x: event.clientX, y: event.clientY };
};

// Utility function to avoid text input / textarea / select / button elements
const isInputElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  const tagName = element.tagName;
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    tagName === 'BUTTON' ||
    element.isContentEditable
  );
};

const SelectableContainer = <T,>({
  items,
  itemSelector,
  isSelecting,
  setIsSelecting,
  selectedItems,
  onSelectionChange,
  color,
  children,
}: SelectableContainerProperties<T>) => {
  const [selectionBox, setSelectionBox] = useState<{
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
  }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCommand = event.ctrlKey || event.metaKey;
      if (isInputElement(event.target as HTMLElement)) return;

      // Select All (Ctrl+A or Command+A)
      if (isCtrlOrCommand && event.key === 'a' && !event.shiftKey) {
        event.preventDefault();
        onSelectionChange(items);
      }

      // Invert Selection (Ctrl+Shift+A or Command+Shift+A)
      if (isCtrlOrCommand && event.key === 'a' && event.shiftKey) {
        event.preventDefault();

        // Invert selection logic
        const invertedSelection = items.filter(
          (item) => !selectedItems.includes(item)
        );
        onSelectionChange(invertedSelection);
      }
    };

    globalThis.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [items, selectedItems, onSelectionChange]);

  const handleStart = (event: React.MouseEvent | React.TouchEvent) => {
    if (isInputElement(event.target as HTMLElement)) return;

    event.preventDefault();
    const { x, y } = getCoordinates(event.nativeEvent);
    setIsSelecting(true);
    setSelectionBox({ start: { x, y }, end: null });
  };

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (isSelecting && selectionBox.start) {
      const { x, y } = getCoordinates(event.nativeEvent);
      setSelectionBox((previous) => ({
        ...previous,
        end: { x, y },
      }));
    }
  };

  const handleEnd = () => {
    setIsSelecting(false);

    if (selectionBox.start && selectionBox.end) {
      const selectionRect = {
        left: Math.min(selectionBox.start.x, selectionBox.end.x),
        top: Math.min(selectionBox.start.y, selectionBox.end.y),
        right: Math.max(selectionBox.start.x, selectionBox.end.x),
        bottom: Math.max(selectionBox.start.y, selectionBox.end.y),
      };

      const selected = items.filter((item) => {
        const element = itemSelector(item);
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return !(
          rect.right < selectionRect.left ||
          rect.left > selectionRect.right ||
          rect.bottom < selectionRect.top ||
          rect.top > selectionRect.bottom
        );
      });

      onSelectionChange(selected);
    }

    setSelectionBox({ start: null, end: null });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const isCtrlOrCommand = event.ctrlKey || event.metaKey;
    if (isInputElement(event.target as HTMLElement)) return;

    // Detect Ctrl+A or Command+A (Select All)
    if (isCtrlOrCommand && event.key === 'a' && !event.shiftKey) {
      event.preventDefault(); // Prevent default browser behavior
      onSelectionChange(items); // Select all items
    }

    // Detect Ctrl+Shift+A or Command+Shift+A (Invert Selection)
    if (isCtrlOrCommand && event.key === 'a' && event.shiftKey) {
      event.preventDefault(); // Prevent default browser behavior

      // Invert selection
      const invertedSelection = items.filter(
        (item) => !selectedItems.includes(item) // Include items not in the current selection
      );
      onSelectionChange(invertedSelection);
    }
  };

  return (
    <div
      role='application' // Add a semantic role
      aria-hidden={true}
      style={{
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden', // Prevent scrollbars during selection
        userSelect: 'none', // Disable text selection
        touchAction: 'none', // Disable browser touch behaviors like scrolling
      }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onKeyDown={(event) => handleKeyDown(event)}
    >
      {/* Selection Box */}
      <SelectionBox
        start={selectionBox.start}
        end={selectionBox.end}
        color={color}
      />

      {/* Rendered children */}
      {children}
    </div>
  );
};

export default SelectableContainer;
