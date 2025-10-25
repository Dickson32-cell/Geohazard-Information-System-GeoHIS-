const { ContactSubmission } = require('../models');
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // You can change this to your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send email notification
const sendEmailNotification = async (submission) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'sowahjoseph81@gmail.com',
      subject: `New Contact Form Submission - ${submission.project_type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066CC;">New Contact Form Submission</h2>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Contact Details:</h3>
            <p><strong>Name:</strong> ${submission.name}</p>
            <p><strong>Email:</strong> ${submission.email}</p>
            ${submission.phone ? `<p><strong>Phone:</strong> ${submission.phone}</p>` : ''}

            <h3 style="margin-top: 20px;">Project Details:</h3>
            <p><strong>Project Type:</strong> ${submission.project_type}</p>
            ${submission.budget_range ? `<p><strong>Budget Range:</strong> ${submission.budget_range}</p>` : ''}
            ${submission.preferred_timeline ? `<p><strong>Preferred Timeline:</strong> ${submission.preferred_timeline}</p>` : ''}

            <h3 style="margin-top: 20px;">Message:</h3>
            <p style="white-space: pre-wrap;">${submission.message}</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            This message was sent from your portfolio website contact form.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Contact form notification email sent successfully');
  } catch (error) {
    console.error('Error sending contact form notification email:', error);
    // Don't throw error - we don't want to fail the contact submission if email fails
  }
};

// Submit contact form
const submitContactForm = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      project_type,
      budget_range,
      message,
      preferred_timeline
    } = req.body;

    // Validate required fields
    if (!name || !email || !message || !project_type) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Name, email, message, and project type are required'
      });
    }

    // Create contact submission
    const submission = await ContactSubmission.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      project_type,
      budget_range: budget_range || null,
      message: message.trim(),
      preferred_timeline: preferred_timeline || null,
      ip_address: req.ip || req.connection.remoteAddress
    });

    // Send email notification (async, don't wait)
    sendEmailNotification(submission);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We\'ll respond soon.',
      data: {
        submission_id: submission.id
      }
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to send message. Please try again.'
    });
  }
};

// Get all contact submissions (Admin only)
const getContactSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      sort = 'newest'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Build order clause
    const orderClause = [];
    if (sort === 'newest') {
      orderClause.push(['created_at', 'DESC']);
    } else if (sort === 'oldest') {
      orderClause.push(['created_at', 'ASC']);
    }

    const { count, rows: submissions } = await ContactSubmission.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: orderClause
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get contact submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch contact submissions'
    });
  }
};

// Update contact submission status (Admin only)
const updateContactSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response_note } = req.body;

    const submission = await ContactSubmission.findByPk(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Contact submission not found'
      });
    }

    // Update submission
    await submission.update({
      status: status || submission.status,
      responded_at: status === 'resolved' ? new Date() : submission.responded_at
    });

    // If admin adds a response note, we could store it or send it via email
    // For now, we'll just log it
    if (response_note) {
      console.log(`Admin response for submission ${id}: ${response_note}`);
    }

    res.json({
      success: true,
      message: 'Contact submission updated successfully',
      data: {
        submission
      }
    });

  } catch (error) {
    console.error('Update contact submission error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update contact submission'
    });
  }
};

// Delete contact submission (Admin only)
const deleteContactSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await ContactSubmission.findByPk(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Contact submission not found'
      });
    }

    await submission.destroy();

    res.json({
      success: true,
      message: 'Contact submission deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact submission error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete contact submission'
    });
  }
};

module.exports = {
  submitContactForm,
  getContactSubmissions,
  updateContactSubmissionStatus,
  deleteContactSubmission
};