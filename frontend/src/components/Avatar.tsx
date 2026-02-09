interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export const Avatar = ({ src, name, size = 'md', className = '' }: AvatarProps) => {
  if (src) {
    return (
      <img
        src={`${API_URL}${src}`}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-cyan-500/30 flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};
