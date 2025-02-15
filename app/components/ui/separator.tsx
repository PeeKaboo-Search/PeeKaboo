import React from 'react';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  size?: 'thin' | 'medium' | 'thick';
  className?: string;
  decorative?: boolean;
  label?: string;
}

const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  color = 'currentColor',
  size = 'medium',
  className = '',
  decorative = true,
  label
}) => {
  const sizeMap = {
    thin: '1px',
    medium: '2px',
    thick: '4px'
  };

  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    width: orientation === 'horizontal' ? '100%' : sizeMap[size],
    height: orientation === 'vertical' ? '100%' : 'auto',
    margin: orientation === 'horizontal' ? '1rem 0' : '0 1rem'
  };

  const lineStyles = {
    flex: label ? 1 : 'none',
    height: orientation === 'horizontal' ? sizeMap[size] : '100%',
    width: orientation === 'vertical' ? sizeMap[size] : '100%',
    backgroundColor: variant === 'solid' ? color : 'transparent',
    borderStyle: variant,
    borderWidth: variant !== 'solid' ? sizeMap[size] : 0,
    borderColor: color,
    opacity: 0.2
  };

  const labelStyles = {
    margin: orientation === 'horizontal' ? '0 1rem' : '1rem 0',
    color: color,
    fontSize: '0.875rem',
    opacity: 0.7
  };

  // For screen readers
  const ariaProps = decorative ? {
    role: 'none',
    'aria-hidden': true
  } : {
    role: 'separator',
    'aria-orientation': orientation
  };

  return (
    <div 
      className={`separator ${className}`}
      style={baseStyles}
      {...ariaProps}
    >
      <div style={lineStyles} />
      {label && (
        <>
          <span style={labelStyles}>{label}</span>
          <div style={lineStyles} />
        </>
      )}
    </div>
  );
};

export default Separator;