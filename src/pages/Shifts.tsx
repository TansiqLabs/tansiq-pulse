import { ShiftManagement } from '@/components/ShiftManagement'

export function Shifts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shift Management</h1>
        <p className="text-muted-foreground">
          Schedule and manage staff shifts
        </p>
      </div>
      <ShiftManagement />
    </div>
  )
}
