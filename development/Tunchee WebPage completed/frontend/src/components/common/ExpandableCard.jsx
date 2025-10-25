import React, { useState } from 'react';

const ExpandableCard = ({ images, startIndex }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get the 3 images for this card
  const cardImages = images.slice(startIndex, startIndex + 3);
  console.log(`Card ${startIndex / 3}:`, cardImages.length, 'images');

  if (cardImages.length === 0) return null;

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleImageClick = (e, index) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
    setIsExpanded(true);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % cardImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + cardImages.length) % cardImages.length);
  };

  return (
    <>
      {/* Main Card */}
      <div
        className={`relative cursor-pointer transition-all duration-300 ease-in-out bg-white rounded-xl shadow-lg border border-gray-200 ${
          isExpanded ? 'z-50' : ''
        }`}
        onClick={handleCardClick}
        style={{
          width: isExpanded ? '600px' : '300px',
          height: isExpanded ? '400px' : '200px',
        }}
      >

        {/* Content */}
        <div className="h-full p-4 flex flex-col bg-white rounded-xl">
          {!isExpanded ? (
            // Collapsed state - show 3 images in a grid
            <div className="flex-1 grid grid-cols-3 gap-2">
              {cardImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative rounded-lg overflow-hidden cursor-pointer"
                  onClick={(e) => handleImageClick(e, index)}
                >
                  <img
                    src={image.local_url || `http://localhost:5002${image.image_url}`}
                    alt={image.image_alt_text || image.image_title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              ))}
            </div>
          ) : (
            // Expanded state - show single large image with navigation
            <div className="flex-1 relative">
              <img
                src={cardImages[currentImageIndex].local_url || `http://localhost:5002${cardImages[currentImageIndex].image_url}`}
                alt={cardImages[currentImageIndex].image_alt_text || cardImages[currentImageIndex].image_title}
                className="w-full h-full object-cover rounded-lg"
              />

              {/* Navigation arrows */}
              {cardImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {currentImageIndex + 1} / {cardImages.length}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="mt-2 text-center">
            <h3 className="text-sm font-medium text-gray-800 truncate">
              {cardImages[0].image_title}
              {cardImages.length > 1 && ` +${cardImages.length - 1} more`}
            </h3>
          </div>
        </div>
      </div>

      {/* Overlay when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default ExpandableCard;