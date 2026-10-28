/** Mono technical spec lines under the body copy. */
export function SpecLines({ lines }: { lines: string[] }) {
  return (
    <ul className="spec-tech mt-4 flex flex-wrap gap-x-5 gap-y-1" aria-label="Specifications">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
