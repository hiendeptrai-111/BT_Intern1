from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Book


class AuthTestCase(TestCase):
    """Test đăng nhập / đăng xuất."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )

    def test_login_success(self):
        """Đăng nhập đúng → trả access + refresh token."""
        res = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'testpass123',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_wrong_password(self):
        """Đăng nhập sai mật khẩu → 401."""
        res = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'wrongpass',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_success(self):
        """Logout → refresh token bị blacklist."""
        # Login first
        login_res = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'testpass123',
        })
        access = login_res.data['access']
        refresh = login_res.data['refresh']

        # Logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        res = self.client.post('/api/logout/', {'refresh': refresh})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Try using the blacklisted refresh token → should fail
        res = self.client.post('/api/token/refresh/', {'refresh': refresh})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_without_refresh_token(self):
        """Logout không gửi refresh token → 400."""
        login_res = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'testpass123',
        })
        access = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        res = self.client.post('/api/logout/', {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class UnauthorizedTestCase(TestCase):
    """Test truy cập API không có token → 401."""

    def setUp(self):
        self.client = APIClient()

    def test_list_books_unauthorized(self):
        res = self.client.get('/api/books/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_book_unauthorized(self):
        res = self.client.post('/api/books/', {
            'title': 'Test', 'author': 'Author', 'price': 10, 'quantity': 5
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class BookCRUDTestCase(TestCase):
    """Test CRUD sách (cần đăng nhập)."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        # Login and get token
        res = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'testpass123',
        })
        self.access_token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

        # Create sample book
        self.book = Book.objects.create(
            title='Python Basics', author='John', price=29.99, quantity=10
        )

    def test_list_books(self):
        """GET /api/books/ → danh sách sách."""
        res = self.client.get('/api/books/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('results', res.data)
        self.assertEqual(res.data['count'], 1)

    def test_create_book(self):
        """POST /api/books/ → tạo sách mới."""
        res = self.client.post('/api/books/', {
            'title': 'Django Guide',
            'author': 'Jane',
            'price': 39.99,
            'quantity': 5,
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'Django Guide')
        self.assertEqual(Book.objects.count(), 2)

    def test_get_book_detail(self):
        """GET /api/books/<id>/ → chi tiết sách."""
        res = self.client.get(f'/api/books/{self.book.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], 'Python Basics')

    def test_update_book(self):
        """PUT /api/books/<id>/ → cập nhật sách."""
        res = self.client.put(f'/api/books/{self.book.id}/', {
            'title': 'Python Advanced',
            'author': 'John Updated',
            'price': 49.99,
            'quantity': 20,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], 'Python Advanced')

    def test_delete_book(self):
        """DELETE /api/books/<id>/ → xóa sách."""
        res = self.client.delete(f'/api/books/{self.book.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Book.objects.count(), 0)

    def test_filter_by_title(self):
        """GET /api/books/?title=python → tìm theo title."""
        Book.objects.create(title='React Guide', author='Bob', price=19.99, quantity=3)
        res = self.client.get('/api/books/?title=python')
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['title'], 'Python Basics')

    def test_filter_by_author(self):
        """GET /api/books/?author=john → tìm theo author."""
        Book.objects.create(title='React Guide', author='Bob', price=19.99, quantity=3)
        res = self.client.get('/api/books/?author=john')
        self.assertEqual(res.data['count'], 1)


class PaginationTestCase(TestCase):
    """Test phân trang."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        res = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'testpass123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {res.data["access"]}')

        # Create 25 books for pagination testing
        for i in range(25):
            Book.objects.create(
                title=f'Book {i}', author=f'Author {i}', price=10.0, quantity=1
            )

    def test_pagination_default_page_size(self):
        """Mặc định hiển thị 20 sách/trang."""
        res = self.client.get('/api/books/')
        self.assertEqual(len(res.data['results']), 20)
        self.assertEqual(res.data['count'], 25)
        self.assertEqual(res.data['total_pages'], 2)
        self.assertEqual(res.data['current_page'], 1)

    def test_pagination_page_2(self):
        """Trang 2 hiển thị 5 sách còn lại."""
        res = self.client.get('/api/books/?page=2')
        self.assertEqual(len(res.data['results']), 5)
        self.assertEqual(res.data['current_page'], 2)

    def test_pagination_custom_page_size(self):
        """Custom page_size=10."""
        res = self.client.get('/api/books/?page_size=10')
        self.assertEqual(len(res.data['results']), 10)
        self.assertEqual(res.data['total_pages'], 3)
