import { BedManagement } from '@/components/BedManagement'

export function Beds() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bed Management</h1>
        <p className="text-muted-foreground">
          Manage hospital beds, assignments, and occupancy
        </p>
      </div>
      <BedManagement />
    </div>
  )
}
