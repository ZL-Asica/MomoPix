interface SelectionBoxProperties {
  start: { x: number; y: number } | null;
  end: { x: number; y: number } | null;
  color?: string; // The base color for the selection box
}

const rgbaFromHex = (hex: string, alpha: number): string => {
  // Remove # if present
  const sanitizedHex = hex.replace('#', '');

  // Convert to RGB values
  const bigint = Number.parseInt(sanitizedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const SelectionBox: React.FC<SelectionBoxProperties> = ({
  start,
  end,
  color = '#0078d7', // Default base color
}) => {
  if (!start || !end) return null;

  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  const backgroundColor = rgbaFromHex(color, 0.3); // Apply transparency
  const borderColor = color; // Use the base color for the border

  return (
    <div
      style={{
        position: 'fixed', // Use fixed to ensure the box follows the viewport
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: backgroundColor,
        border: `1px solid ${borderColor}`,
        pointerEvents: 'none', // Prevent interaction
        zIndex: 1, // Ensure it appears above other content
      }}
    />
  );
};

export default SelectionBox;
