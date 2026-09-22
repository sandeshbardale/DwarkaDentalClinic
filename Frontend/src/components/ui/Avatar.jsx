/**
 * Avatar component — initials fallback with optional image.
 */
export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Generate a deterministic color from the name
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-teal-100 text-teal-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-emerald-100 text-emerald-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
  ];
  const colorIndex = (name.charCodeAt(0) || 0) % colors.length;
  const colorClass = colors[colorIndex];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold flex-shrink-0 select-none ${colorClass} ${className}`}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
}
