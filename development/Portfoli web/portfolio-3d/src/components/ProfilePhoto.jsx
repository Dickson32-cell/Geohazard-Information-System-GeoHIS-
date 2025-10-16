import React from 'react';
import { motion } from 'framer-motion';
import { profileData } from '../data/profileData';

const ProfilePhoto = ({ className = "", size = "w-32 h-32 md:w-40 md:h-40" }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Outer glow ring */}
      <div className={`${size} rounded-full bg-gradient-to-br from-deep-gold/20 to-royal-blue/20 p-1`}>
        {/* Inner glow */}
        <div className="w-full h-full rounded-full bg-gradient-to-br from-royal-blue/10 to-deep-gold/10 p-1">
          {/* Profile image container */}
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-deep-gold/30">
            <img
              src={profileData.personal.profileImage}
              alt={`${profileData.personal.name} - ${profileData.personal.title}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback initials */}
            <div className="w-full h-full bg-gradient-to-br from-royal-blue to-dark-gray flex items-center justify-center text-deep-gold font-bold text-2xl md:text-3xl hidden">
              {profileData.personal.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </div>
      </div>

      {/* Animated border ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-deep-gold/50"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
};

export default ProfilePhoto;