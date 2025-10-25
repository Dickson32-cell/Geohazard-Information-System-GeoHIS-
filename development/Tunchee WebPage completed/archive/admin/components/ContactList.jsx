import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaReply,
  FaTrash
} from 'react-icons/fa';
import axios from 'axios';

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        sort: 'newest'
      });

      const response = await axios.get(`/api/v1/contact/submissions?${params}`);
      setContacts(response.data.data.submissions);
      setTotalPages(response.data.data.pagination.total_pages);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleStatusUpdate = async (contactId, newStatus) => {
    try {
      await axios.put(`/admin/contact/${contactId}/status`, {
        status: newStatus
      });
      fetchContacts(); // Refresh the list
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Failed to update contact status');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact submission?')) {
      return;
    }

    try {
      await axios.delete(`/admin/contact/${contactId}`);
      fetchContacts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <FaEnvelope className="text-blue-500" />;
      case 'in_progress':
        return <FaClock className="text-yellow-500" />;
      case 'resolved':
        return <FaCheckCircle className="text-green-500" />;
      default:
        return <FaEnvelope className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contact Submissions</h2>
          <p className="text-gray-600">Manage inquiries from your contact form</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading contact submissions...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <FaEnvelope className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contact submissions found</h3>
            <p className="text-gray-600">
              {statusFilter === 'all' ? 'No submissions yet.' : `No ${statusFilter} submissions found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map((contact, index) => (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {getStatusIcon(contact.status)}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <FaEnvelope className="text-xs" />
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <FaPhone className="text-xs" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{contact.project_type}</div>
                        {contact.budget_range && (
                          <div className="text-gray-500">Budget: {contact.budget_range}</div>
                        )}
                        {contact.preferred_timeline && (
                          <div className="text-gray-500">Timeline: {contact.preferred_timeline}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contact.status)}`}>
                        {contact.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(contact.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <select
                          value={contact.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(contact.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContact(contact.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete contact"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Contact Details</h3>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTimesCircle />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{selectedContact.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">
                    <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">
                      {selectedContact.email}
                    </a>
                  </p>
                </div>
                {selectedContact.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900">
                      <a href={`tel:${selectedContact.phone}`} className="text-primary hover:underline">
                        {selectedContact.phone}
                      </a>
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedContact.status)}`}>
                    {selectedContact.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Project Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <p className="text-gray-900">{selectedContact.project_type}</p>
                  </div>
                  {selectedContact.budget_range && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                      <p className="text-gray-900">{selectedContact.budget_range}</p>
                    </div>
                  )}
                  {selectedContact.preferred_timeline && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Timeline</label>
                      <p className="text-gray-900">{selectedContact.preferred_timeline}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                    <p className="text-gray-900">{formatDate(selectedContact.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <select
                  value={selectedContact.status}
                  onChange={(e) => handleStatusUpdate(selectedContact.id, e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="new">Mark as New</option>
                  <option value="in_progress">Mark as In Progress</option>
                  <option value="resolved">Mark as Resolved</option>
                </select>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContactList;