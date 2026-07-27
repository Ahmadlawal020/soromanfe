import { useState, useEffect } from 'react'
import { useAdminList, useDeleteAdmin } from '#/lib/hooks/useAdmin'
import { useToast } from '#/lib/hooks/useToast'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import {
  Users,
  Plus,
  Search,
  UserX,
  Mail,
  Phone,
  X,
  SearchX,
  Edit,
  Trash2,
  MoreHorizontal,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  ROLE_LABELS,
  ROLE_GROUPS,
  roleColorMap,
  statesList,
  type StaffMember,
} from './-roles'

export {
  ROLES,
  ROLE_LABELS,
  roleColorMap,
  statesList,
  type StaffMember,
} from './-roles'
export { Roles, ALL_ROLES, ROLE_GROUPS, LOCATION_CHOICES, type LocationChoice, type PfiOption, pfisList, getCurrentUserRoles } from './-roles'

export const Route = createFileRoute('/admin/')({
  component: StaffManagement,
})

function getStatusBadge(suspended: boolean) {
  if (suspended) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 w-fit font-normal">
        <AlertCircle className="w-3 h-3" />
        Suspended
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1 w-fit font-normal">
      <CheckCircle2 className="w-3 h-3" />
      Active
    </Badge>
  )
}

function getInitials(full_name: string) {
  const parts = full_name.trim().split(' ')
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

function userRoleList(user: StaffMember): number[] {
  return user.roles && user.roles.length > 0 ? user.roles : [user.role]
}

function StaffManagement() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: admins = [], isLoading } = useAdminList()
  const deleteAdmin = useDeleteAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedLocation, roleFilter])

  const filteredStaff = admins
    .filter((staff) => {
      const matchesSearch =
        (staff.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staff.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLocation =
        selectedLocation === 'all' || staff.location === selectedLocation
      const matchesRole =
        roleFilter === 'all' ||
        (() => {
          const group = ROLE_GROUPS.find(g => g.label === roleFilter)
          if (group) {
            return group.roles.some(r => userRoleList(staff).includes(r))
          }
          return userRoleList(staff).includes(Number(roleFilter))
        })()
      return matchesSearch && matchesLocation && matchesRole
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  const totalItems = filteredStaff.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const stats = {
    total: admins.length,
    active: admins.filter((s) => !s.suspended).length,
    suspended: admins.filter((s) => s.suspended).length,
    newThisMonth: admins.filter((s) => {
      const created = new Date(s.date_joined)
      const now = new Date()
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      )
    }).length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, and manage staff access across the dashboard.
          </p>
        </div>
        <Button
          size="sm"
          className="gradient-primary text-white border-0 shadow-sm hover:shadow transition-all"
          onClick={() => navigate({ to: '/admin/form' })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stats-card transition-all hover:border-primary/20">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card transition-all hover:border-emerald-500/20">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold tracking-tight text-emerald-600">{stats.active}</p>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {Math.round((stats.active / (stats.total || 1)) * 100)}%
            </Badge>
          </CardContent>
        </Card>

        <Card className="stats-card transition-all hover:border-destructive/20">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Suspended</p>
              <p className="text-2xl font-bold tracking-tight text-destructive">{stats.suspended}</p>
            </div>
            <div className="p-2.5 bg-destructive/10 rounded-xl text-destructive">
              <UserX className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card transition-all hover:border-amber-500/20">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">New This Month</p>
              <p className="text-2xl font-bold tracking-tight text-amber-600">{stats.newThisMonth}</p>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600">
              <Plus className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Staff Directory</CardTitle>
              <CardDescription className="text-xs">Browse and manage all system users</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 text-xs h-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] text-xs h-9" aria-label="Filter by role">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLE_GROUPS.map((group) => (
                      <SelectItem key={group.label} value={group.label}>{group.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full sm:w-[150px] text-xs h-9" aria-label="Filter by location">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {statesList.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading directory...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted border border-border mb-3">
                <SearchX size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No users found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchTerm(''); setSelectedLocation('all'); setRoleFilter('all') }}
                className="mt-4 text-xs text-primary"
              >
                <X size={12} className="mr-1" />
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-12 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="hidden md:table-cell text-xs">Contact</TableHead>
                      <TableHead className="hidden lg:table-cell text-xs">Location</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-right w-10 text-xs"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStaff.map((staff, idx) => {
                      const userRoles = userRoleList(staff)
                      return (
                        <TableRow
                          key={staff.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate({ to: '/admin/details' as any, state: { staff } as any })}
                        >
                          <TableCell className="text-muted-foreground text-center text-xs font-mono">
                            {((currentPage - 1) * pageSize) + idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 ring-2 ring-primary/5">
                                {getInitials(staff.full_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{staff.full_name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{staff.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <a
                              href={`mailto:${staff.email}`}
                              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail size={12} className="shrink-0" />
                              <span className="truncate max-w-[160px]">{staff.email}</span>
                            </a>
                            {staff.phone_number && (
                              <a
                                href={`tel:${staff.phone_number}`}
                                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors mt-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone size={11} className="shrink-0" />
                                {staff.phone_number}
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-foreground">
                            {staff.location_names?.length
                              ? staff.location_names.join(', ')
                              : <span className="text-muted-foreground inline-flex items-center gap-1 text-xs"><Globe size={11} /> Full Access</span>
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userRoles.slice(0, 2).map((r) => {
                                const customStyle = roleColorMap?.[r]
                                return (
                                  <Badge
                                    key={r}
                                    variant="outline"
                                    className={`text-[10px] px-2 py-0.5 font-normal ${customStyle || ''}`}
                                  >
                                    {ROLE_LABELS[r]}
                                  </Badge>
                                )
                              })}
                              {userRoles.length > 2 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-normal">
                                  +{userRoles.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(staff.suspended)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  navigate({ to: '/admin/form', state: { staff, isEdit: true } as any })
                                }}>
                                  <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async (e) => {
                                  e.stopPropagation()
                                  if (confirm('Are you sure you want to delete this user?')) {
                                    try {
                                      await deleteAdmin.mutateAsync(String(staff.id))
                                    } catch {
                                      toast.error('Failed to delete user. Please try again.')
                                    }
                                  }
                                }}>
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/60 bg-muted/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(val) => {
                      setPageSize(Number(val))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[65px] text-xs">
                      <SelectValue placeholder={pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground ml-2">
                    Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                  </p>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-2.5"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
                        return (
                          <div key={p} className="flex items-center">
                            {showEllipsis && <span className="px-1.5 text-xs text-muted-foreground">...</span>}
                            <Button
                              variant={currentPage === p ? 'default' : 'outline'}
                              size="sm"
                              className={`h-8 w-8 text-xs p-0 ${currentPage === p ? 'gradient-primary text-white border-0' : ''}`}
                              onClick={() => setCurrentPage(p)}
                            >
                              {p}
                            </Button>
                          </div>
                        )
                      })}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-2.5"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}