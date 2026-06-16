import { useState, useEffect } from 'react';
import './App.css';

const API = '/api/books/';

function App() {
  const [books, setBooks] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [search, setSearch] = useState({ title: '', author: '' });

  // Modal state
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'detail' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', author: '', price: '', quantity: '' });
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(count / pageSize) || 1;

  const fetchBooks = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (search.title) params.append('title', search.title);
    if (search.author) params.append('author', search.author);
    try {
      const res = await fetch(`${API}?${params}`);
      const data = await res.json();
      setBooks(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      alert('Lỗi kết nối API');
    }
    setLoading(false);
  };

  useEffect(() => { fetchBooks(); }, [page, pageSize, search]);

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

  const openAdd = () => {
    setForm({ title: '', author: '', price: '', quantity: '' });
    setModal('add');
  };

  const openDetail = async (id) => {
    const res = await fetch(`${API}${id}/`);
    const data = await res.json();
    setSelected(data);
    setModal('detail');
  };

  const openEdit = async (id) => {
    const res = await fetch(`${API}${id}/`);
    const data = await res.json();
    setSelected(data);
    setForm({ title: data.title, author: data.author, price: data.price, quantity: data.quantity });
    setModal('edit');
  };

  const openDelete = (book) => {
    setSelected(book);
    setModal('delete');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        author: form.author,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      }),
    });
    if (res.ok) {
      setModal(null);
      fetchBooks();
    } else {
      alert('Thêm sách thất bại');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}${selected.id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        author: form.author,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      }),
    });
    if (res.ok) {
      setModal(null);
      fetchBooks();
    } else {
      alert('Cập nhật thất bại');
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`${API}${selected.id}/`, { method: 'DELETE' });
    if (res.ok) {
      setModal(null);
      if (books.length === 1 && page > 1) setPage(page - 1);
      else fetchBooks();
    } else {
      alert('Xóa thất bại');
    }
  };

  return (
    <div className="container">
      <h1>📚 Quản lý sách</h1>

      {/* Filter */}
      <div className="section">
        <form onSubmit={handleFilter} className="filter-form">
          <input placeholder="Tìm theo title" value={filterTitle} onChange={e => setFilterTitle(e.target.value)} />
          <input placeholder="Tìm theo author" value={filterAuthor} onChange={e => setFilterAuthor(e.target.value)} />
          <button type="submit">Tìm kiếm</button>
          <button type="button" onClick={resetFilter} className="btn-secondary">Reset</button>
        </form>
      </div>

      {/* Controls */}
      <div className="controls">
        <button onClick={openAdd} className="btn-add">+ Thêm sách mới</button>
        <div>
          <label>Hiển thị: </label>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
            <option value={20}>20</option>
            <option value={100}>100</option>
          </select>
          <span style={{ marginLeft: 10 }}>Tổng: {count} sách</span>
        </div>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Author</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
          ) : books.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
          ) : books.map(book => (
            <tr key={book.id}>
              <td>{book.id}</td>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>${book.price}</td>
              <td>{book.quantity}</td>
              <td>
                <button onClick={() => openDetail(book.id)} className="btn-sm">Detail</button>
                <button onClick={() => openEdit(book.id)} className="btn-sm btn-edit">Edit</button>
                <button onClick={() => openDelete(book)} className="btn-sm btn-del">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
        <span>Trang {page} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
      </div>

      {/* Modal Overlay */}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            {/* Add */}
            {modal === 'add' && (
              <>
                <h2>Thêm sách mới</h2>
                <form onSubmit={handleAdd}>
                  <label>Title</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  <label>Author</label>
                  <input required value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
                  <label>Price</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  <label>Quantity</label>
                  <input required type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                  <div className="modal-actions">
                    <button type="submit">Add Book</button>
                    <button type="button" onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
                  </div>
                </form>
              </>
            )}

            {/* Edit */}
            {modal === 'edit' && selected && (
              <>
                <h2>Sửa sách (ID: {selected.id})</h2>
                <form onSubmit={handleEdit}>
                  <label>Title</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  <label>Author</label>
                  <input required value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
                  <label>Price</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  <label>Quantity</label>
                  <input required type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                  <div className="modal-actions">
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
                  </div>
                </form>
              </>
            )}

            {/* Detail */}
            {modal === 'detail' && selected && (
              <>
                <h2>Chi tiết sách</h2>
                <p><strong>ID:</strong> {selected.id}</p>
                <p><strong>Title:</strong> {selected.title}</p>
                <p><strong>Author:</strong> {selected.author}</p>
                <p><strong>Price:</strong> ${selected.price}</p>
                <p><strong>Quantity:</strong> {selected.quantity}</p>
                <div className="modal-actions">
                  <button onClick={() => setModal(null)}>Đóng</button>
                </div>
              </>
            )}

            {/* Delete */}
            {modal === 'delete' && selected && (
              <>
                <h2>Xác nhận xóa</h2>
                <p>Bạn có chắc muốn xóa sách <strong>"{selected.title}"</strong>?</p>
                <div className="modal-actions">
                  <button onClick={handleDelete} className="btn-danger">Xóa</button>
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
