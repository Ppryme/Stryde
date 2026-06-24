export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`
        w-full
        px-4
        py-3
        rounded-xl
        bg-bento-card
        border
        border-bento-border
        text-sm
        text-bento-text
        placeholder:text-bento-muted
        outline-none
        transition-all
        duration-200
        focus:outline-none
        focus:border-stryde-primary
        
        ${className}
      `}
      {...props}
    />
  );
}
