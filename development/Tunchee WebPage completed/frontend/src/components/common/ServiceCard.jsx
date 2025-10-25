import React from 'react';

const ServiceCard = ({ service, onClick }) => {

  const getServiceIcon = (serviceName) => {
    switch (serviceName) {
      case 'Brand Identity':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      case 'UI/UX Design':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        );
      case 'Print Design':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 6,2 18,2 18,9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
        );
      default:
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
        );
    }
  };

  return (
    <div className="service-card-container">
      <div
        className="relative drop-shadow-xl w-80 h-80 overflow-hidden rounded-xl bg-blue-100 hover:bg-blue-200 transition-all duration-300 cursor-pointer transform hover:scale-105"
        onClick={() => onClick(service)}
      >
        {/* Blur effect background */}
        <div className="absolute w-80 h-64 bg-white blur-[50px] -left-1/2 -top-1/2"></div>

        {/* Card content */}
        <div className="absolute flex flex-col items-center justify-center text-gray-800 z-[1] opacity-95 rounded-xl inset-1 bg-blue-50 hover:bg-blue-100 transition-all duration-300 p-6">
          {/* Icon */}
          <div className="mb-4 p-4 bg-blue-200 rounded-full">
            <div className="text-blue-600">
              {getServiceIcon(service.name)}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-center mb-3 text-gray-800">
            {service.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-center text-gray-600 mb-4 leading-relaxed">
            {service.description.length > 100
              ? `${service.description.substring(0, 100)}...`
              : service.description
            }
          </p>

          {/* Pricing */}
          <div className="text-center mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">From</div>
            <div className="text-2xl font-bold text-blue-600">
              GHS{Math.min(...service.packages.map(pkg => pkg.price))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {service.packages.length} package{service.packages.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Button */}
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2">
            <span>Explore</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7"/>
              <path d="M7 7h10v10"/>
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .service-card-container {
          margin: 1rem;
          display: flex;
          justify-content: center;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .service-card-container {
            margin: 0.5rem;
          }

          .service-card-container > div {
            width: 280px !important;
            height: 280px !important;
          }

          .service-card-container > div > div:first-child {
            width: 280px !important;
            height: 240px !important;
          }
        }

        @media (max-width: 480px) {
          .service-card-container > div {
            width: 250px !important;
            height: 250px !important;
          }

          .service-card-container > div > div:first-child {
            width: 250px !important;
            height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceCard;