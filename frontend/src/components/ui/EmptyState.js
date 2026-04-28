const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100 animate-fade-in">
    {icon && (
      <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-6 text-gray-300">
        {icon}
      </div>
    )}
    <h3 className="text-2xl font-black text-gray-300 mb-2 font-display">{title}</h3>
    {description && (
      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-8">{description}</p>
    )}
    {action}
  </div>
);

export default EmptyState;
