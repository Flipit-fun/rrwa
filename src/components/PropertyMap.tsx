/**
 * Embeds a Google Maps view centered on the property's coordinates. Uses the
 * key-less "output=embed" query form (no Maps API key required) rather than
 * the full Maps Embed API, since we just need a simple location pin.
 */
export default function PropertyMap({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label: string;
}) {
  const src = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <iframe
      title={`Map showing the location of ${label}`}
      src={src}
      style={{
        width: "100%",
        height: 280,
        border: "1px solid var(--hairline)",
        borderRadius: 6,
      }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
