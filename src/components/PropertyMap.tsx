/**
 * Lightweight property location map. Uses OpenStreetMap's static embed
 * (no API key required) so a pin + zoomed view render server-side with no
 * client JS or third-party map SDK.
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
  const delta = 0.02;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join("%2C");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <iframe
      title={`Map showing the location of ${label}`}
      src={src}
      style={{
        width: "100%",
        height: 260,
        border: "1px solid var(--hairline)",
        borderRadius: 6,
      }}
      loading="lazy"
    />
  );
}
