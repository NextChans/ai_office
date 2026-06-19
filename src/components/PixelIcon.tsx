// Tiny hand-drawn pixel-art glyphs (single-colour silhouettes, currentColor).
// Used for chrome (nav/tabs) to replace glossy emoji and keep the pixel theme.

type Name = "office" | "hiring" | "employees" | "board" | "logo";

export function PixelIcon({
  name,
  size = 16,
  className = "",
}: {
  name: Name;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      {GLYPHS[name]}
    </svg>
  );
}

const GLYPHS: Record<Name, React.ReactNode> = {
  // monitor / office
  office: (
    <>
      <rect x="1" y="2" width="14" height="10" />
      <rect x="2.5" y="3.5" width="11" height="7" opacity="0.35" />
      <rect x="6" y="12" width="4" height="2" />
      <rect x="4" y="14" width="8" height="2" />
    </>
  ),
  // person + plus (hiring)
  hiring: (
    <>
      <rect x="3" y="2" width="5" height="5" />
      <rect x="1" y="8" width="9" height="6" />
      <rect x="12" y="9" width="4" height="2" />
      <rect x="13" y="7" width="2" height="6" />
    </>
  ),
  // two people (employees)
  employees: (
    <>
      <rect x="8" y="3" width="4" height="4" opacity="0.55" />
      <rect x="7" y="8" width="6" height="5" opacity="0.55" />
      <rect x="3" y="4" width="4" height="4" />
      <rect x="2" y="9" width="6" height="5" />
    </>
  ),
  // classical building / board
  board: (
    <>
      <polygon points="0,6 8,1 16,6" />
      <rect x="2" y="7" width="2" height="6" />
      <rect x="7" y="7" width="2" height="6" />
      <rect x="12" y="7" width="2" height="6" />
      <rect x="0" y="13" width="16" height="2" />
    </>
  ),
  // tower (logo)
  logo: (
    <>
      <rect x="2" y="2" width="12" height="13" />
      <rect x="4" y="4" width="3" height="3" opacity="0.4" />
      <rect x="9" y="4" width="3" height="3" opacity="0.4" />
      <rect x="4" y="9" width="3" height="3" opacity="0.4" />
      <rect x="9" y="9" width="3" height="3" opacity="0.4" />
    </>
  ),
};
