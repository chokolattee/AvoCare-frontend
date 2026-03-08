import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import { styles } from '../../Styles/UsersScreen.styles';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: string;
  created_at?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FILTER_TYPES = ['All', 'Active', 'Inactive', 'Admin'] as const;

const DEACTIVATION_REASONS = [
  'Violation of Terms of Service',
  'Suspicious or fraudulent activity',
  'Inactive / Unused account',
  'User requested account removal',
  'Other',
] as const;

// ─── Status / Role badge colors ───────────────────────────────────────────────
function statusColors(status: string): { bg: string; text: string } {
  if (status === 'active')      return { bg: '#ECFDF5', text: '#10b981' };
  if (status === 'deactivated') return { bg: '#FEF2F2', text: '#ef4444' };
  return { bg: '#FFF8E6', text: '#f59e0b' };
}

function roleColors(role: string): { bg: string; text: string } {
  if (role === 'admin') return { bg: '#EDE9FE', text: '#7c3aed' };
  return { bg: '#E8F0DF', text: '#4A7C2F' };
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
function exportToPDF(users: User[]) {
  if (Platform.OS !== 'web') return;

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const rows = users.map((u, i) => {
    const sc = statusColors(u.status);
    const rc = roleColors(u.role);
    return `
      <tr style="background:${i % 2 === 0 ? '#F9FCF6' : '#fff'}">
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>
          <span style="background:${rc.bg};color:${rc.text};padding:2px 10px;border-radius:8px;font-size:11px;font-weight:700;text-transform:uppercase;">
            ${u.role}
          </span>
        </td>
        <td>
          <span style="background:${sc.bg};color:${sc.text};padding:2px 10px;border-radius:8px;font-size:11px;font-weight:700;text-transform:uppercase;">
            ${u.status}
          </span>
        </td>
        <td>${formatDate(u.created_at)}</td>
      </tr>
    `;
  }).join('');

  const activeCount = users.filter((u) => u.status === 'active').length;
  const adminCount  = users.filter((u) => u.role === 'admin').length;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>AvoCare – Users Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#F5FAF0; color:#2D5016; padding:32px; }
        .header { background:#2D5016; color:#fff; border-radius:14px; padding:28px 32px; margin-bottom:28px; }
        .header h1 { font-size:26px; font-weight:800; letter-spacing:-0.5px; }
        .header p  { font-size:12px; color:#8DB87A; margin-top:4px; letter-spacing:1.5px; text-transform:uppercase; }
        .meta { display:flex; gap:24px; margin-top:16px; }
        .meta-item { background:rgba(255,255,255,0.12); border-radius:8px; padding:8px 16px; }
        .meta-item .num { display:block; font-size:20px; font-weight:800; }
        .meta-item .lbl { display:block; font-size:10px; color:#8DB87A; }
        table { width:100%; border-collapse:collapse; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(45,80,22,0.08); }
        thead tr { background:#2D5016; }
        thead th { color:#8DB87A; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:12px 14px; text-align:left; }
        tbody td { padding:11px 14px; font-size:13px; color:#2D5016; border-bottom:1px solid #E8F0DF; }
        .footer { margin-top:20px; text-align:right; font-size:11px; color:#6A8A50; }
      </style>
    </head>
    <body>
      <div class="header">
        <p>AvoCare Admin</p>
        <h1>Users Report</h1>
        <div class="meta">
          <div class="meta-item"><span class="num">${users.length}</span><span class="lbl">Total Users</span></div>
          <div class="meta-item"><span class="num">${activeCount}</span><span class="lbl">Active</span></div>
          <div class="meta-item"><span class="num">${adminCount}</span><span class="lbl">Admins</span></div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </body>
    </html>
  `;

  const blob   = new Blob([html], { type: 'text/html' });
  const url    = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 2000);
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
const UsersScreen = () => {
  const [searchQuery, setSearchQuery]           = useState('');
  const [refreshing, setRefreshing]             = useState(false);
  const [dimensions, setDimensions]             = useState(Dimensions.get('window'));
  const [users, setUsers]                       = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers]       = useState<User[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedUser, setSelectedUser]         = useState<User | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRole, setEditRole]                 = useState('user');
  const [editStatus, setEditStatus]             = useState('active');
  const [filterType, setFilterType]             = useState('All');
  const [updating, setUpdating]                 = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [otherReason, setOtherReason]           = useState('');

  const { width } = dimensions;
  const isDesktop = width >= 768;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { filterUsers(); }, [searchQuery, users, filterType]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      if (!token) { Alert.alert('Error', 'Authentication required'); return; }

      const response = await fetch(`${API_BASE_URL}/api/users/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (filterType === 'Active')   filtered = filtered.filter((u) => u.status === 'active');
    if (filterType === 'Inactive') filtered = filtered.filter((u) => u.status !== 'active');
    if (filterType === 'Admin')    filtered = filtered.filter((u) => u.role === 'admin');
    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  // ─── Edit modal ───────────────────────────────────────────────────────────
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
    setDeactivationReason('');
    setOtherReason('');
    setEditModalVisible(true);
  };

  const updateUser = async () => {
    if (!selectedUser) return;
    if (editStatus === 'deactivated') {
      if (!deactivationReason) {
        Alert.alert('Required', 'Please select a reason for deactivation.');
        return;
      }
      if (deactivationReason === 'Other' && !otherReason.trim()) {
        Alert.alert('Required', 'Please describe the reason for deactivation.');
        return;
      }
    }
    const finalReason = editStatus === 'deactivated'
      ? (deactivationReason === 'Other' ? otherReason.trim() : deactivationReason)
      : undefined;
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          role: editRole,
          status: editStatus,
          ...(finalReason !== undefined && { deactivation_reason: finalReason }),
        }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'User updated successfully');
        setEditModalVisible(false);
        fetchUsers();
      } else {
        Alert.alert('Error', data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const activeCount   = users.filter((u) => u.status === 'active').length;
  const inactiveCount = users.filter((u) => u.status !== 'active').length;
  const adminCount    = users.filter((u) => u.role === 'admin').length;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
            <Text style={styles.headerTitle}>Users</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7C2F" />
          <Text style={styles.loadingText}>Loading users…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
          <Text style={styles.headerTitle}>Users</Text>
        </View>
        <View style={styles.headerActions}>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={() => {
                if (filteredUsers.length === 0) { Alert.alert('No Data', 'No users to export.'); return; }
                exportToPDF(filteredUsers);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={14} color="#fff" />
              <Text style={styles.pdfBtnText}>PDF</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
            {refreshing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="refresh" size={20} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Bar ── */}
      <View style={styles.statsBar}>
        {[
          { num: users.length,  label: 'Total',    color: '#2D5016' },
          { num: activeCount,   label: 'Active',   color: '#10b981' },
          { num: inactiveCount, label: 'Inactive', color: '#f59e0b' },
          { num: adminCount,    label: 'Admins',   color: '#7c3aed' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A7C2F']} tintColor="#4A7C2F" />
        }
      >

        {/* ── Search ── */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#6A8A50" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email…"
            placeholderTextColor="#A0B89A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#A0B89A" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_TYPES.map((type) => {
            const count =
              type === 'All'      ? users.length :
              type === 'Active'   ? activeCount :
              type === 'Inactive' ? inactiveCount :
              adminCount;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
                onPress={() => setFilterType(type)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
                  {type} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Empty State ── */}
        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 52 }}>👤</Text>
            <Text style={styles.emptyText}>No users found</Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ fontSize: 13, color: '#4A7C2F', fontWeight: '600', marginTop: 4 }}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Desktop Table ── */}
        {isDesktop && filteredUsers.length > 0 && (
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <View style={styles.colImage}><Text style={styles.tableHeaderText}>Avatar</Text></View>
              <View style={styles.colName}><Text style={styles.tableHeaderText}>Name</Text></View>
              <View style={styles.colEmail}><Text style={styles.tableHeaderText}>Email</Text></View>
              <View style={styles.colRole}><Text style={styles.tableHeaderText}>Role</Text></View>
              <View style={styles.colStatus}><Text style={styles.tableHeaderText}>Status</Text></View>
              <View style={styles.colActions}><Text style={styles.tableHeaderText}>Edit</Text></View>
            </View>

            {filteredUsers.map((user, index) => {
              const sc = statusColors(user.status);
              const rc = roleColors(user.role);
              return (
                <View key={user.id} style={[styles.tableRow, index % 2 !== 0 && styles.tableRowEven]}>
                  {/* Avatar */}
                  <View style={styles.colImage}>
                    {user.image ? (
                      <Image source={{ uri: user.image }} style={styles.userImageTable} />
                    ) : (
                      <View style={styles.userAvatarTable}>
                        <Text style={styles.userAvatarTextTable}>{user.name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>

                  {/* Name */}
                  <View style={styles.colName}>
                    <Text style={[styles.tableCell, { fontWeight: '700' }]} numberOfLines={1}>{user.name}</Text>
                  </View>

                  {/* Email */}
                  <View style={styles.colEmail}>
                    <Text style={[styles.tableCell, { color: '#6A8A50', fontSize: 12 }]} numberOfLines={1}>{user.email}</Text>
                  </View>

                  {/* Role */}
                  <View style={styles.colRole}>
                    <View style={[styles.roleBadgeTable, { backgroundColor: rc.bg }]}>
                      <Text style={[styles.roleBadgeTextTable, { color: rc.text }]}>{user.role.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Status */}
                  <View style={styles.colStatus}>
                    <View style={[styles.statusBadgeTable, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.statusTextTable, { color: sc.text }]}>{user.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.colActions}>
                    <TouchableOpacity style={styles.editButtonTable} onPress={() => openEditModal(user)}>
                      <Ionicons name="create-outline" size={15} color="#4A7C2F" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Mobile Card View ── */}
        {!isDesktop && filteredUsers.length > 0 && (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => {
              const sc = statusColors(user.status);
              const rc = roleColors(user.role);
              return (
                <View key={user.id} style={styles.userCard}>
                  {user.image ? (
                    <Image source={{ uri: user.image }} style={styles.userImage} />
                  ) : (
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userMeta}>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusText, { color: sc.text }]}>{user.status}</Text>
                      </View>
                      <View style={{ backgroundColor: rc.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={[styles.roleBadge, { color: rc.text, backgroundColor: 'transparent' }]}>{user.role}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.moreButton} onPress={() => openEditModal(user)}>
                    <Ionicons name="create-outline" size={16} color="#4A7C2F" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* ── Edit Modal ── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDesktop && styles.modalContainerDesktop]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color="#2D5016" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* User banner */}
                <View style={styles.userInfoModal}>
                  {selectedUser.image ? (
                    <Image source={{ uri: selectedUser.image }} style={styles.userImageModal} />
                  ) : (
                    <View style={styles.userAvatarModal}>
                      <Text style={styles.userAvatarTextModal}>{selectedUser.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userNameModal}>{selectedUser.name}</Text>
                    <Text style={styles.userEmailModal}>{selectedUser.email}</Text>
                  </View>
                </View>

                {/* Role */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Role</Text>
                  <View style={styles.radioGroup}>
                    {['user', 'admin'].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.radioOption, editRole === r && styles.radioOptionSelected]}
                        onPress={() => setEditRole(r)}
                      >
                        <View style={[styles.radio, editRole === r && styles.radioSelected]}>
                          {editRole === r && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.radioLabel}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Status */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.radioGroup}>
                    {['active', 'inactive', 'deactivated'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.radioOption, editStatus === s && styles.radioOptionSelected]}
                        onPress={() => {
                          setEditStatus(s);
                          if (s !== 'deactivated') {
                            setDeactivationReason('');
                            setOtherReason('');
                          }
                        }}
                      >
                        <View style={[styles.radio, editStatus === s && styles.radioSelected]}>
                          {editStatus === s && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.radioLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Deactivation Reason */}
                {editStatus === 'deactivated' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Reason for Deactivation</Text>
                    <View style={styles.radioGroupVertical}>
                      {DEACTIVATION_REASONS.map((reason) => (
                        <TouchableOpacity
                          key={reason}
                          style={[styles.radioOption, styles.radioOptionFull, deactivationReason === reason && styles.radioOptionSelected]}
                          onPress={() => setDeactivationReason(reason)}
                        >
                          <View style={[styles.radio, deactivationReason === reason && styles.radioSelected]}>
                            {deactivationReason === reason && <View style={styles.radioDot} />}
                          </View>
                          <Text style={styles.radioLabel}>{reason}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {deactivationReason === 'Other' && (
                      <View style={styles.reasonInputContainer}>
                        <TextInput
                          style={styles.reasonInput}
                          placeholder="Describe the reason…"
                          placeholderTextColor="#A0B89A"
                          value={otherReason}
                          onChangeText={setOtherReason}
                          multiline
                          numberOfLines={3}
                          maxLength={300}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={updateUser} disabled={updating}>
                    {updating
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.saveButtonText}>Save Changes</Text>
                    }
                  </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default UsersScreen;