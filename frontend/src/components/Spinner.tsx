export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-5 w-5 border-2' : size === 'lg' ? 'h-12 w-12 border-4' : 'h-8 w-8 border-4';
  return (
    <div className={`animate-spin rounded-full ${sz} border-indigo-500 border-t-transparent`} />
  );
}
