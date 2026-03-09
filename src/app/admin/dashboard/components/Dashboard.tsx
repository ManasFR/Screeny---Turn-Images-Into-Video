export default function Dashboard() {
  return (
    <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Welcome, Admin!</h2>
      <p className="text-gray-300 text-lg">
        This is your dashboard. Overview of all activities, quick stats, and recent updates are here.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium">Total Users</h3>
          <p className="text-2xl font-bold text-blue-400">1,234</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium">Active Sessions</h3>
          <p className="text-2xl font-bold text-green-400">567</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium">Revenue</h3>
          <p className="text-2xl font-bold text-yellow-400">$12,345</p>
        </div>
      </div>
    </section>
  );
}