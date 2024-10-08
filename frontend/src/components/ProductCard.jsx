// ProductCard.jsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ProductCard = ({ product, onClick }) => {
  const { darkMode } = useTheme();

  // Function to ensure price is formatted correctly
  const safeToFixed = (value, decimals = 2) => {
    const numberValue = parseFloat(value);
    return isNaN(numberValue) ? '0.00' : numberValue.toFixed(decimals);
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg h-[260px] flex flex-col ${darkMode ? 'bg-light-CARD' : 'dark:bg-dark-CARD'} cursor-pointer`}
    >
      <div className='w-full'>
        <img src={product.image} alt={product.title} className='w-full h-[120px] object-cover object-center rounded-lg' />
      </div>
      <div className={`w-full h-auto p-2 flex-grow ${darkMode ? 'text-light-TEXT' : 'dark:text-dark-TEXT'}`}>
        <p>{product.name}</p>
      </div>
      <div className={`w-full h-auto p-2 ${darkMode ? 'text-light-TEXT' : 'dark:text-dark-TEXT'}`}>
        <div className='flex justify-between items-center tracking-wide'>
          <p className='text-sm text-primary'>₱ {safeToFixed(product.price)}</p>
          <p className='text-xs text-gray-400'>{product.stock} in stock</p>
        </div>
      </div>
      
    </div>
  );
};

export default ProductCard;
