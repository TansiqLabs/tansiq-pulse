import { contextBridge, ipcRenderer } from 'electron'

// Type definitions for the exposed API
export interface ElectronAPI {
  // Dashboard
  dashboard: {
    getStats: () => Promise<any>
    getRevenueChart: () => Promise<any>
    getRecentActivity: () => Promise<any>
  }
  // Patients
  patients: {
    getAll: () => Promise<any[]>
    getById: (id: number) => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: number, data: any) => Promise<any>
    delete: (id: number) => Promise<any>
    search: (query: string) => Promise<any[]>
  }
  // Doctors
  doctors: {
    getAll: () => Promise<any[]>
    getById: (id: number) => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: number, data: any) => Promise<any>
    delete: (id: number) => Promise<any>
  }
  // Appointments
  appointments: {
    getAll: () => Promise<any[]>
    getByDate: (date: string) => Promise<any[]>
    getToday: () => Promise<any[]>
    create: (data: any) => Promise<any>
    update: (id: number, data: any) => Promise<any>
    updateStatus: (id: number, status: string) => Promise<any>
    cancel: (id: number) => Promise<any>
  }
  // Services
  services: {
    getAll: () => Promise<any[]>
    create: (data: any) => Promise<any>
    update: (id: number, data: any) => Promise<any>
    delete: (id: number) => Promise<any>
  }
  // Invoices
  invoices: {
    getAll: () => Promise<any[]>
    getById: (id: number) => Promise<any>
    create: (data: any) => Promise<any>
    addPayment: (invoiceId: number, payment: any) => Promise<any>
    cancel: (id: number) => Promise<any>
  }
  // Settings
  settings: {
    get: () => Promise<Record<string, any>>
    update: (key: string, value: any) => Promise<any>
  }
}

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Dashboard
  dashboard: {
    getStats: () => ipcRenderer.invoke('dashboard:getStats'),
    getRevenueChart: () => ipcRenderer.invoke('dashboard:getRevenueChart'),
    getRecentActivity: () => ipcRenderer.invoke('dashboard:getRecentActivity'),
  },
  
  // Patients
  patients: {
    getAll: () => ipcRenderer.invoke('patients:getAll'),
    getById: (id: number) => ipcRenderer.invoke('patients:getById', id),
    create: (data: any) => ipcRenderer.invoke('patients:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('patients:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('patients:delete', id),
    search: (query: string) => ipcRenderer.invoke('patients:search', query),
  },
  
  // Doctors
  doctors: {
    getAll: () => ipcRenderer.invoke('doctors:getAll'),
    getById: (id: number) => ipcRenderer.invoke('doctors:getById', id),
    create: (data: any) => ipcRenderer.invoke('doctors:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('doctors:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('doctors:delete', id),
  },
  
  // Appointments
  appointments: {
    getAll: () => ipcRenderer.invoke('appointments:getAll'),
    getByDate: (date: string) => ipcRenderer.invoke('appointments:getByDate', date),
    getToday: () => ipcRenderer.invoke('appointments:getToday'),
    create: (data: any) => ipcRenderer.invoke('appointments:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('appointments:update', { id, data }),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('appointments:updateStatus', { id, status }),
    cancel: (id: number) => ipcRenderer.invoke('appointments:cancel', id),
  },
  
  // Services
  services: {
    getAll: () => ipcRenderer.invoke('services:getAll'),
    create: (data: any) => ipcRenderer.invoke('services:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('services:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('services:delete', id),
  },
  
  // Invoices
  invoices: {
    getAll: () => ipcRenderer.invoke('invoices:getAll'),
    getById: (id: number) => ipcRenderer.invoke('invoices:getById', id),
    create: (data: any) => ipcRenderer.invoke('invoices:create', data),
    addPayment: (invoiceId: number, payment: any) => ipcRenderer.invoke('invoices:addPayment', { invoiceId, payment }),
    cancel: (id: number) => ipcRenderer.invoke('invoices:cancel', id),
  },
  
  // Settings
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (key: string, value: any) => ipcRenderer.invoke('settings:update', { key, value }),
  },

  // Auto-updater
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    downloadUpdate: () => ipcRenderer.invoke('updater:download'),
    installUpdate: () => ipcRenderer.invoke('updater:install'),
    onUpdateAvailable: (callback: (event: any, info: any) => void) => 
      ipcRenderer.on('update-available', callback),
    onUpdateNotAvailable: (callback: () => void) => 
      ipcRenderer.on('update-not-available', callback),
    onDownloadProgress: (callback: (event: any, progress: any) => void) => 
      ipcRenderer.on('download-progress', callback),
    onUpdateDownloaded: (callback: (event: any, info: any) => void) => 
      ipcRenderer.on('update-downloaded', callback),
    onUpdateError: (callback: (event: any, error: string) => void) => 
      ipcRenderer.on('update-error', callback),
  },

  // Shell (for opening external links)
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
})

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
