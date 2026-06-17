export default function FormError({ message, className = "" }) {
  if (!message) return null;

  return <p className={`text-xs text-red-400 mt-1 ${className}`}>{message}</p>;
}
