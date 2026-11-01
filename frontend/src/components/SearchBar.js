const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => {
  const BLUE = '#1a73e8';

  return (
    <div className="relative group w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
        
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none transition-all text-sm font-medium"
        style={{ border: '1px solid #e5e7eb' }}
        onFocus={e => e.target.style.borderColor = BLUE}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
    </div>
  );
};

export default SearchBar;