export const Spinner = ({ size = 'md', color = '#1a73e8' }) => {
  const sz = { sm: 'w-6 h-6 border-2', md: 'w-10 h-10 border-4', lg: 'w-16 h-16 border-4' }[size];
  return (
    <div className="flex items-center justify-center w-full py-16">
      <div
        className={`${sz} rounded-full animate-spin border-t-transparent`}
        style={{ borderColor: `${color}40`, borderTopColor: 'transparent', borderLeftColor: color }}
      />
    </div>
  );
};

export const FullPageSpinner = () => (
  <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: '#1a73e840', borderTopColor: 'transparent', borderLeftColor: '#1a73e8' }} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading…</p>
    </div>
  </div>
);
