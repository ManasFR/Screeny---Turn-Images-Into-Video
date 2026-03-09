export default function Users() {
  return (
    <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
      <p className="text-gray-300 text-lg">View and manage user accounts, roles, and permissions.</p>
      <div className="mt-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-700">
              <td className="py-3">John Doe</td>
              <td>john@example.com</td>
              <td>User</td>
              <td>
                <button className="text-blue-400 hover:text-blue-300">Edit</button>
                <button className="text-red-400 hover:text-red-300 ml-4">Delete</button>
              </td>
            </tr>
            <tr className="border-t border-gray-700">
              <td className="py-3">Jane Smith</td>
              <td>jane@example.com</td>
              <td>Admin</td>
              <td>
                <button className="text-blue-400 hover:text-blue-300">Edit</button>
                <button className="text-red-400 hover:text-red-300 ml-4">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}