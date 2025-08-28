'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { formatDistanceToNow } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Validation schemas
const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional().transform(val => val?.trim() || undefined)
})

type ClientFormData = z.infer<typeof clientSchema>

export default function ClientsPage() {
  const clients = useQuery(api.clients.listAgentClients)
  const addClient = useMutation(api.clients.addClientAsAgent)
  const updateClient = useMutation(api.clients.updateClient)
  const removeClient = useMutation(api.clients.removeClient)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Id<'clients'> | null>(null)
  const [editingClient, setEditingClient] = useState<Id<'clients'> | null>(null)
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({})

  // Form for adding new client
  const addForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    }
  })

  // Form for inline editing
  const editForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    }
  })

  const handleAddClient = async (data: ClientFormData) => {
    try {
      await addClient(data)
      addForm.reset()
      setShowAddModal(false)
      toast.success('Client added successfully')
    } catch (error) {
      console.error('Error adding client:', error)
      toast.error(error instanceof Error ? error.message : 'Error adding client')
    }
  }

  const handleEditClient = async () => {
    if (!editingClient) return
    
    const isValid = await editForm.trigger()
    if (!isValid) {
      const errors = editForm.formState.errors
      setInlineErrors({
        [editingClient as string]: 
          errors.name?.message || 
          errors.email?.message || 
          'Please fix the errors above'
      })
      return
    }
    
    const data = editForm.getValues()
    try {
      await updateClient({
        clientId: editingClient,
        ...data
      })
      setEditingClient(null)
      setInlineErrors({})
      editForm.reset()
      toast.success('Client updated successfully')
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error(error instanceof Error ? error.message : 'Error updating client')
    }
  }

  const confirmDelete = async () => {
    if (!clientToDelete) return
    
    try {
      await removeClient({ clientId: clientToDelete })
      setShowDeleteModal(false)
      setClientToDelete(null)
      toast.success('Client removed successfully')
    } catch (error) {
      console.error('Error removing client:', error)
      toast.error(error instanceof Error ? error.message : 'Cannot remove client')
    }
  }

  const startEdit = (client: typeof clients extends Array<infer T> ? T : never) => {
    setEditingClient(client._id)
    setInlineErrors({})
    editForm.reset({
      name: client.user?.name || '',
      email: client.user?.email || '',
      phone: client.phone || ''
    })
  }

  const cancelEdit = () => {
    setEditingClient(null)
    setInlineErrors({})
    editForm.reset()
  }

  const openDeleteModal = (clientId: Id<'clients'>) => {
    setClientToDelete(clientId)
    setShowDeleteModal(true)
  }

  if (!clients) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const clientToDeleteInfo = clients.find(c => c._id === clientToDelete)

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-2 text-gray-600">Manage your client relationships</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
            <span>➕</span>
            <span>Add Client</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invites</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === 'invited').length}
              </p>
            </div>
            <div className="text-3xl">📧</div>
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Client List</h2>
        </div>
        
        {clients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-gray-600 mb-6">Add your first client to get started</p>
            <Button onClick={() => setShowAddModal(true)}>
              Add Your First Client
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {client.user?.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          {editingClient === client._id ? (
                            <div>
                              <Input
                                {...editForm.register('name')}
                                className="w-40"
                                placeholder="Name (required)"
                              />
                              {editForm.formState.errors.name && (
                                <p className="text-xs text-red-500 mt-1">
                                  {editForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-gray-900">
                              {client.user?.name || 'Unnamed Client'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingClient === client._id ? (
                        <div>
                          <Input
                            {...editForm.register('email')}
                            type="email"
                            className="w-48"
                            placeholder="Email (required)"
                          />
                          {editForm.formState.errors.email && (
                            <p className="text-xs text-red-500 mt-1">
                              {editForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {client.user?.email || 'No email'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingClient === client._id ? (
                        <Input
                          {...editForm.register('phone')}
                          type="tel"
                          className="w-36"
                          placeholder="Phone (optional)"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">
                          {client.phone || '—'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDistanceToNow(new Date(client.invitedAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingClient === client._id ? (
                        <div className="space-x-2">
                          {inlineErrors[client._id as string] && (
                            <p className="text-xs text-red-500 mb-2">
                              {inlineErrors[client._id as string]}
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleEditClient}
                            className="text-green-600 hover:text-green-900"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(client)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteModal(client._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the details of your new client. They&apos;ll receive an invitation to join the platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAddClient)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...addForm.register('name')}
                  placeholder="John Doe"
                />
                {addForm.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {addForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  {...addForm.register('email')}
                  type="email"
                  placeholder="john@example.com"
                />
                {addForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {addForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...addForm.register('phone')}
                  type="tel"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Client</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {clientToDeleteInfo?.user?.name || 'this client'}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteModal(false)
                setClientToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Remove Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}