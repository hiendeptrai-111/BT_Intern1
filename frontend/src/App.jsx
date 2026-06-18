import { useState, useEffect } from 'react';
import './App.css';

// =======================
// CẤU HÌNH API
// =======================
const API_BOOKS = '/api/books/';
const API_TOKEN = '/api/token/';
const API_REFRESH = '/api/token/refresh/';
const API_LOGOUT = '/api/logout/';

// =======================
// HÀM HELPER: Gọi API có kèm Token
// =======================
// Hàm này tự động:
// 1. Gắn Authorization header (Bearer token)
// 2. Nếu access token hết hạn (401) → dùng refresh token lấy access mới
// 3. Nếu refresh cũng hết hạn → bắt đăng nhập lại
async function apiFetch(url, options = {}, onLogout) {
  const accessToken = localStorage.getItem('access_token');

  // Gắn header Authorization
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Nếu bị 401 (Unauthorized) → thử refresh token
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      onLogout();
      return res;
    }

    // Gọi API refresh token
    const refreshRes = await fetch(API_REFRESH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem('access_token', data.access);
      // Gọi lại request ban đầu với token mới
      headers['Authorization'] = `Bearer ${data.access}`;
      res = await fetch(url, { ...options, headers });
    } else {
      // Refresh token cũng hết hạn → bắt đăng nhập lại
      onLogout();
    }
  }

  return res;
}

// =======================
// COMPONENT CHÍNH
// =======================
function App() {
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // --- BOOK STATE ---
  const [books, setBooks] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [search, setSearch] = useState({ title: '', author: '' });
  const [totalPages, setTotalPages] = useState(1);

  // --- MODAL STATE ---
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', author: '', price: '', quantity: '' });
  const [loading, setLoading] = useState(false);

  // Hàm logout — xóa token khỏi localStorage
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    // Gọi API logout để blacklist refresh token
    if (refreshToken) {
      try {
        await apiFetch(API_LOGOUT, {
          method: 'POST',
          body: JSON.stringify({ refresh: refreshToken }),
        }, () => {});
      } catch (e) {
        // Ignore errors during logout
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    setBooks([]);
  };

  // Hàm login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(API_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('username', loginForm.username);
        setUsername(loginForm.username);
        setIsLoggedIn(true);
        setLoginForm({ username: '', password: '' });
      } else {
        setLoginError('Sai tên đăng nhập hoặc mật khẩu!');
      }
    } catch (err) {
      setLoginError('Không thể kết nối đến server!');
    }

    setLoginLoading(false);
  };

  // =======================
  // BOOK API FUNCTIONS
  // =======================

  const fetchBooks = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (search.title) params.append('title', search.title);
    if (search.author) params.append('author', search.author);

    try {
      const res = await apiFetch(`${API_BOOKS}?${params}`, {}, handleLogout);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.results || []);
        setCount(data.count || 0);
        setTotalPages(data.total_pages || Math.ceil((data.count || 0) / pageSize) || 1);
      }
    } catch (err) {
      alert('Lỗi kết nối API');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) fetchBooks();
  }, [page, pageSize, search, isLoggedIn]);

  // --- Filter ---
  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch({ title: filterTitle, author: filterAuthor });
  };

  const resetFilter = () => {
    setFilterTitle('');
    setFilterAuthor('');
    setPage(1);
    setSearch({ title: '', author: '' });
  };

  // --- CRUD Modals ---
  const openAdd = () => {
    setForm({ title: '', author: '', price: '', quantity: '' });
    setModal('add');
  };

  const openDetail = async (id) => {
    const res = await apiFetch(`${API_BOOKS}${id}/`, {}, handleLogout);
    if (res.ok) {
      const data = await res.json();
      setSelected(data);
      setModal('detail');
    }
  };

  const openEdit = async (id) => {
    const res = await apiFetch(`${API_BOOKS}${id}/`, {}, handleLogout);
    if (res.ok) {
      const data = await res.json();
      setSelected(data);
      setForm({ title: data.title, author: data.author, price: data.price, quantity: data.quantity });
      setModal('edit');
    }
  };

  const openDelete = (book) => {
    setSelected(book);
    setModal('delete');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await apiFetch(API_BOOKS, {
      method: 'POST',
      body: JSON.stringify({
        title: form.title,
        author: form.author,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      }),
    }, handleLogout);
    if (res.ok) {
      setModal(null);
      fetchBooks();
    } else {
      alert('Thêm sách thất bại');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const res = await apiFetch(`${API_BOOKS}${selected.id}/`, {
      method: 'PUT',
      body: JSON.stringify({
        title: form.title,
        author: form.author,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      }),
    }, handleLogout);
    if (res.ok) {
      setModal(null);
      fetchBooks();
    } else {
      alert('Cập nhật thất bại');
    }
  };

  const handleDelete = async () => {
    const res = await apiFetch(`${API_BOOKS}${selected.id}/`, {
      method: 'DELETE',
    }, handleLogout);
    if (res.ok) {
      setModal(null);
      if (books.length === 1 && page > 1) setPage(page - 1);
      else fetchBooks();
    } else {
      alert('Xóa thất bại');
    }
  };

  // =======================
  // TRANG ĐĂNG NHẬP
  // =======================
  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        <div className="login-box">
          <h1>📚 Quản lý sách</h1>
          <p className="subtitle">Đăng nhập để tiếp tục</p>
          <form onSubmit={handleLogin}>
            <label>Tên đăng nhập</label>
            <input
              required
              placeholder="Nhập username..."
              value={loginForm.username}
              onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
            />
            <label>Mật khẩu</label>
            <input
              required
              type="password"
              placeholder="Nhập mật khẩu..."
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            <button type="submit" disabled={loginLoading}>
              {loginLoading ? '⏳ Đang đăng nhập...' : '🔐 Đăng nhập'}
            </button>
          </form>
          {loginError && <div className="login-error">❌ {loginError}</div>}
        </div>
      </div>
    );
  }

  // =======================
  // TRANG QUẢN LÝ SÁCH (sau khi đăng nhập)
  // =======================
  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>📚 Quản lý sách</h1>
        <div className="header-right">
          <span>👤 {username}</span>
          <button onClick={handleLogout} className="btn-logout">🚪 Đăng xuất</button>
        </div>
      </div>

      {/* Filter */}
      <div className="section">
        <form onSubmit={handleFilter} className="filter-form">
          <input placeholder="Tìm theo tên sách..." value={filterTitle} onChange={e => setFilterTitle(e.target.value)} />
          <input placeholder="Tìm theo tác giả..." value={filterAuthor} onChange={e => setFilterAuthor(e.target.value)} />
          <button type="submit">🔍 Tìm kiếm</button>
          <button type="button" onClick={resetFilter} className="btn-secondary">↺ Reset</button>
        </form>
      </div>

      {/* Controls */}
      <div className="controls">
        <button onClick={openAdd} className="btn-add">＋ Thêm sách mới</button>
        <div>
          <label>Hiển thị: </label>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
            <option value={20}>20 sách/trang</option>
            <option value={100}>100 sách/trang</option>
          </select>
          <span style={{ marginLeft: 10, color: '#666' }}>Tổng: <strong>{count}</strong> sách</span>
        </div>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên sách</th>
            <th>Tác giả</th>
            <th>Giá</th>
            <th>Số lượng</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>⏳ Đang tải...</td></tr>
          ) : books.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>📭 Không có dữ liệu</td></tr>
          ) : (
            books.map(book => (
              <tr key={book.id}>
                <td>{book.id}</td>
                <td><strong>{book.title}</strong></td>
                <td>{book.author}</td>
                <td>${book.price}</td>
                <td>{book.quantity}</td>
                <td>
                  <button onClick={() => openDetail(book.id)} className="btn-sm">👁 Xem</button>
                  <button onClick={() => openEdit(book.id)} className="btn-sm btn-edit">✏️ Sửa</button>
                  <button onClick={() => openDelete(book)} className="btn-sm btn-del">🗑 Xóa</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Trang trước</button>
        <span>Trang {page} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Trang sau →</button>
      </div>

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            {modal === 'add' && (
              <>
                <h2>📗 Thêm sách mới</h2>
                <form onSubmit={handleAdd}>
                  <label>Tên sách</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  <label>Tác giả</label>
                  <input required value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
                  <label>Giá</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  <label>Số lượng</label>
                  <input required type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                  <div className="modal-actions">
                    <button type="submit">✅ Thêm sách</button>
                    <button type="button" onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
                  </div>
                </form>
              </>
            )}

            {modal === 'edit' && selected && (
              <>
                <h2>✏️ Sửa sách (ID: {selected.id})</h2>
                <form onSubmit={handleEdit}>
                  <label>Tên sách</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  <label>Tác giả</label>
                  <input required value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
                  <label>Giá</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  <label>Số lượng</label>
                  <input required type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                  <div className="modal-actions">
                    <button type="submit">💾 Lưu thay đổi</button>
                    <button type="button" onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
                  </div>
                </form>
              </>
            )}

            {modal === 'detail' && selected && (
              <>
                <h2>📖 Chi tiết sách</h2>
                <p><strong>ID:</strong> {selected.id}</p>
                <p><strong>Tên sách:</strong> {selected.title}</p>
                <p><strong>Tác giả:</strong> {selected.author}</p>
                <p><strong>Giá:</strong> ${selected.price}</p>
                <p><strong>Số lượng:</strong> {selected.quantity}</p>
                <div className="modal-actions">
                  <button onClick={() => setModal(null)}>Đóng</button>
                </div>
              </>
            )}

            {modal === 'delete' && selected && (
              <>
                <h2>⚠️ Xác nhận xóa</h2>
                <p>Bạn có chắc muốn xóa sách <strong>"{selected.title}"</strong>?</p>
                <p style={{ color: '#e74c3c', fontSize: '13px' }}>Hành động này không thể hoàn tác!</p>
                <div className="modal-actions">
                  <button onClick={handleDelete} className="btn-danger">🗑 Xóa</button>
                  <button onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
