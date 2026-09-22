/** X-ray hover readout: part name plus one-line technical detail. */
export function XrayReadout({ readout }: { readout: string }) {
  return (
    <p
      role="status"
      data-testid="xray-readout"
      className="spec-tech rounded-full border border-(--color-border-hairline) bg-(--color-scrim) px-3 py-1 backdrop-blur-md"
    >
      {readout}
    </p>
  )
}
