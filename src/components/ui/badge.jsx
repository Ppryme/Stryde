export default function Badge({
  children,
  variant = "info",
  className = "",
}) {
  const variants = {
    success:
      "bg-[var(--color--stryde-success-light)] text-[var(--color--stryde-success-dark)]",

    warning:
      "bg-[var(--color--stryde-fire-light)] text-[#633806]",

    danger:
      "bg-[var(--color--stryde-danger-light)] text-[#791F1F]",

    info:
      "bg-[var(--color--stryde-primary-light)] text-[var(--color--stryde-primary-dark)]",
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