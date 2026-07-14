export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-stryde-primary text-white hover:bg-stryde-primary-dark",

    success:
      "bg-stryde-success text-white hover:opacity-90",

    outline:
      "border border-bento-border bg-bento-card text-bento-text hover:border-stryde-primary",

    ghost:
      "bg-transparent text-bento-muted hover:bg-bento-card hover:text-bento-text",

    danger:
      "bg-stryde-danger text-white hover:opacity-90",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        min-h-[44px]
        px-4
        py-3
        rounded-[var(--radius-md)]
        font-semibold
        transition-all
        duration-200
        disabled:bg-bento-border
        disabled:text-bento-muted/50
        disabled:border-bento-border
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
