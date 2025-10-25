import React, { useState } from 'react';
import './HoverCard.css';

const HoverCard = ({ images = [] }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  
  // Take up to 3 images for the hover card
  const cardImages = images.slice(0, 3);
  
  console.log('HoverCard received images:', cardImages.length, cardImages.map(img => ({
    id: img.id,
    local_url: img.local_url,
    image_url: img.image_url,
    file_name: img.file_name
  })));
  
  if (cardImages.length === 0) return null;

  const handleImageError = (imageId) => {
    console.error('Image failed to load:', imageId);
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
  };

  const getImageSrc = (image) => {
    const src = image.local_url || `http://localhost:5002${image.image_url}`;
    console.log('Image src for', image.file_name, ':', src);
    return src;
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleModalClick = (e) => {
    // Close modal if clicking on the backdrop
    if (e.target === e.currentTarget) {
      closeImageModal();
    }
  };

  return (
    <>
      <div className="hover-card">
        {cardImages.map((image, index) => {
          const imageSrc = getImageSrc(image);
          const hasError = imageErrors[image.id];
          
          return (
            <div 
              key={image.id || index} 
              className="hover-panel"
              onClick={() => openImageModal(image)}
            >
              <div 
                className="hover-panel-bg"
                style={{
                  backgroundImage: hasError ? 'none' : `url(${imageSrc})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: hasError ? '#f0f0f0' : 'transparent'
                }}
              >
                {hasError && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    color: '#666',
                    fontSize: '12px'
                  }}>
                    Image Error
                  </div>
                )}
                <img 
                  src={imageSrc}
                  alt=""
                  style={{ display: 'none' }}
                  onError={() => handleImageError(image.id)}
                  onLoad={() => console.log('Image loaded successfully:', imageSrc)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={handleModalClick}>
          <div className="modal-content">
            <button className="modal-close" onClick={closeImageModal}>
              &times;
            </button>
            <img
              src={getImageSrc(selectedImage)}
              alt={selectedImage.image_title || 'Portfolio Image'}
              className="modal-image"
              onError={() => console.error('Modal image failed to load:', getImageSrc(selectedImage))}
            />
            {selectedImage.image_title && (
              <div className="modal-title">
                {selectedImage.image_title}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HoverCard;