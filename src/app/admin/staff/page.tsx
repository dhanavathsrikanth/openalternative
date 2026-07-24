import { StaffManager } from './StaffManager'

export default function AdminStaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Staff Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage platform staff access. Users listed below are those who have signed in via Clerk.
        </p>
      </div>
      <StaffManager />
    </div>
  )
}
