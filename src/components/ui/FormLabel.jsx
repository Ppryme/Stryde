export default function FormLabel({ children, className = "", ...props }) {
  return (
    <label
      className={`
        block
        text-xs
        font-semibold
        mb-2
        uppercase
        tracking-wider
        text-bento-muted
        ${className}
      `}
      {...props}
    >
      {children}
    </label>
  );
}
