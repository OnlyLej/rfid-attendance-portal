'use client';

/**
 * ChildPicker — shown only when there are 2+ children.
 * Renders a pill-tab selector so parents can switch between children.
 */
export default function ChildPicker({ children, selectedChildId, onSelect, darkMode }) {
  if (!children || children.length <= 1) return null;

  return (
    <div className={`flex items-center gap-2 p-1 rounded-2xl border w-fit flex-wrap ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-gray-100/80 border-gray-200'}`}>
      {children.map(child => {
        const active = child.studentId === selectedChildId;
        return (
          <button
            key={child.studentId}
            onClick={() => onSelect(child.studentId)}
            className={[
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-150 select-none',
              active
                ? 'text-white shadow-sm'
                : darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white',
            ].join(' ')}
            style={active ? { background: '#7c3aed' } : undefined}
          >
            <span
              className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
              style={{ background: active ? 'rgba(255,255,255,0.25)' : darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
            >
              {(child.name || '?').charAt(0).toUpperCase()}
            </span>
            <span className="truncate max-w-[120px]">{child.name}</span>
          </button>
        );
      })}
    </div>
  );
}
