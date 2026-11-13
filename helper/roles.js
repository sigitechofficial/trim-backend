// Roles in a branch (Step A): owner | manager | receptionist | barber.
// A role is a starting set of permission levels; the owner can still change
// any key for one person (employeeAccess rows), as today.
const ROLES = ['barber', 'manager', 'receptionist']

const LABELS = {
  appointments: 'Reschedule\nbookings',
  teamMember: 'Team member\nmanagement',
  bookAppointments: 'Can add\nbookings',
  applyDiscount: 'Can apply discounts',
  client: 'Customer information',
  services: 'Services',
  feedback: 'Customer\nfeedback',
  manageDeals: 'Coupons',
  updateProfile: 'Shop profile',
  sendNotification: 'Send\nnotifications',
  respondToEnquiries: 'Respond to\nEnquiries',
  bookingRequests: 'Booking requests',
  takings: 'Takings & reports',
  activityLog: 'Activity log',
}

// Starting levels by role (barbers start from the shop's defaults instead).
const PRESETS = {
  // Managers: everything in their branches except takings, which the owner
  // can switch on per person (design §5.4).
  manager: { ...Object.fromEntries(Object.keys(LABELS).map((k) => [k, 'high'])), takings: 'none', activityLog: 'low' },
  receptionist: {
    appointments: 'high',
    teamMember: 'none',
    bookAppointments: 'high',
    applyDiscount: 'low',
    client: 'low',
    services: 'none',
    feedback: 'low',
    manageDeals: 'none',
    updateProfile: 'none',
    sendNotification: 'low',
    respondToEnquiries: 'high',
    bookingRequests: 'high',
    takings: 'none',
    activityLog: 'none',
  },
}

const roleFrom = (value) => (ROLES.includes(value) ? value : 'barber')

// employeeAccess rows for a new person in this role, or [] for barbers.
function presetRows(role, employeeId) {
  const preset = PRESETS[role]
  if (!preset) return []
  return Object.entries(preset).map(([key, level]) => ({ employeeId, key, level, access: LABELS[key], status: true }))
}

module.exports = { ROLES, PRESETS, roleFrom, presetRows }
