import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { API_ENDPOINTS } from '@/constants/api'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import Pagination from '@/components/common/Pagination'
import { formatDate } from '@/utils/formatters'
import { AccountTypeLabel } from '@/constants/enums'

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => api.get(API_ENDPOINTS.ADMIN.USERS, { params: { page, pageSize: 15, search: search || undefined } }),
  })

  const users = data?.items || data?.data?.items || []
  const totalPages = data?.totalPages || data?.data?.totalPages || 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="form-input w-56"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Account Type', 'Role', 'Joined', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">{AccountTypeLabel[user.accountType]}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'Admin' ? 'danger' : 'default'}>{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isDeleted || user.isSuspended ? 'danger' : 'success'}>
                        {user.isDeleted ? 'Deleted' : user.isSuspended ? 'Suspended' : 'Active'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length && (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No users found</p>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
