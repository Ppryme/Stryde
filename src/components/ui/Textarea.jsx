export default function Textarea({ className = "", ...props }) {
  return (
    <textarea
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
        resize-none
        transition-colors
        focus:border-stryde-primary
        focus:border-none
        focus:outline-none  
        ${className}
      `}
      {...props}
    />
  );
}
