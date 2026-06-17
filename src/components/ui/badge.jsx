export default function Badge({
  children,
  variant = "info",
  className = "",
}) {
  const variants = {
    success:
      "bg-stryde-success-light text-stryde-success-dark",

    warning:
      "bg-stryde-fire-light text-stryde-fire-dark",

    danger:
      "bg-stryde-danger-light text-stryde-danger-dark",

    info:
      "bg-stryde-primary-light text-stryde-primary-dark",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        px-[10px]
        py-[3px]
        rounded-full
        text-[11px]
        font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
