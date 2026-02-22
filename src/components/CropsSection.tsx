import React from 'react';

const CropsSection: React.FC = () => {
  const crops = [
    {
      id: 1,
      name: 'Paddy',
      stage: 'Vegetative Stage',
      image: 'https://images.unsplash.com/photo-1599940776781-b54157d60e6e?q=80&w=200&auto=format&fit=crop',
    },
    {
      id: 2,
      name: 'Cotton',
      stage: 'Flowering Stage',
      image: 'https://images.unsplash.com/photo-1595123550441-d377e017de6a?q=80&w=200&auto=format&fit=crop',
    }
  ];

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-200 mb-3">Your Crops</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {crops.map((crop) => (
          <div key={crop.id} className="glass-panel-dark p-3 rounded-xl flex items-center gap-3 min-w-[160px] flex-1 border border-white/5">
            <img 
              src={crop.image} 
              alt={crop.name} 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-white">{crop.name}</p>
              <p className="text-[10px] text-gray-400">{crop.stage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CropsSection;