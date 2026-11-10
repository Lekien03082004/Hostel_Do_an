import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  KeyRound,
  X,
  User as UserIcon,
  Briefcase,
} from 'lucide-react';
import { staffApi, branchesApi } from '../api';
import type { SystemUser, Branch } from '../types';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'receptionist' | 'manager' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    full_name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'user', // Default: User thường
    branch_id: '',
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'user',
    branch_id: '',
    password: '',
    is_active: true,
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch users & branches from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [usersRes, branchesRes] = await Promise.all([
        staffApi.getUsers(),
        branchesApi.getAll(),
      ]);

      const usersData = Array.isArray(usersRes.data)
        ? usersRes.data
        : (usersRes.data as any).results || [];
      const branchesData = Array.isArray(branchesRes.data)
        ? branchesRes.data
        : (branchesRes.data as any).results || [];

      setUsers(usersData);
      setBranches(branchesData);
    } catch (err: any) {
      setError('Không thể tải danh sách tài khoản người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all') {
        if (roleFilter === 'admin') {
          if (!u.is_superuser && u.role_code !== 'admin') return false;
        } else if (u.role_code !== roleFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'inactive' && u.is_active) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchUsername = u.username.toLowerCase().includes(query);
        const matchFullName = u.full_name?.toLowerCase().includes(query);
        const matchEmail = u.email?.toLowerCase().includes(query);
        const matchPhone = u.phone?.toLowerCase().includes(query);
        const matchRole = u.role_name?.toLowerCase().includes(query);
        const matchBranch = u.branch_name?.toLowerCase().includes(query);
        if (!matchUsername && !matchFullName && !matchEmail && !matchPhone && !matchRole && !matchBranch) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  // Metric counts
  const metrics = useMemo(() => {
    const total = users.length;
    const regularUsers = users.filter((u) => u.role_code === 'user').length;
    const receptionists = users.filter((u) => u.role_code === 'receptionist').length;
    const managers = users.filter((u) => u.role_code === 'manager').length;
    const admins = users.filter((u) => u.is_superuser || u.role_code === 'admin').length;
    return { total, regularUsers, receptionists, managers, admins };
  }, [users]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setAddForm({
      full_name: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      role: 'user', // Default to regular user
      branch_id: branches.length > 0 ? String(branches[0].id) : '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: SystemUser) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role_code || (user.is_superuser ? 'admin' : 'user'),
      branch_id: user.branch_id ? String(user.branch_id) : '',
      password: '',
      is_active: user.is_active,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Submit Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!addForm.username.trim() || !addForm.password || !addForm.full_name.trim()) {
      setFormError('Vui lòng điền Họ tên, Tên đăng nhập và Mật khẩu.');
      return;
    }

    if (addForm.password.length < 6) {
      setFormError('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    try {
      setFormSubmitting(true);
      await staffApi.createUser({
        username: addForm.username.trim(),
        password: addForm.password,
        full_name: addForm.full_name.trim(),
        email: addForm.email.trim() || undefined,
        phone: addForm.phone.trim() || undefined,
        role: addForm.role,
        branch_id: addForm.role === 'user' || addForm.role === 'admin' ? null : (addForm.branch_id || null),
      });

      setSuccessMsg(`Đã tạo thành công tài khoản @${addForm.username.trim()}!`);
      setIsAddModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      if (err.response?.data?.username) {
        setFormError(err.response.data.username[0]);
      } else if (err.response?.data?.detail) {
        setFormError(err.response.data.detail);
      } else {
        setFormError('Không thể tạo người dùng. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError('');

    try {
      setFormSubmitting(true);
      const payload: any = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim() || '',
        phone: editForm.phone.trim() || '',
        role: editForm.role,
        branch_id: editForm.role === 'user' || editForm.role === 'admin' ? null : (editForm.branch_id || null),
        is_active: editForm.is_active,
      };

      if (editForm.password.trim()) {
        if (editForm.password.length < 6) {
          setFormError('Mật khẩu mới phải từ 6 ký tự trở lên.');
          setFormSubmitting(false);
          return;
        }
        payload.password = editForm.password.trim();
      }

      await staffApi.patchUser(selectedUser.id, payload);
      setSuccessMsg(`Đã cập nhật thông tin tài khoản @${selectedUser.username}!`);
      setIsEditModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setFormError(err.response.data.detail);
      } else {
        setFormError('Có lỗi xảy ra khi cập nhật tài khoản.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      alert('Bạn không thể tự khóa tài khoản đang đăng nhập.');
      return;
    }

    try {
      await staffApi.patchUser(user.id, {
        is_active: !user.is_active,
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể thay đổi trạng thái tài khoản.');
    }
  };

  // Delete user
  const handleDeleteUser = async (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      alert('Bạn không thể tự xóa tài khoản đang đăng nhập của mình.');
      return;
    }

    if (user.is_superuser) {
      alert('Không thể xóa tài khoản Quản trị viên tối cao (Superuser).');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn tài khoản "@${user.username}" (${user.full_name})?`)) {
      return;
    }

    try {
      await staffApi.deleteUser(user.id);
      setSuccessMsg(`Đã xóa tài khoản @${user.username}.`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể xóa tài khoản người dùng.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
            Quản lý Người dùng & Tài khoản
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-light mt-1">
            Phân quyền tài khoản hệ thống: User thường, Lễ tân cơ sở, Quản lý chi nhánh và Quản trị viên.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-stone-800 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 text-amber-300" />
          <span>Thêm người dùng</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Metric Summary Cards (5 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Users */}
        <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tổng tài khoản</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold text-stone-900">{metrics.total}</span>
            <span className="text-[10px] text-stone-400 font-light">user</span>
          </div>
        </div>

        {/* Regular Users */}
        <div className="rounded-2xl border border-amber-200/90 bg-[#FDFBF7] p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">User thường</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-800">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold text-amber-900">{metrics.regularUsers}</span>
            <span className="text-[10px] text-amber-700/70 font-light">khách hàng</span>
          </div>
        </div>

        {/* Receptionists */}
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/30 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Lễ tân</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold text-emerald-900">{metrics.receptionists}</span>
            <span className="text-[10px] text-emerald-700/70 font-light">nhân sự</span>
          </div>
        </div>

        {/* Branch Managers */}
        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/30 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">QL chi nhánh</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold text-blue-900">{metrics.managers}</span>
            <span className="text-[10px] text-blue-700/70 font-light">quản lý</span>
          </div>
        </div>

        {/* Admins */}
        <div className="rounded-2xl border border-purple-200/90 bg-purple-50/30 p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Quản trị viên</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold text-purple-900">{metrics.admins}</span>
            <span className="text-[10px] text-purple-700/70 font-light">admin</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl bg-white p-4 border border-[#E3DDD2] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên đăng nhập, họ tên, email, SĐT, chi nhánh..."
              className="w-full rounded-xl bg-[#F8F6F2] py-2 pl-9 pr-4 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 border border-transparent focus:border-stone-400"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center rounded-xl bg-[#F0ECE1] p-1 border border-stone-200 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === 'all'
                  ? 'bg-stone-950 text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tất cả ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('user')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === 'user'
                  ? 'bg-stone-950 text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              User thường ({metrics.regularUsers})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('receptionist')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === 'receptionist'
                  ? 'bg-stone-950 text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Lễ tân ({metrics.receptionists})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('manager')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === 'manager'
                  ? 'bg-stone-950 text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              QL chi nhánh ({metrics.managers})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === 'admin'
                  ? 'bg-stone-950 text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Admin ({metrics.admins})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 font-medium text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã tạm khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
            <span className="text-xs font-medium text-stone-500">Đang tải danh sách người dùng...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800">
          {error}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#DDD5C7] bg-white p-16 text-center">
          <Users className="mx-auto h-12 w-12 text-stone-400 mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-800">Không tìm thấy người dùng</h3>
          <p className="mt-1 text-xs text-stone-500 font-light">
            Không có tài khoản nào khớp với tiêu chí tìm kiếm hoặc bộ lọc vai trò hiện tại.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E3DDD2] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-[#E3DDD2] bg-[#FAF8F5] text-stone-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Tài khoản & Họ tên</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Vai trò / Chức vụ</th>
                  <th className="py-3.5 px-4">Chi nhánh phụ trách</th>
                  <th className="py-3.5 px-4">Ngày đăng ký</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isSuper = u.is_superuser;
                  const roleCode = u.role_code || (isSuper ? 'admin' : 'user');

                  return (
                    <tr key={u.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      {/* Avatar & User Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-serif font-bold text-sm border shadow-xs ${
                            roleCode === 'admin'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : roleCode === 'manager'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : roleCode === 'receptionist'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            {u.full_name ? u.full_name[0].toUpperCase() : u.username[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900 truncate">
                                {u.full_name || u.username}
                              </span>
                              {isCurrent && (
                                <span className="rounded-md bg-stone-900 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                                  BẠN
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-500 block truncate">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {u.email ? (
                            <div className="flex items-center gap-1.5 text-stone-700">
                              <Mail className="h-3 w-3 text-stone-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{u.email}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic text-[11px]">Chưa có email</span>
                          )}

                          {u.phone ? (
                            <div className="flex items-center gap-1.5 text-stone-700">
                              <Phone className="h-3 w-3 text-stone-400 shrink-0" />
                              <span>{u.phone}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic text-[11px] block">Chưa có SĐT</span>
                          )}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {roleCode === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-400/40 px-2.5 py-1 text-[11px] font-bold text-purple-900">
                            <ShieldAlert className="h-3 w-3 text-purple-700" />
                            Quản trị viên (Admin)
                          </span>
                        ) : roleCode === 'manager' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-400/40 px-2.5 py-1 text-[11px] font-bold text-blue-900">
                            <Briefcase className="h-3 w-3 text-blue-700" />
                            Quản lý chi nhánh
                          </span>
                        ) : roleCode === 'receptionist' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 px-2.5 py-1 text-[11px] font-bold text-emerald-900">
                            <Building2 className="h-3 w-3 text-emerald-700" />
                            Lễ tân
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                            <UserIcon className="h-3 w-3 text-amber-700" />
                            User thường
                          </span>
                        )}
                      </td>

                      {/* Branch Phụ Trách */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-medium ${u.branch_name && u.branch_name !== '—' ? 'text-stone-800' : 'text-stone-400 italic'}`}>
                          {u.branch_name || '—'}
                        </span>
                      </td>

                      {/* Date Joined */}
                      <td className="py-3.5 px-4">
                        <span className="text-stone-600 text-[11px]">
                          {u.date_joined ? new Date(u.date_joined).toLocaleDateString('vi-VN') : '—'}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => handleToggleActive(u)}
                          title={isCurrent ? 'Không thể khóa tài khoản của chính bạn' : 'Bấm để đổi trạng thái'}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                            u.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          } ${isCurrent ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          {u.is_active ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-stone-500" />
                              <span>Tạm khóa</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-all cursor-pointer"
                            title="Chỉnh sửa thông tin & phân quyền"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isCurrent || isSuper}
                            onClick={() => handleDeleteUser(u)}
                            className={`rounded-lg p-1.5 transition-all ${
                              isCurrent || isSuper
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer'
                            }`}
                            title={
                              isCurrent
                                ? 'Không thể xóa chính mình'
                                : isSuper
                                ? 'Không thể xóa Super Admin'
                                : 'Xóa tài khoản'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-5">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Thêm Người Dùng Mới
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Tạo tài khoản người dùng: User thường, Lễ tân, Quản lý chi nhánh hoặc Quản trị viên.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: nguyenvana"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Vai trò phân quyền <span className="text-amber-800 font-bold">(Mặc định: User thường)</span>
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-stone-900 bg-[#FDFBF7]"
                >
                  <option value="user">👤 User thường (Khách hàng thành viên)</option>
                  <option value="receptionist">🛎️ Lễ tân (Tiếp đón & phục vụ khách)</option>
                  <option value="manager">👔 Quản lý chi nhánh (Quản lý điều hành cơ sở)</option>
                  <option value="admin">🛡️ Quản trị viên (Toàn quyền quản trị Admin)</option>
                </select>
              </div>

              {/* Branch selection if receptionist or manager */}
              {(addForm.role === 'receptionist' || addForm.role === 'manager') && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Chi nhánh trực thuộc / Phụ trách <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addForm.branch_id}
                    onChange={(e) => setAddForm({ ...addForm, branch_id: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900 bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-stone-800 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />}
                  <span>Tạo người dùng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER & ROLE */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-5">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Chỉnh Sửa Tài Khoản @{selectedUser.username}
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Cập nhật họ tên, phân quyền vai trò, cơ sở làm việc hoặc đặt lại mật khẩu mới.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Vai trò phân quyền
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  disabled={selectedUser.is_superuser}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-stone-900 bg-[#FDFBF7] disabled:opacity-60"
                >
                  <option value="user">👤 User thường (Khách hàng thành viên)</option>
                  <option value="receptionist">🛎️ Lễ tân (Tiếp đón & phục vụ khách)</option>
                  <option value="manager">👔 Quản lý chi nhánh (Quản lý điều hành cơ sở)</option>
                  <option value="admin">🛡️ Quản trị viên (Toàn quyền quản trị Admin)</option>
                </select>
                {selectedUser.is_superuser && (
                  <p className="mt-1 text-[11px] text-amber-700 font-medium">
                    Tài khoản Superuser không thể hạ cấp vai trò.
                  </p>
                )}
              </div>

              {/* Branch selection if receptionist or manager */}
              {(editForm.role === 'receptionist' || editForm.role === 'manager') && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Chi nhánh trực thuộc / Phụ trách
                  </label>
                  <select
                    value={editForm.branch_id}
                    onChange={(e) => setEditForm({ ...editForm, branch_id: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900 bg-white"
                  >
                    <option value="">— Chưa phân bổ chi nhánh —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Đổi mật khẩu mới (Bỏ trống nếu giữ nguyên)
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 h-4 w-4" />
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới nếu muốn đổi..."
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 py-2 pl-9 pr-3 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  disabled={selectedUser.id === currentUser?.id}
                  className="h-4 w-4 rounded-sm border-stone-300 text-stone-950 focus:ring-stone-900"
                />
                <label htmlFor="editIsActive" className="text-xs font-medium text-stone-700 cursor-pointer">
                  Tài khoản đang hoạt động (Bỏ chọn để tạm khóa đăng nhập)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-stone-800 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
