'use client';

import { useState, useEffect } from 'react';

// Define the License interface
interface License {
  id: string;
  name: string;
  licenseCodes: string[];
  status: string;
}

export default function License() {
  const [formData, setFormData] = useState({
    name: '',
    numberOfCodes: '',
    status: 'active',
  });
  const [message, setMessage] = useState('');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({});

  // Fetch licenses on component mount
  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch('/api/admin/license');
        const result = await response.json();
        if (response.ok) {
          setLicenses(result.data);
        } else {
          setMessage(result.error || 'Error fetching licenses');
        }
      } catch (error) {
        console.error('Error fetching licenses:', error);
        setMessage('Error fetching licenses');
      }
    };
    fetchLicenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          numberOfCodes: parseInt(formData.numberOfCodes, 10),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Licenses generated successfully!');
        setFormData({ name: '', numberOfCodes: '', status: 'active' });
        // Refresh licenses after submission
        const refreshed = await fetch('/api/admin/license');
        const refreshedData = await refreshed.json();
        if (refreshed.ok) {
          setLicenses(refreshedData.data);
        }
      } else {
        setMessage(result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error generating licenses:', error);
      setMessage('Error generating licenses');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleShowMore = (id: string) => {
    setShowMore((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Manage License Codes</h2>
      <p className="text-gray-300 text-lg">Generate and manage license codes for users.</p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-gray-300 block mb-1">License Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
            placeholder="Enter license name"
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">Number of License Codes</label>
          <input
            type="number"
            name="numberOfCodes"
            value={formData.numberOfCodes}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
            placeholder="Enter number of codes to generate"
            min="1"
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition"
        >
          Generate Licenses
        </button>
        {message && <p className="text-green-400">{message}</p>}
      </form>

      {/* Licenses Table */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Generated Licenses</h3>
        {licenses.length === 0 ? (
          <p className="text-gray-400">No licenses found.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400">
                <th className="py-2">Name</th>
                <th>License Codes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => (
                <tr key={license.id} className="border-t border-gray-700">
                  <td className="py-3">{license.name}</td>
                  <td>
                    <div>
                      {license.licenseCodes.slice(0, 5).map((code: string, index: number) => (
                        <p key={index} className="text-gray-300">{code}</p>
                      ))}
                      {license.licenseCodes.length > 5 && !showMore[license.id] && (
                        <button
                          onClick={() => toggleShowMore(license.id)}
                          className="text-blue-400 hover:text-blue-300 mt-2"
                        >
                          View More
                        </button>
                      )}
                      {showMore[license.id] && (
                        <div className="max-h-40 overflow-y-auto mt-2">
                          {license.licenseCodes.slice(5).map((code: string, index: number) => (
                            <p key={index} className="text-gray-300">{code}</p>
                          ))}
                          <button
                            onClick={() => toggleShowMore(license.id)}
                            className="text-blue-400 hover:text-blue-300 mt-2"
                          >
                            Show Less
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{license.status}</td>
                  <td>
                    <button className="text-blue-400 hover:text-blue-300">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}