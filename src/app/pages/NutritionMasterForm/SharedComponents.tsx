import React from 'react';

export const SectionBox: React.FC<{
  title: React.ReactNode,
  children: React.ReactNode,
  className?: string,
  paddingX?: string,
  marginTop?: string
}> = ({ title, children, className = "", paddingX = "px-2", marginTop = "mt-4" }) => (
  <section className={`relative border-2 border-[#2c5392] border-t-0 rounded-b-lg ${marginTop} pt-4 pb-1 ${paddingX} w-full ${className}`}>
    <span className="absolute -top-[11px] left-3 bg-[#2c5392] text-white px-4 py-0.5 rounded-xl text-[10px] font-bold z-10 whitespace-nowrap min-h-[18px] flex items-center shadow-sm">
      {title}
    </span>
    {children}
  </section>
);

export const LineTextarea: React.FC<{
  rows?: number,
  id: string,
  value?: string,
  onChange: any,
  lineHeight?: number
}> = ({ rows = 3, id, value = "", onChange, lineHeight = 16 }) => {
  const totalHeight = rows * lineHeight;
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e, id)}
      style={{
        backgroundImage: `linear-gradient(transparent ${lineHeight - 1}px, #2c5392 ${lineHeight - 1}px)`,
        backgroundSize: `100% ${lineHeight}px`,
        lineHeight: `${lineHeight}px`,
        height: `${totalHeight + 2}px`
      }}
      className="w-full resize-none border-none outline-none text-[#333] text-[9.5px] bg-repeat-y bg-transparent px-2 mt-0.5 block overflow-hidden"
    />
  );
};

export const FilaInput: React.FC<{ label: string, id: string, value?: string, onChange: any }> = ({ label, id, value = "", onChange }) => (
  <div className="flex items-end gap-1 mb-0.5 text-[9px] font-bold w-full overflow-hidden">
    <span className="whitespace-nowrap shrink-0">{label}</span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e, id)}
      className="border-b border-[#2c5392] flex-grow outline-none text-[#333] px-1 h-3 bg-transparent"
    />
  </div>
);

export const CustomCheckbox: React.FC<{ label: string, checked?: boolean, onChange?: any, textSize?: string }> = ({ label, checked, onChange, textSize = "text-[10px]" }) => (
  <label className={`flex items-center gap-1 cursor-pointer shrink-0 ${textSize}`}>
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={onChange}
      className="appearance-none w-2.5 h-2.5 border border-[#2c5392] checked:bg-[#2c5392] transition-all relative" 
    />
    {label}
  </label>
);