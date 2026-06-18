/* ============================================
   App.jsx - File chính của ứng dụng Quản lý Sách
   ============================================

   📖 GIẢI THÍCH CHO NGƯỜI MỚI:

   1. React là gì?
      - React là một thư viện JavaScript giúp xây dựng giao diện web.
      - Thay vì viết HTML thuần, ta viết JSX (HTML bên trong JavaScript).
      - React chia giao diện thành các "component" (thành phần) nhỏ.

   2. useState là gì?
      - useState cho phép component "nhớ" dữ liệu (gọi là state).
      - Ví dụ: const [books, setBooks] = useState([])
        → books: giá trị hiện tại (danh sách sách)
        → setBooks: hàm để thay đổi giá trị
        → useState([]): giá trị ban đầu là mảng rỗng []

   3. useEffect là gì?
      - useEffect chạy một hàm khi component được hiển thị lần đầu,
        hoặc khi một giá trị nào đó thay đổi.
      - Ví dụ: useEffect(() => { fetchBooks() }, [page])
        → Mỗi khi 'page' thay đổi → gọi lại fetchBooks()

   4. async/await là gì?
      - Dùng để gọi API (lấy dữ liệu từ server) một cách tuần tự.
      - await fetch(...) nghĩa là "chờ server trả dữ liệu về rồi mới tiếp tục".

   5. JSX là gì?
      - Là cú pháp giống HTML nhưng viết trong JavaScript.
      - Dùng className thay cho class (vì class là từ khóa trong JS).
      - Dùng {} để chèn biến JavaScript vào HTML.
      - Ví dụ: <td>{book.title}</td> → hiển thị tên sách
*/

// --- IMPORT ---
// import: lấy các công cụ từ thư viện React
import { useState, useEffect } from 'react';
// import file CSS để trang trí giao diện
import './App.css';

// Đường dẫn API backend (Django) - tất cả request sẽ gửi đến đây
const API = '/api/books/';

// ========================
// COMPONENT CHÍNH: App
// ========================
// Đây là component (thành phần) chính của ứng dụng.
// Trong React, mỗi component là một hàm trả về JSX (HTML).
function App() {

  // --- STATE (Dữ liệu mà component cần "nhớ") ---

  // Danh sách sách lấy từ API
  const [books, setBooks] = useState([]);
  // Tổng số sách (để tính phân trang)
  const [count, setCount] = useState(0);
  // Trang hiện tại (bắt đầu từ trang 1)
  const [page, setPage] = useState(1);
  // Số sách hiển thị trên mỗi trang
  const [pageSize, setPageSize] = useState(20);
  // Giá trị đang gõ trong ô tìm kiếm
  const [filterTitle, setFilterTitle] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  // Giá trị tìm kiếm đã submit (gửi lên API)
  const [search, setSearch] = useState({ title: '', author: '' });

  // --- STATE cho Modal (cửa sổ popup) ---
  // modal có thể là: 'add' | 'edit' | 'detail' | 'delete' | null (đóng)
  const [modal, setModal] = useState(null);
  // Sách đang được chọn (để xem, sửa, xóa)
  const [selected, setSelected] = useState(null);
  // Dữ liệu form nhập liệu
  const [form, setForm] = useState({ title: '', author: '', price: '', quantity: '' });
  // Trạng thái đang tải dữ liệu
  const [loading, setLoading] = useState(false);

  // Tính tổng số trang = tổng sách / số sách mỗi trang (làm tròn lên)
  const totalPages = Math.ceil(count / pageSize) || 1;

  // ========================
  // HÀM GỌI API
  // ========================

  // fetchBooks: Lấy danh sách sách từ server
  const fetchBooks = async () => {
    setLoading(true); // Bật trạng thái "đang tải"

    // Tạo query string: ?page=1&page_size=20&title=...&author=...
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (search.title) params.append('title', search.title);
    if (search.author) params.append('author', search.author);

    try {
      // Gọi API và chờ kết quả
      const res = await fetch(`${API}?${params}`);
      // Chuyển kết quả sang JSON
      const data = await res.json();
      // Cập nhật state với dữ liệu mới
      setBooks(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      // Nếu lỗi → thông báo cho người dùng
      alert('Lỗi kết nối API');
    }

    setLoading(false); // Tắt trạng thái "đang tải"
  };

  // useEffect: Mỗi khi page, pageSize, hoặc search thay đổi → gọi lại fetchBooks
  useEffect(() => { fetchBooks(); }, [page, pageSize, search]);

  // ========================
  // CÁC HÀM XỬ LÝ SỰ KIỆN
  // ========================

  // Khi bấm nút "Tìm kiếm"
  const handleFilter = (e) => {
    e.preventDefault(); // Ngăn trang reload (hành vi mặc định của form)
    setPage(1);         // Quay về trang 1
    setSearch({ title: filterTitle, author: filterAuthor }); // Cập nhật từ khóa tìm kiếm
  };

  // Khi bấm nút "Reset" → xóa hết bộ lọc
  const resetFilter = () => {
    setFilterTitle('');
    setFilterAuthor('');
    setPage(1);
    setSearch({ title: '', author: '' });
  };

  // Mở popup "Thêm sách mới"
  const openAdd = () => {
    setForm({ title: '', author: '', price: '', quantity: '' }); // Xóa trắng form
    setModal('add'); // Mở modal loại 'add'
  };

  // Mở popup "Chi tiết sách" - gọi API lấy thông tin chi tiết
  const openDetail = async (id) => {
    const res = await fetch(`${API}${id}/`);
    const data = await res.json();
    setSelected(data);    // Lưu sách được chọn
    setModal('detail');   // Mở modal loại 'detail'
  };

  // Mở popup "Sửa sách" - gọi API lấy dữ liệu hiện tại để điền vào form
  const openEdit = async (id) => {
    const res = await fetch(`${API}${id}/`);
    const data = await res.json();
    setSelected(data);
    // Điền dữ liệu hiện tại vào form
    setForm({ title: data.title, author: data.author, price: data.price, quantity: data.quantity });
    setModal('edit');
  };

  // Mở popup "Xác nhận xóa"
  const openDelete = (book) => {
    setSelected(book);
    setModal('delete');
  };

  // Xử lý thêm sách mới (POST request)
  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await fetch(API, {
      method: 'POST',  // POST = tạo mới
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        author: form.author,
        price: parseFloat(form.price),    // Chuyển string → số thực
        quantity: parseInt(form.quantity), // Chuyển string → số nguyên
      }),
    });
    if (res.ok) {          // Nếu thành công (status 200-299)
      setModal(null);      // Đóng modal
      fetchBooks();        // Tải lại danh sách
    } else {
      alert('Thêm sách thất bại');
    }
  };

  // Xử lý sửa sách (PUT request)
  const handleEdit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}${selected.id}/`, {
      method: 'PUT',  // PUT = cập nhật toàn bộ
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

  // Xử lý xóa sách (DELETE request)
  const handleDelete = async () => {
    const res = await fetch(`${API}${selected.id}/`, { method: 'DELETE' });
    if (res.ok) {
      setModal(null);
      // Nếu xóa sách cuối cùng trên trang → quay về trang trước
      if (books.length === 1 && page > 1) setPage(page - 1);
      else fetchBooks();
    } else {
      alert('Xóa thất bại');
    }
  };

  // ========================
  // PHẦN GIAO DIỆN (JSX)
  // ========================
  // return (...) → trả về HTML mà React sẽ hiển thị trên trình duyệt

  return (
    <div className="container">

      {/* ===== TIÊU ĐỀ ===== */}
      <h1>📚 Quản lý sách</h1>

      {/* ===== THANH TÌM KIẾM ===== */}
      {/* form: khi submit sẽ gọi handleFilter */}
      <div className="section">
        <form onSubmit={handleFilter} className="filter-form">
          <input
            placeholder="Tìm theo tên sách..."
            value={filterTitle}
            onChange={e => setFilterTitle(e.target.value)}
          />
          <input
            placeholder="Tìm theo tác giả..."
            value={filterAuthor}
            onChange={e => setFilterAuthor(e.target.value)}
          />
          <button type="submit">🔍 Tìm kiếm</button>
          <button type="button" onClick={resetFilter} className="btn-secondary">↺ Reset</button>
        </form>
      </div>

      {/* ===== THANH ĐIỀU KHIỂN ===== */}
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

      {/* ===== BẢNG DANH SÁCH SÁCH ===== */}
      {/*
        Cấu trúc bảng HTML:
        <table>
          <thead> → Phần tiêu đề (hàng đầu tiên, nền xanh)
          <tbody> → Phần dữ liệu (các hàng sách)
        </table>
      */}
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
          {/* Nếu đang tải → hiện "Đang tải..." */}
          {loading ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>⏳ Đang tải...</td></tr>
          ) : books.length === 0 ? (
            /* Nếu không có sách → hiện thông báo */
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>📭 Không có dữ liệu</td></tr>
          ) : (
            /* Nếu có sách → dùng .map() để lặp qua từng cuốn sách và tạo hàng */
            books.map(book => (
              <tr key={book.id}>
                <td>{book.id}</td>
                <td><strong>{book.title}</strong></td>
                <td>{book.author}</td>
                <td>${book.price}</td>
                <td>{book.quantity}</td>
                <td>
                  {/* 3 nút hành động cho mỗi sách */}
                  <button onClick={() => openDetail(book.id)} className="btn-sm">👁 Xem</button>
                  <button onClick={() => openEdit(book.id)} className="btn-sm btn-edit">✏️ Sửa</button>
                  <button onClick={() => openDelete(book)} className="btn-sm btn-del">🗑 Xóa</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ===== PHÂN TRANG ===== */}
      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
          ← Trang trước
        </button>
        <span>Trang {page} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Trang sau →
        </button>
      </div>

      {/* ===== CỬA SỔ POPUP (Modal) ===== */}
      {/*
        modal && (...) nghĩa là:
        "Nếu modal KHÔNG phải null → hiển thị nội dung bên trong"
        Đây là cách React ẩn/hiện phần tử.
      */}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          {/* stopPropagation: ngăn click trong modal lan ra overlay (sẽ đóng modal) */}
          <div className="modal" onClick={e => e.stopPropagation()}>

            {/* --- POPUP: THÊM SÁCH --- */}
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

            {/* --- POPUP: SỬA SÁCH --- */}
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

            {/* --- POPUP: XEM CHI TIẾT --- */}
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

            {/* --- POPUP: XÁC NHẬN XÓA --- */}
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

// Export component để file khác (main.jsx) có thể import và sử dụng
export default App;
