import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export default Card;