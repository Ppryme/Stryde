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
      "bg-[var(--stryde-primary)] text-white hover:bg-[var(--stryde-primary-dark)]",

    success:
      "bg-[var(--stryde-success)] text-white hover:opacity-90",

    outline:
      "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",

    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100",

    danger:
      "bg-[var(--stryde-danger)] text-white hover:opacity-90",
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