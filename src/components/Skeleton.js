/** Placeholder shapes shown while a screen loads, so the layout doesn't jump. */
export function Bone({ w = '100%', h = 14, r = 6, className = '' }) {
  return <span className={`bone ${className}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-row">
          <Bone w={44} h={48} r={12} />
          <div className="skeleton-lines">
            <Bone w={`${55 + ((i * 17) % 30)}%`} h={15} />
            <Bone w="92%" h={12} />
            <Bone w="40%" h={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-cards" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card">
          <Bone h={72} r={12} />
          <Bone w="60%" h={15} />
          <Bone w="35%" h={11} />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="skeleton-page" role="status" aria-label="Loading">
      <Bone w="45%" h={13} />
      <Bone w="70%" h={34} r={8} />
      {[96, 88, 93, 72, 85, 60].map((w, i) => (
        <Bone key={i} w={`${w}%`} h={15} />
      ))}
    </div>
  );
}
