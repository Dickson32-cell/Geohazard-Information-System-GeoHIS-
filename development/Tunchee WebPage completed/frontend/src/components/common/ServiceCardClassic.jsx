import React from 'react';

const ServiceCardClassic = ({ service, onClick, showDate = true }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="service-card-container">
      <div className="card" onClick={() => onClick(service)}>
        <h1>{service.name}</h1>
        <p>
          {service.description.length > 100
            ? `${service.description.substring(0, 100)}...`
            : service.description
          }
        </p>
        <div className="card-footer">
          {showDate && formatDate(service.created_at) && (
            <span className="date">{formatDate(service.created_at)}</span>
          )}
          <button className="see-more-btn">See More</button>
        </div>
      </div>

      <style jsx>{`
        .service-card-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 1rem;
        }

        .card {
          width: 190px;
          height: 120px;
          padding: 0.5rem;
          background: rgba(198, 198, 198, 0.34);
          border-radius: 8px;
          backdrop-filter: blur(5px);
          border-bottom: 3px solid rgba(255, 255, 255, 0.440);
          border-left: 2px rgba(255, 255, 255, 0.545) outset;
          box-shadow: -40px 50px 30px rgba(0, 0, 0, 0.280);
          transform: skewX(10deg);
          transition: .4s;
          overflow: hidden;
          color: white;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }

        .card:hover {
          height: 254px;
          transform: skew(0deg);
          background: rgba(59, 130, 246, 0.8);
        }

        .card h1 {
          text-align: center;
          margin: 1.3rem 0 0.5rem 0;
          color: white;
          text-shadow: -10px 5px 10px rgba(0, 0, 0, 0.573);
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .card p {
          text-align: center;
          margin: 0.5rem 1rem;
          color: white;
          font-size: 0.85rem;
          line-height: 1.4;
          flex-grow: 1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .card:hover p {
          opacity: 1;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding: 0 1rem 1rem 1rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .card:hover .card-footer {
          opacity: 1;
        }

        .date {
          font-size: 0.75rem;
          color: white;
          font-weight: 500;
        }

        .see-more-btn {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: #1e40af;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .see-more-btn:hover {
          background: white;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default ServiceCardClassic;