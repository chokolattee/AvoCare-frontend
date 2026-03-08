import React, { useState, useEffect, useCallback } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import {
  getProducts,
  getCategories,
  createCategory,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
} from '../../Services/productApi';
import {
  Product,
  Category,
  NutritionEntry,
  ProductFormData,
  ProductStatus,
} from '../../Types/product';
import { styles } from '../../Styles/ProductScreen.styles';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: Array<'all' | ProductStatus> = ['all', 'active', 'draft', 'archived'];

const STATUS_COLORS: Record<ProductStatus, string> = {
  active:   '#10b981',
  draft:    '#f59e0b',
  archived: '#6b7280',
};

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  category: '',
  price: 0,
  stock: 0,
  images: [],
  nutrition: [],
  status: 'draft',
};

// ─── Platform-aware image appender ───────────────────────────────────────────
async function appendImageToFormData(
  formData: FormData,
  uri: string,
  index: number
): Promise<void> {
  const filename = `product_${Date.now()}_${index}.jpg`;
  if (Platform.OS === 'web') {
    const res  = await fetch(uri);
    const blob = await res.blob();
    formData.append('images', blob, filename);
  } else {
    formData.append('images', { uri, name: filename, type: 'image/jpeg' } as any);
  }
}

// ─── PDF Export (web only) ────────────────────────────────────────────────────
function exportToPDF(products: Product[]) {
  if (Platform.OS !== 'web') return;

  const rows = products.map((p, i) => `
    <tr style="background:${i % 2 === 0 ? '#F9FCF6' : '#fff'}">
      <td>${p.name}</td>
      <td>${p.category.name}</td>
      <td>₱${p.price.toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>
        <span style="
          background:${STATUS_COLORS[p.status]};
          color:#fff;
          padding:2px 10px;
          border-radius:12px;
          font-size:11px;
          font-weight:700;
          text-transform:uppercase;
        ">${p.status}</span>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>AvoCare – Products Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#F5FAF0; color:#2D5016; padding:32px; }
        .header { background:#2D5016; color:#fff; border-radius:14px; padding:28px 32px; margin-bottom:28px; }
        .header h1 { font-size:26px; font-weight:800; letter-spacing:-0.5px; }
        .header p  { font-size:12px; color:#8DB87A; margin-top:4px; letter-spacing:1.5px; text-transform:uppercase; }
        .meta { display:flex; gap:24px; margin-top:16px; }
        .meta-item { background:rgba(255,255,255,0.12); border-radius:8px; padding:8px 16px; }
        .meta-item span { display:block; }
        .meta-item .num { font-size:20px; font-weight:800; }
        .meta-item .lbl { font-size:10px; color:#8DB87A; }
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
        <h1>Products Report</h1>
        <div class="meta">
          <div class="meta-item">
            <span class="num">${products.length}</span>
            <span class="lbl">Total Products</span>
          </div>
          <div class="meta-item">
            <span class="num">${products.filter(p => p.status === 'active').length}</span>
            <span class="lbl">Active</span>
          </div>
          <div class="meta-item">
            <span class="num">${products.filter(p => p.status === 'draft').length}</span>
            <span class="lbl">Draft</span>
          </div>
          <div class="meta-item">
            <span class="num">${products.filter(p => p.status === 'archived').length}</span>
            <span class="lbl">Archived</span>
          </div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</div>
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
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 2000);
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProductScreen = () => {
  // ─── Layout ──────────────────────────────────────────────────────────────
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isDesktop = dimensions.width >= 768;

  // ─── Data ────────────────────────────────────────────────────────────────
  const [products, setProducts]                 = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories]             = useState<Category[]>([]);

  // ─── UI State ────────────────────────────────────────────────────────────
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating]     = useState(false);

  // ─── Filters ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState('');
  const [filterStatus, setFilterStatus]     = useState<'all' | ProductStatus>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // ─── Modals ──────────────────────────────────────────────────────────────
  const [modalVisible, setModalVisible]           = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreateModal, setShowCreateModal]     = useState(false);

  // ─── Form ────────────────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData]               = useState<ProductFormData>(EMPTY_FORM);

  const [quickForm, setQuickForm]       = useState<ProductFormData>({ ...EMPTY_FORM });
  const [quickImages, setQuickImages]   = useState<string[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // ─── Dimension listener ──────────────────────────────────────────────────
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [searchQuery, products, filterStatus, filterCategory]);

  // ─── Data fetching ───────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories()]);
    } catch (error) {
      console.error('fetchData error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const response = await getProducts();
    if (response.success && response.data) {
      setProducts(response.data);
    } else {
      Alert.alert('Error', response.message || 'Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    const response = await getCategories();
    if (response.success && response.data) {
      setCategories(response.data);
    } else {
      Alert.alert('Error', response.message || 'Failed to fetch categories');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // ─── Filtering ───────────────────────────────────────────────────────────
  const applyFilters = () => {
    let filtered = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') filtered = filtered.filter((p) => p.status === filterStatus);
    if (filterCategory !== 'all') filtered = filtered.filter((p) => p.category.id === filterCategory);
    setFilteredProducts(filtered);
  };

  // ─── Modal helpers ───────────────────────────────────────────────────────
  const openModal = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name:        product.name,
        description: product.description,
        category:    product.category.id,
        price:       product.price,
        stock:       product.stock,
        images:      product.images,
        nutrition:   product.nutrition,
        status:      product.status,
      });
    } else {
      setSelectedProduct(null);
      setFormData({ ...EMPTY_FORM, category: categories[0]?.id || '' });
    }
    setModalVisible(true);
  };

  const closeModal = () => { setModalVisible(false); setSelectedProduct(null); };

  const openQuickCreateModal = () => {
    setQuickForm({ ...EMPTY_FORM, category: categories[0]?.id || '' });
    setQuickImages([]);
    setQuickLoading(false);
    setShowCreateModal(true);
  };

  const closeQuickCreateModal = () => setShowCreateModal(false);

  // ─── Image picking ───────────────────────────────────────────────────────
  const pickImages = async (onPicked: (uris: string[]) => void, currentCount: number) => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Denied', 'Camera roll permission is required'); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });
      if (!result.canceled) onPicked(result.assets.map((a) => a.uri));
    } catch {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleImagePick = () =>
    pickImages((uris) => setFormData((p) => ({ ...p, images: [...p.images, ...uris].slice(0, 5) })), formData.images.length);

  const handleQuickImagePick = () =>
    pickImages((uris) => setQuickImages((p) => [...p, ...uris].slice(0, 5)), quickImages.length);

  const removeImage      = (i: number) => setFormData((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
  const removeQuickImage = (i: number) => setQuickImages((p) => p.filter((_, idx) => idx !== i));

  // ─── Nutrition ────────────────────────────────────────────────────────────
  const addNutritionEntry    = () => setFormData((p) => ({ ...p, nutrition: [...p.nutrition, { label: '', amount: '' }] }));
  const addQuickNutritionEntry = () => setQuickForm((p) => ({ ...p, nutrition: [...p.nutrition, { label: '', amount: '' }] }));

  const updateNutritionEntry = (i: number, f: 'label'|'amount', v: string) =>
    setFormData((p) => { const n = [...p.nutrition]; n[i] = { ...n[i], [f]: v }; return { ...p, nutrition: n }; });
  const updateQuickNutritionEntry = (i: number, f: 'label'|'amount', v: string) =>
    setQuickForm((p) => { const n = [...p.nutrition]; n[i] = { ...n[i], [f]: v }; return { ...p, nutrition: n }; });

  const removeNutritionEntry      = (i: number) => setFormData((p) => ({ ...p, nutrition: p.nutrition.filter((_, idx) => idx !== i) }));
  const removeQuickNutritionEntry = (i: number) => setQuickForm((p) => ({ ...p, nutrition: p.nutrition.filter((_, idx) => idx !== i) }));

  // ─── Category creation ───────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) { Alert.alert('Validation Error', 'Category name is required'); return; }
    setUpdating(true);
    try {
      const response = await createCategory(newCategoryName.trim());
      if (response.success && response.data) {
        await fetchCategories();
        setFormData((p) => ({ ...p, category: response.data!.id }));
        setShowCategoryModal(false);
        setNewCategoryName('');
        Alert.alert('Success', 'Category added');
      } else {
        Alert.alert('Error', response.message || 'Failed to add category');
      }
    } catch { Alert.alert('Error', 'Failed to add category'); }
    finally { setUpdating(false); }
  };

  // ─── Build FormData payload ───────────────────────────────────────────────
  const buildPayload = async (
    form: ProductFormData,
    localImageUris: string[],
    extraFields?: Record<string, string>
  ): Promise<FormData> => {
    const payload = new FormData();
    payload.append('name',        form.name.trim());
    payload.append('description', form.description.trim());
    payload.append('category',    form.category);
    payload.append('price',       form.price.toString());
    payload.append('stock',       form.stock.toString());
    payload.append('status',      form.status);
    payload.append('nutrition',   JSON.stringify(form.nutrition.filter((n) => n.label.trim() && n.amount.trim())));
    if (extraFields) Object.entries(extraFields).forEach(([k, v]) => payload.append(k, v));
    for (let i = 0; i < localImageUris.length; i++) await appendImageToFormData(payload, localImageUris[i], i);
    return payload;
  };

  // ─── Quick Create ─────────────────────────────────────────────────────────
  const handleQuickCreate = async () => {
    if (!quickForm.name.trim())    { Alert.alert('Validation Error', 'Product name is required'); return; }
    if (!quickForm.category)       { Alert.alert('Validation Error', 'Please select a category'); return; }
    if (quickForm.price <= 0)      { Alert.alert('Validation Error', 'Price must be greater than 0'); return; }
    if (quickForm.stock < 0)       { Alert.alert('Validation Error', 'Stock cannot be negative'); return; }
    setQuickLoading(true);
    try {
      const payload  = await buildPayload(quickForm, quickImages);
      const response = await createProduct(payload);
      if (response.success) {
        Alert.alert('Success', 'Product created successfully');
        closeQuickCreateModal();
        await fetchProducts();
      } else {
        Alert.alert('Error', response.message || 'Failed to create product');
      }
    } catch (e) { console.error(e); Alert.alert('Error', 'Failed to create product'); }
    finally { setQuickLoading(false); }
  };

  // ─── Create / Update ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name.trim())    { Alert.alert('Validation Error', 'Product name is required'); return; }
    if (!formData.category)       { Alert.alert('Validation Error', 'Please select a category'); return; }
    if (formData.price <= 0)      { Alert.alert('Validation Error', 'Price must be greater than 0'); return; }
    if (formData.stock < 0)       { Alert.alert('Validation Error', 'Stock cannot be negative'); return; }
    setUpdating(true);
    try {
      const existingImages = formData.images.filter((img) => img.startsWith('http://') || img.startsWith('https://'));
      const newLocalImages = formData.images.filter((img) => !img.startsWith('http://') && !img.startsWith('https://'));
      let payload: FormData;
      let response;
      if (selectedProduct) {
        payload  = await buildPayload(formData, newLocalImages, { keepImageUrls: JSON.stringify(existingImages) });
        response = await updateProduct(selectedProduct.id, payload);
      } else {
        payload  = await buildPayload(formData, newLocalImages);
        response = await createProduct(payload);
      }
      if (response.success) {
        Alert.alert('Success', `Product ${selectedProduct ? 'updated' : 'created'} successfully`);
        closeModal();
        await fetchProducts();
      } else {
        Alert.alert('Error', response.message || 'Failed to save product');
      }
    } catch (e) { console.error(e); Alert.alert('Error', 'Failed to save product'); }
    finally { setUpdating(false); }
  };

  // ─── Archive / Restore ───────────────────────────────────────────────────
  const handleArchive = (product: Product) => {
    Alert.alert('Archive Product', `Archive "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: async () => {
        try {
          const r = await archiveProduct(product.id);
          if (r.success) { Alert.alert('Success', 'Product archived'); await fetchProducts(); }
          else Alert.alert('Error', r.message || 'Failed to archive');
        } catch { Alert.alert('Error', 'Failed to archive product'); }
      }},
    ]);
  };

  const handleRestore = async (product: Product) => {
    try {
      const r = await restoreProduct(product.id);
      if (r.success) { Alert.alert('Success', 'Product restored'); await fetchProducts(); }
      else Alert.alert('Error', r.message || 'Failed to restore');
    } catch { Alert.alert('Error', 'Failed to restore product'); }
  };

  // ─── Table row ───────────────────────────────────────────────────────────
  const renderTableRow = (product: Product, index: number) => {
    const isEven = index % 2 === 0;
    const color  = STATUS_COLORS[product.status];
    return (
      <View key={product.id} style={[styles.tableRow, isEven ? {} : styles.tableRowEven]}>
        <View style={styles.tableCell}>
          {product.images.length > 0 ? (
            <Image source={{ uri: product.images[0] }} style={styles.thumbnailImage} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="image-outline" size={20} color="#6A8A50" />
            </View>
          )}
        </View>

        <View style={[styles.tableCell, styles.tableCellName]}>
          <Text style={[styles.tableCellText, { fontWeight: '700' }]} numberOfLines={2}>{product.name}</Text>
        </View>

        <View style={styles.tableCell}>
          <Text style={styles.tableCellText}>{product.category.name}</Text>
        </View>

        <View style={styles.tableCell}>
          <Text style={[styles.tableCellText, { color: '#4A7C2F', fontWeight: '700' }]}>
            ₱{product.price.toFixed(2)}
          </Text>
        </View>

        <View style={styles.tableCell}>
          <Text style={[styles.tableCellText, product.is_out_of_stock && styles.outOfStockValue]}>
            {product.stock}
          </Text>
        </View>

        <View style={styles.tableCell}>
          <View style={[styles.statusBadge, { backgroundColor: color }]}>
            <Text style={styles.statusText}>{product.status}</Text>
          </View>
        </View>

        <View style={[styles.tableCell, styles.actionsCell]}>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: product.status === 'archived' ? '#E8F0DF' : '#3b82f6' }]}
            onPress={() => openModal(product)}
            disabled={product.status === 'archived'}
          >
            <Ionicons name="create-outline" size={16} color={product.status === 'archived' ? '#C5D9B0' : '#3b82f6'} />
          </TouchableOpacity>
          {product.status === 'archived' ? (
            <TouchableOpacity style={[styles.iconButton, { borderColor: '#10b981' }]} onPress={() => handleRestore(product)}>
              <Ionicons name="refresh-outline" size={16} color="#10b981" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.iconButton, { borderColor: '#ef4444' }]} onPress={() => handleArchive(product)}>
              <Ionicons name="archive-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const activeCount   = products.filter((p) => p.status === 'active').length;
  const draftCount    = products.filter((p) => p.status === 'draft').length;
  const archivedCount = products.filter((p) => p.status === 'archived').length;
  const outOfStock    = products.filter((p) => p.is_out_of_stock).length;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#8DB87A', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
            AvoCare Admin
          </Text>
          <Text style={styles.title}>Products</Text>
        </View>
        <View style={styles.headerActions}>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={() => {
                if (filteredProducts.length === 0) { Alert.alert('No Data', 'No products to export.'); return; }
                exportToPDF(filteredProducts);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={14} color="#fff" />
              <Text style={styles.pdfBtnText}>PDF</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addButton} onPress={openQuickCreateModal} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Bar ── */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: -16,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 8,
        shadowColor: '#2D5016',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
      }}>
        {[
          { num: products.length, label: 'Total', color: '#2D5016' },
          { num: activeCount,     label: 'Active',    color: '#10b981' },
          { num: draftCount,      label: 'Draft',     color: '#f59e0b' },
          { num: archivedCount,   label: 'Archived',  color: '#6b7280' },
          { num: outOfStock,      label: 'Out of Stock', color: '#ef4444' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: s.color }}>{s.num}</Text>
              <Text style={{ fontSize: 10, color: '#6A8A50', fontWeight: '500' }}>{s.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={{ width: 1, backgroundColor: '#E8F0DF' }} />}
          </React.Fragment>
        ))}
      </View>

      {/* ── Search ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#6A8A50" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products…"
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
      </View>

      {/* ── Filters ── */}
      <View style={styles.filterContainer}>
        {/* Status filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              {STATUS_FILTERS.map((s) => {
                const count = s === 'all' ? products.length : products.filter((p) => p.status === s).length;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.filterButton, filterStatus === s && styles.filterButtonActive]}
                    onPress={() => setFilterStatus(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterButtonText, filterStatus === s && styles.filterButtonTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Category filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              {[{ id: 'all', name: 'All' }, ...categories].map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterButton, filterCategory === cat.id && styles.filterButtonActive]}
                  onPress={() => setFilterCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterButtonText, filterCategory === cat.id && styles.filterButtonTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ── Table ── */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A7C2F']} tintColor="#4A7C2F" />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A7C2F" />
            <Text style={styles.emptyText}>Loading products…</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 52 }}>🥑</Text>
            <Text style={[styles.emptyText, { fontSize: 18, fontWeight: '700', color: '#2D5016' }]}>No products found</Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ fontSize: 13, color: '#4A7C2F', fontWeight: '600', marginTop: 4 }}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              {['Image', 'Product Name', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((col, i) => (
                <View key={col} style={[styles.tableHeaderCell, i === 1 && styles.tableCellName, i === 6 && styles.actionsCell]}>
                  <Text style={styles.tableHeaderText}>{col}</Text>
                </View>
              ))}
            </View>
            <View style={styles.tableBody}>
              {filteredProducts.map((product, index) => renderTableRow(product, index))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Quick Create Modal ── */}
      <Modal visible={showCreateModal} animationType="fade" transparent onRequestClose={closeQuickCreateModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDesktop && styles.modalContentDesktop]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Product</Text>
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5FAF0', alignItems: 'center', justifyContent: 'center' }} onPress={closeQuickCreateModal}>
                <Ionicons name="close" size={22} color="#2D5016" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} value={quickForm.name} onChangeText={t => setQuickForm(p => ({ ...p, name: t }))} placeholder="Enter product name" placeholderTextColor="#A0B89A" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, styles.textArea]} value={quickForm.description} onChangeText={t => setQuickForm(p => ({ ...p, description: t }))} placeholder="Enter product description" placeholderTextColor="#A0B89A" multiline numberOfLines={3} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={quickForm.category} onValueChange={v => setQuickForm(p => ({ ...p, category: v }))} style={styles.picker}>
                    <Picker.Item label="Select a category" value="" />
                    {categories.map(cat => <Picker.Item key={cat.id} label={cat.name} value={cat.id} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.rowGroup}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Price (₱) <Text style={styles.required}>*</Text></Text>
                  <TextInput style={styles.input} value={quickForm.price === 0 ? '' : quickForm.price.toString()} onChangeText={t => setQuickForm(p => ({ ...p, price: parseFloat(t) || 0 }))} placeholder="0.00" placeholderTextColor="#A0B89A" keyboardType="decimal-pad" />
                </View>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Stock <Text style={styles.required}>*</Text></Text>
                  <TextInput style={styles.input} value={quickForm.stock === 0 ? '' : quickForm.stock.toString()} onChangeText={t => setQuickForm(p => ({ ...p, stock: parseInt(t) || 0 }))} placeholder="0" placeholderTextColor="#A0B89A" keyboardType="number-pad" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={quickForm.status} onValueChange={v => setQuickForm(p => ({ ...p, status: v as ProductStatus }))} style={styles.picker}>
                    <Picker.Item label="Draft" value="draft" />
                    <Picker.Item label="Active" value="active" />
                    <Picker.Item label="Archived" value="archived" />
                  </Picker>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Images <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'none' }}>({quickImages.length}/5)</Text></Text>
                {quickImages.length < 5 && (
                  <TouchableOpacity style={styles.imagePickerButton} onPress={handleQuickImagePick}>
                    <Ionicons name="cloud-upload-outline" size={20} color="#4A7C2F" />
                    <Text style={styles.imagePickerText}>Upload Images</Text>
                  </TouchableOpacity>
                )}
                {quickImages.length > 0 && (
                  <ScrollView horizontal style={styles.imagePreviewContainer}>
                    {quickImages.map((uri, idx) => (
                      <View key={idx} style={styles.imagePreview}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <TouchableOpacity style={styles.removeImageButton} onPress={() => removeQuickImage(idx)}>
                          <Ionicons name="close-circle" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Nutritional Info</Text>
                  <TouchableOpacity onPress={addQuickNutritionEntry}><Text style={styles.addLink}>+ Add Entry</Text></TouchableOpacity>
                </View>
                {quickForm.nutrition.map((entry, idx) => (
                  <View key={idx} style={styles.nutritionEntry}>
                    <TextInput style={[styles.input, styles.nutritionInput]} value={entry.label} onChangeText={(t) => updateQuickNutritionEntry(idx, 'label', t)} placeholder="e.g., Calories" placeholderTextColor="#A0B89A" />
                    <TextInput style={[styles.input, styles.nutritionInput]} value={entry.amount} onChangeText={(t) => updateQuickNutritionEntry(idx, 'amount', t)} placeholder="e.g., 160kcal" placeholderTextColor="#A0B89A" />
                    <TouchableOpacity onPress={() => removeQuickNutritionEntry(idx)}><Ionicons name="trash-outline" size={20} color="#ef4444" /></TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeQuickCreateModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleQuickCreate} disabled={quickLoading}>
                  {quickLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Create</Text>}
                </TouchableOpacity>
              </View>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Edit / Add Product modal ── */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDesktop && styles.modalContentDesktop]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedProduct ? 'Edit Product' : 'Add New Product'}</Text>
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5FAF0', alignItems: 'center', justifyContent: 'center' }} onPress={closeModal}>
                <Ionicons name="close" size={22} color="#2D5016" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} value={formData.name} onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))} placeholder="Enter product name" placeholderTextColor="#A0B89A" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={(t) => setFormData((p) => ({ ...p, description: t }))} placeholder="Enter product description" placeholderTextColor="#A0B89A" multiline numberOfLines={3} />
              </View>
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(true)}><Text style={styles.addCategoryLink}>+ Add Category</Text></TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))} style={styles.picker}>
                    <Picker.Item label="Select a category" value="" />
                    {categories.map((cat) => <Picker.Item key={cat.id} label={cat.name} value={cat.id} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.rowGroup}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Price (₱) <Text style={styles.required}>*</Text></Text>
                  <TextInput style={styles.input} value={formData.price === 0 ? '' : formData.price.toString()} onChangeText={(t) => setFormData((p) => ({ ...p, price: parseFloat(t) || 0 }))} placeholder="0.00" placeholderTextColor="#A0B89A" keyboardType="decimal-pad" />
                </View>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Stock <Text style={styles.required}>*</Text></Text>
                  <TextInput style={styles.input} value={formData.stock === 0 ? '' : formData.stock.toString()} onChangeText={(t) => setFormData((p) => ({ ...p, stock: parseInt(t) || 0 }))} placeholder="0" placeholderTextColor="#A0B89A" keyboardType="number-pad" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v as ProductStatus }))} style={styles.picker}>
                    <Picker.Item label="Draft" value="draft" />
                    <Picker.Item label="Active" value="active" />
                    <Picker.Item label="Archived" value="archived" />
                  </Picker>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Images <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'none' }}>({formData.images.length}/5)</Text></Text>
                {formData.images.length < 5 && (
                  <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePick}>
                    <Ionicons name="cloud-upload-outline" size={20} color="#4A7C2F" />
                    <Text style={styles.imagePickerText}>Upload Images</Text>
                  </TouchableOpacity>
                )}
                {formData.images.length > 0 && (
                  <ScrollView horizontal style={styles.imagePreviewContainer}>
                    {formData.images.map((uri, idx) => (
                      <View key={idx} style={styles.imagePreview}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(idx)}>
                          <Ionicons name="close-circle" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Nutritional Info</Text>
                  <TouchableOpacity onPress={addNutritionEntry}><Text style={styles.addLink}>+ Add Entry</Text></TouchableOpacity>
                </View>
                {formData.nutrition.map((entry, idx) => (
                  <View key={idx} style={styles.nutritionEntry}>
                    <TextInput style={[styles.input, styles.nutritionInput]} value={entry.label} onChangeText={(t) => updateNutritionEntry(idx, 'label', t)} placeholder="e.g., Calories" placeholderTextColor="#A0B89A" />
                    <TextInput style={[styles.input, styles.nutritionInput]} value={entry.amount} onChangeText={(t) => updateNutritionEntry(idx, 'amount', t)} placeholder="e.g., 160kcal" placeholderTextColor="#A0B89A" />
                    <TouchableOpacity onPress={() => removeNutritionEntry(idx)}><Ionicons name="trash-outline" size={20} color="#ef4444" /></TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSubmit} disabled={updating}>
                  {updating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>{selectedProduct ? 'Update' : 'Create'}</Text>}
                </TouchableOpacity>
              </View>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Add Category modal ── */}
      <Modal visible={showCategoryModal} animationType="fade" transparent onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalContent}>
            <Text style={styles.categoryModalTitle}>Add New Category</Text>
            <TextInput style={styles.input} value={newCategoryName} onChangeText={setNewCategoryName} placeholder="Enter category name" placeholderTextColor="#A0B89A" autoFocus />
            <View style={styles.categoryModalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setShowCategoryModal(false); setNewCategoryName(''); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddCategory} disabled={updating}>
                {updating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default ProductScreen;