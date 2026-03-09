export default function Settings() {
  return (
    <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <p className="text-gray-300 text-lg">Configure system settings and preferences.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="text-gray-300 block mb-1">Site Name</label>
          <input
            type="text"
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
            placeholder="Enter site name"
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">Enable Notifications</label>
          <input type="checkbox" className="bg-gray-800 text-white border-gray-700" />
        </div>
        <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition">
          Save Settings
        </button>
      </div>
    </section>
  );
}