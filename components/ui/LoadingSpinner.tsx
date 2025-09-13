import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className={cn(
        "border-4 border-orange-500 border-t-transparent rounded-full animate-spin",
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
}