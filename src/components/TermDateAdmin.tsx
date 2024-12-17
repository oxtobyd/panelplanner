import React, { useState, useEffect } from 'react';
import { TermDate, termDatesApi } from '../api/termDates';

const TermDateAdmin: React.FC = () => {
  const [termDates, setTermDates] = useState<TermDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<TermDate | null>(null);
  const [formData, setFormData] = useState({
    academic_year: new Date().getFullYear(),
    term_name: '',
    start_date: '',
    end_date: '',
    type: 'term' as const,
    region: 'England'
  });

  useEffect(() => {
    loadTermDates();
  }, []);

  const loadTermDates = async () => {
    const dates = await termDatesApi.getTermDates();
    setTermDates(dates);
  };

  const handleEdit = (termDate: TermDate) => {
    // Format the dates to YYYY-MM-DD for the date inputs
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setSelectedDate(termDate);
    setFormData({
      academic_year: termDate.academic_year,
      term_name: termDate.term_name,
      start_date: formatDate(termDate.start_date),
      end_date: formatDate(termDate.end_date),
      type: termDate.type,
      region: termDate.region
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedDate) {
        await termDatesApi.updateTermDate(selectedDate.id, formData);
      } else {
        await termDatesApi.createTermDate(formData);
      }
      loadTermDates();
      resetForm();
    } catch (error) {
      console.error('Error saving term date:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this term date?')) {
      try {
        await termDatesApi.deleteTermDate(id);
        loadTermDates();
      } catch (error) {
        console.error('Error deleting term date:', error);
      }
    }
  };

  const resetForm = () => {
    setSelectedDate(null);
    setFormData({
      academic_year: new Date().getFullYear(),
      term_name: '',
      start_date: '',
      end_date: '',
      type: 'term',
      region: 'England'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Term Dates</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
            <input
              type="number"
              value={formData.academic_year}
              onChange={(e) => setFormData({...formData, academic_year: parseInt(e.target.value)})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Term Name</label>
            <input
              type="text"
              value={formData.term_name}
              onChange={(e) => setFormData({...formData, term_name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as 'term' | 'holiday'})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            >
              <option value="term">Term</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {selectedDate ? 'Update' : 'Create'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Academic Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Term Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {termDates.map((termDate) => (
              <tr key={termDate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {termDate.academic_year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {termDate.term_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(termDate.start_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(termDate.end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {termDate.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(termDate)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(termDate.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TermDateAdmin; 