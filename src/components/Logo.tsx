import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  lightMode?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
  lightMode = false,
}) => {
  const sizeMap = {
    sm: { height: 26, text: 'text-lg', dot: 'text-base', tag: 'text-[9px]' },
    md: { height: 32, text: 'text-xl', dot: 'text-lg', tag: 'text-[10px]' },
    lg: { height: 42, text: 'text-2xl', dot: 'text-xl', tag: 'text-xs' },
    xl: { height: 56, text: 'text-3xl', dot: 'text-2xl', tag: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="flex items-center gap-2">
        {/* Minimalist Logo Mark: HỦ.DESIGN */}
        <div className="flex items-center tracking-tighter font-extrabold font-display">
          <span className={`transition-colors ${lightMode ? 'text-gray-900' : 'text-white'} ${currentSize.text}`}>
            HỦ
          </span>
          <span className="text-blue-500 font-black text-xl px-0.5">.</span>
          <span className={`tracking-widest font-bold transition-colors ${lightMode ? 'text-gray-800' : 'text-gray-200'} ${currentSize.text}`}>
            DESIGN
          </span>
        </div>
      </div>

      {showTagline && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className={`${currentSize.tag} tracking-widest font-semibold uppercase ${lightMode ? 'text-gray-400' : 'text-gray-400'}`}>
            Studio Management
          </p>
        </div>
      )}
    </div>
  );
};
