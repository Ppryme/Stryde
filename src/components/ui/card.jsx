export default function Card({
  children,
  className = "",
}) {
  return (
    <div
      className={`
        stryde-card
        ${className}
      `}
    >
      {children}
    </div>
  );
}