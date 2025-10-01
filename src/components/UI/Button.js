import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false, 
  className = '',
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
      }`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;