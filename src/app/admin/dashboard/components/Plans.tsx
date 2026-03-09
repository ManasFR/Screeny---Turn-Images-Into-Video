'use client';

import { useState, useEffect } from 'react';

interface License {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  planName: string;
  license_id: number;
  retailPrice: number;
  salePrice: number;
  videos: number;
  watermark: number;
  noWatermark: number;
  features?: string[];
}

export default function Plans() {
  const [formData, setFormData] = useState({
    planName: '',
    license_id: '',
    retailPrice: '',
    salePrice: '',
    videos: '',
    watermark: '0',
    noWatermark: '0',
  });
  const [features, setFeatures] = useState<string[]>(['']);
  const [showFeatures, setShowFeatures] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch('/api/admin/license');
        if (!response.ok) throw new Error(`Failed to fetch licenses: Status ${response.status}`);
        const result = await response.json();
        if (result.data) setLicenses(result.data);
      } catch (error) {
        console.error('Error fetching licenses:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setMessage(`Failed to load licenses: ${errorMessage}`);
      }
    };

    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/admin/plans');
        if (!response.ok) throw new Error(`Failed to fetch plans: Status ${response.status}`);
        const result = await response.json();
        if (result.data) setPlans(result.data);
      } catch (error) {
        console.error('Error fetching plans:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setMessage(`Failed to load plans: ${errorMessage}`);
      }
    };

    fetchLicenses();
    fetchPlans();
  }, []);

  const handleAddFeature = () => setFeatures([...features, '']);

  const handleRemoveFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures.length > 0 ? newFeatures : ['']);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const validFeatures = features.filter(f => f.trim() !== '');
      const payload = {
        planName: formData.planName,
        license_id: parseInt(formData.license_id),
        retailPrice: parseFloat(formData.retailPrice),
        salePrice: parseFloat(formData.salePrice),
        videos: parseInt(formData.videos) || 0,
        watermark: parseInt(formData.watermark),
        noWatermark: parseInt(formData.noWatermark),
        features: validFeatures.length > 0 ? validFeatures : undefined,
      };

      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || `Failed to create plan`);

      if (result.data) {
        setMessage('Plan created successfully!');
        setFormData({ planName: '', license_id: '', retailPrice: '', salePrice: '', videos: '', watermark: '0', noWatermark: '0' });
        setFeatures(['']);
        setShowFeatures(false);
        
        const refreshed = await fetch('/api/admin/plans');
        if (refreshed.ok) {
          const refreshedData = await refreshed.json();
          setPlans(refreshedData.data);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Manage Plans</h2>
      <p className="text-gray-300 text-lg mb-6">Create and manage subscription plans.</p>

      <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
        <div>
          <label className="text-gray-300 block mb-1">Plan Name</label>
          <input
            type="text"
            name="planName"
            value={formData.planName}
            onChange={handleChange}
            className="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-lg"
            placeholder="Enter plan name"
          />
        </div>

        <div>
          <label className="text-gray-300 block mb-1">License</label>
          <select
            name="license_id"
            value={formData.license_id}
            onChange={handleChange}
            className="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-lg"
          >
            <option value="">Select a license</option>
            {licenses.map((license) => (
              <option key={license.id} value={license.id}>{license.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-300 block mb-1">Retail Price ($)</label>
            <input
              type="number"
              name="retailPrice"
              value={formData.retailPrice}
              onChange={handleChange}
              className="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-lg"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-gray-300 block mb-1">Sale Price ($)</label>
            <input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              onChange={handleChange}
              className="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-lg"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="text-gray-300 block mb-1">Number of Videos</label>
          <input
            type="number"
            name="videos"
            value={formData.videos}
            onChange={handleChange}
            className="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-lg"
            placeholder="e.g., 10, 20, 30"
            min="0"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-300 block mb-1">Watermark</label>
            <select
              name="watermark"
              value={formData.watermark}
              onChange={handleChange}
              className="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-lg"
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 block mb-1">No Watermark</label>
            <select
              name="noWatermark"
              value={formData.noWatermark}
              onChange={handleChange}
              className="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-lg"
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
        </div>

        <div>
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showFeatures ? 'Hide Features' : 'Add Features'}
          </button>
        </div>

        {showFeatures && (
          <div className="space-y-3 bg-gray-900 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-300 font-semibold">Plan Features</label>
              <button
                onClick={handleAddFeature}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
              >
                + Add Feature
              </button>
            </div>
            {features.map((feature, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="text-gray-400 min-w-[30px]">{index + 1}.</span>
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  className="flex-1 p-2 bg-gray-800 text-white border border-gray-600 rounded-lg"
                  placeholder={`Feature ${index + 1}`}
                />
                {features.length > 1 && (
                  <button
                    onClick={() => handleRemoveFeature(index)}
                    className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Plan'}
        </button>
        
        {message && (
          <p className={message.includes('Error') || message.includes('Failed') ? 'text-red-400' : 'text-green-400'}>
            {message}
          </p>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Available Plans</h3>
        {plans.length === 0 ? (
          <p className="text-gray-400">No plans found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="py-2 px-4">Plan Name</th>
                  <th className="px-4">License</th>
                  <th className="px-4">Retail</th>
                  <th className="px-4">Sale</th>
                  <th className="px-4">Videos</th>
                  <th className="px-4">Watermark</th>
                  <th className="px-4">No WM</th>
                  <th className="px-4">Features</th>
                  <th className="px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-t border-gray-700 hover:bg-gray-800">
                    <td className="py-3 px-4">{plan.planName}</td>
                    <td className="px-4">
                      {licenses.find((l) => l.id === plan.license_id)?.name || 'Unknown'}
                    </td>
                    <td className="px-4">${plan.retailPrice.toFixed(2)}</td>
                    <td className="px-4">${plan.salePrice.toFixed(2)}</td>
                    <td className="px-4">{plan.videos}</td>
                    <td className="px-4">
                      <span className={plan.watermark === 1 ? 'text-yellow-400' : 'text-gray-500'}>
                        {plan.watermark === 1 ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4">
                      <span className={plan.noWatermark === 1 ? 'text-green-400' : 'text-gray-500'}>
                        {plan.noWatermark === 1 ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4">
                      {plan.features && plan.features.length > 0 ? (
                        <ul className="text-sm text-gray-300 list-disc list-inside">
                          {plan.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">No features</span>
                      )}
                    </td>
                    <td className="px-4">
                      <button className="text-blue-400 hover:text-blue-300">Edit</button>
                      <button className="text-red-400 hover:text-red-300 ml-4">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}