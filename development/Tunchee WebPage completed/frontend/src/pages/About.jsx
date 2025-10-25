import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaPalette, FaCode, FaRocket, FaHeart } from 'react-icons/fa';
import axios from 'axios';

const About = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const skills = [
    { icon: FaPalette, title: 'Graphic Design', description: 'Creating stunning visuals and brand identities' },
    { icon: FaRocket, title: 'Digital Marketing', description: 'Helping businesses grow online' },
    { icon: FaHeart, title: 'Passion', description: 'Dedicated to delivering exceptional results' }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/v1/auth/profile');
        setProfileData(response.data.data.user);
      } catch (error) {
        // If profile not available, use default data
        setProfileData({
          full_name: 'Anyetei Sowah Joseph',
          about_me: 'I am Anyetei Sowah Joseph. A seasoned graphic designer with over 3 years of experience in crafting visually stunning designs that captivate audiences. Graphic design isn\'t just my profession - it\'s also my passion and hobby. I find immense joy in bringing ideas to life through creative visuals. With a keen eye for detail and a flair for innovation, I deliver premium and breathtaking designs that meet the unique needs of business owners and clients, while also fueling my own creative fulfillment.',
          what_i_can_do: 'I offer comprehensive design services including brand identity, logo design, UI/UX design, print materials, and digital marketing solutions. Each project is approached with creativity, attention to detail, and a focus on delivering results that exceed expectations.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <>
      <Helmet>
        <title>About Me - {profileData?.full_name || 'Anyetei Sowah Joseph'}</title>
        <meta name="description" content={`Learn more about ${profileData?.full_name || 'Anyetei Sowah Joseph'}, a professional graphic designer and creative expert.`} />
      </Helmet>

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              About <span className="text-primary">Me</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {profileData?.what_i_can_do || 'Passionate graphic designer and creative professional dedicated to bringing your vision to life'}
            </p>
          </motion.div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">My Story</h2>
              <p className="text-gray-600 mb-4">
                {profileData?.about_me || 'With over 5 years of experience in graphic design and digital creativity, I specialize in creating compelling visual solutions that help businesses stand out in today\'s competitive market.'}
              </p>
              <p className="text-gray-600 mb-4">
                My journey began with a passion for art and technology, which led me to
                combine creative design with modern web technologies to deliver
                comprehensive digital solutions.
              </p>
              <p className="text-gray-600">
                I believe in the power of design to tell stories, build brands, and
                create meaningful connections between businesses and their audiences.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gradient-to-br from-primary/10 to-accent-500/10 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What I Do</h3>
              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <skill.icon className="text-primary text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{skill.title}</h4>
                      <p className="text-gray-600 text-sm">{skill.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            <div>
              <div className="text-3xl font-bold text-primary mb-2">20+</div>
              <div className="text-gray-600">Projects Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">3+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100+</div>
              <div className="text-gray-600">Happy Clients</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-gray-600">Client Satisfaction</div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default About;