/** Mono technical spec lines under the body copy. */
export function SpecLines({ lines }: { lines: string[] }) {
  return (
    <ul className="spec-tech mt-3 space-y-1" aria-label="Specifications">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
