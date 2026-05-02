# Notification Popup Utils

Bộ công cụ thông báo popup có thể dùng chung cho toàn bộ ứng dụng.

## 📁 Files

- `NotificationPopup.tsx` - Component popup thông báo có sẵn
- `useNotificationPopup.ts` - Custom hook để sử dụng notification

## 🎯 Cách sử dụng

### 1. Sử dụng Hook `useNotificationPopup`

```tsx
import { useNotificationPopup } from "@/utils/useNotificationPopup";
import { NotificationPopup } from "@/utils/NotificationPopup";

function MyComponent() {
  const { notification, close, success, error, warning, info } =
    useNotificationPopup();

  const handleSubmit = async () => {
    try {
      // ... your action
      success({
        title: "Thành công!",
        message: "Dữ liệu đã được lưu",
        description: "Bạn có thể tiếp tục công việc",
      });
    } catch (err) {
      error({
        title: "Lỗi!",
        message: "Có lỗi xảy ra khi lưu dữ liệu",
        description: err.message,
      });
    }
  };

  return (
    <>
      <button onClick={handleSubmit}>Lưu</button>
      <NotificationPopup {...notification} onClose={close} />
    </>
  );
}
```

### 2. Các loại thông báo

```tsx
// Success notification
success({
  title: "Thành công",
  message: "Cập nhật hồ sơ thành công",
  description: "Thông tin của bạn đã được cập nhật",
});

// Error notification
error({
  title: "Lỗi",
  message: "Đã xảy ra lỗi",
  description: "Vui lòng thử lại sau",
});

// Warning notification
warning({
  title: "Cảnh báo",
  message: "Bạn chắc chắn ingin xóa?",
  description: "Hành động này không thể hoàn tác",
});

// Info notification
info({
  title: "Thông tin",
  message: "Bản cập nhật mới có sẵn",
  description: "Vui lòng tải lại ứng dụng",
});
```

### 3. Tùy chọn mặc định

```tsx
const { notification, close, success } = useNotificationPopup({
  autoClose: true,
  autoCloseDuration: 3000,
});
```

### 4. Notification với nút xác nhận

```tsx
success({
  title: "Xác nhận xóa",
  message: "Bạn có chắc chắn muốn xóa mục này?",
  confirmText: "Xóa",
  cancelText: "Hủy",
  showCancelButton: true,
  onConfirm: async () => {
    // Thực hiện hành động xóa
    await deleteItem();
  },
});
```

### 5. Auto close notification

```tsx
success({
  title: "Thành công",
  message: "Dữ liệu đã được lưu",
  autoClose: true,
  autoCloseDuration: 2000, // 2 giây
});
```

## 🎨 Loại thông báo (Type)

- `success` - Thông báo thành công (xanh lá)
- `error` - Thông báo lỗi (đỏ)
- `warning` - Cảnh báo (vàng)
- `info` - Thông tin (xanh dương)

## 🔧 Props chi tiết

| Props               | Type                                        | Bắt buộc | Mô tả                                    |
| ------------------- | ------------------------------------------- | -------- | ---------------------------------------- |
| `isOpen`            | boolean                                     | Yes      | Trạng thái hiển thị popup                |
| `type`              | 'success' \| 'error' \| 'warning' \| 'info' | Yes      | Loại thông báo                           |
| `message`           | string \| ReactNode                         | Yes      | Nội dung chính                           |
| `title`             | string                                      | No       | Tiêu đề                                  |
| `description`       | string \| ReactNode                         | No       | Mô tả chi tiết                           |
| `onClose`           | () => void                                  | Yes      | Hàm khi đóng popup                       |
| `onConfirm`         | () => void \| Promise\<void\>               | No       | Hàm khi xác nhận                         |
| `confirmText`       | string                                      | No       | Text nút xác nhận (mặc định: "Xác nhận") |
| `cancelText`        | string                                      | No       | Text nút hủy (mặc định: "Hủy")           |
| `showCancelButton`  | boolean                                     | No       | Hiển thị nút hủy (mặc định: true)        |
| `autoClose`         | boolean                                     | No       | Tự động đóng sau thời gian               |
| `autoCloseDuration` | number                                      | No       | Thời gian tự động đóng (ms)              |
| `className`         | string                                      | No       | Class tùy chỉnh                          |

## 📝 Ví dụ đầy đủ

```tsx
import { useNotificationPopup } from "@/utils/useNotificationPopup";
import { NotificationPopup } from "@/utils/NotificationPopup";

export function UserProfile() {
  const { notification, close, success, error } = useNotificationPopup();

  const handleSaveProfile = async () => {
    try {
      const response = await updateUserProfile({
        name: "John Doe",
        email: "john@example.com",
      });

      success({
        title: "Lưu hồ sơ thành công",
        message: "Thông tin cá nhân của bạn đã được cập nhật",
        autoClose: true,
        autoCloseDuration: 2000,
      });
    } catch (err) {
      error({
        title: "Lỗi cập nhật hồ sơ",
        message: "Không thể lưu thông tin của bạn",
        description: err.message,
      });
    }
  };

  return (
    <div>
      <button onClick={handleSaveProfile}>Lưu hồ sơ</button>
      <NotificationPopup {...notification} onClose={close} />
    </div>
  );
}
```

## 🌙 Dark Mode Support

Component hỗ trợ dark mode tự động dựa trên cấu hình theme của ứng dụng.
