import { useState } from 'react';
import type { SignupData } from '../page';

interface Props {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin', description: 'Full system access' },
  { value: 'WAREHOUSE', label: 'Warehouse', description: 'Inventory & order management' },
  { value: 'FIELD', label: 'Field Worker', description: 'Vehicle stock & orders' },
  { value: 'SALES_REP', label: 'Sales Rep', description: 'Customer & route management' },
  { value: 'DRIVER', label: 'Driver', description: 'Delivery tracking' },
];

export default function UserSetup({ data, updateData, onNext, onPrev }: Props) {
  const [users, setUsers] = useState(data.users);

  const tierLimits: Record<string, number> = {
    BASE: 10,
    ELITE: 100,
    DISTRIBUTION: 9999,
  };

  const maxUsers = tierLimits[data.tier] || 10;

  const addUser = () => {
    if (users.length >= maxUsers) {
      return;
    }
    setUsers([...users, { name: '', email: '', role: 'WAREHOUSE', branchName: data.branches[0]?.name || '' }]);
  };

  const removeUser = (index: number) => {
    setUsers(users.filter((_, i) => i !== index));
  };

  const updateUser = (index: number, field: string, value: string) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setUsers(newUsers);
  };

  const handleNext = () => {
    // Validation - all users must have name, email, and role
    for (let i = 0; i < users.length; i++) {
      if (!users[i].name || !users[i].email || !users[i].role) {
        alert(`User #${i + 1}: Name, Email, and Role are required`);
        return;
      }
    }

    updateData({ users });
    onNext();
  };

  // Filter roles based on business model
  const getAvailableRoles = () => {
    if (data.businessModels.includes('DISTRIBUTION') || data.businessModels.includes('HYBRID')) {
      return ROLE_OPTIONS;
    }
    // Only warehouse roles for WAREHOUSE_ONLY
    return ROLE_OPTIONS.filter((r) => !['SALES_REP', 'DRIVER'].includes(r.value));
  };

  const availableRoles = getAvailableRoles();

  return (
    <div>
      <h2 className="text-3xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
        Add Team Members
      </h2>
      <p className="text-ocean-muted dark:text-ocean-muted-dark mb-2">
        Invite your team members (optional - you can add them later)
      </p>
      <p className="text-sm text-ocean-accent dark:text-starlight mb-8">
        Your {data.tier} plan includes up to {maxUsers === 9999 ? 'unlimited' : maxUsers} users
      </p>

      {users.length > 0 ? (
        <div className="space-y-4 mb-8">
          {users.map((user, index) => (
            <div
              key={index}
              className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-ocean-text dark:text-ocean-text-dark">
                  User #{index + 1}
                </h3>
                <button
                  onClick={() => removeUser(index)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={user.name}
                    onChange={(e) => updateUser(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={user.email}
                    onChange={(e) => updateUser(index, 'email', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                    Role *
                  </label>
                  <select
                    value={user.role}
                    onChange={(e) => updateUser(index, 'role', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
                  >
                    {availableRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                    Assign to Location
                  </label>
                  <select
                    value={user.branchName}
                    onChange={(e) => updateUser(index, 'branchName', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
                  >
                    <option value="">Not assigned</option>
                    {data.branches.map((branch, idx) => (
                      <option key={idx} value={branch.name}>
                        {branch.name} ({branch.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-ocean-sky/10 dark:bg-ocean-deep/20 rounded-lg p-8 border-2 border-dashed border-ocean-medium/30 dark:border-starlight/30 text-center mb-8">
          <p className="text-ocean-muted dark:text-ocean-muted-dark mb-4">
            No team members added yet. You can skip this step and add users later from the dashboard.
          </p>
        </div>
      )}

      {users.length < maxUsers && (
        <button
          onClick={addUser}
          className="w-full px-6 py-3 bg-ocean-light dark:bg-ocean-deep border-2 border-dashed border-ocean-accent dark:border-starlight rounded-lg text-ocean-accent dark:text-starlight font-semibold hover:bg-ocean-accent/10 dark:hover:bg-starlight/10 transition-all duration-300"
        >
          + Add Team Member
        </button>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-3 bg-ocean-light dark:bg-ocean-deep hover:bg-ocean-medium dark:hover:bg-ocean-deep/80 text-ocean-text dark:text-ocean-text-dark font-semibold rounded-lg transition-all duration-300"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
