import { InventoryManager } from '@/components/InventoryManager'

export function Inventory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">
          Track medical supplies, equipment, and medications
        </p>
      </div>
      <InventoryManager />
    </div>
  )
}
