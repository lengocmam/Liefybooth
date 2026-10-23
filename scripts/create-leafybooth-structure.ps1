\xEF\xBB\xBF<#
.SYNOPSIS
    Tạo cấu trúc thư mục dự án LeafyBooth (Expo + Firebase, iOS trước, Android sau).

.EXAMPLE
    .\create-leafybooth-structure.ps1
    Chỉ tạo thư mục và tệp mẫu trong .\leafybooth

.EXAMPLE
    .\create-leafybooth-structure.ps1 -Root D:\dev\leafybooth -CreateExpo -GitInit
    Chạy create-expo-app trước, tạo thư mục, rồi git init.

.NOTES
    Cần Node.js (bản LTS) nếu dùng -CreateExpo.
    Bundle ID (ví dụ com.tenban.leafybooth) đặt trong mobile\app.json sau khi tạo project;
    hãy chốt trước khi đăng ký trên Apple Developer vì rất khó đổi sau khi lên store.
#>
param(
    [string]$Root = ".\leafybooth",
    [switch]$CreateExpo,
    [switch]$GitInit
)

$ErrorActionPreference = "Stop"
$utf8 = New-Object System.Text.UTF8Encoding($false)

if (-not [System.IO.Path]::IsPathRooted($Root)) {
    $Root = Join-Path (Get-Location).Path $Root
}
$Root = [System.IO.Path]::GetFullPath($Root)

function New-Dir([string]$Rel) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Root $Rel) | Out-Null
}

function New-TextFile([string]$Rel, [string]$Content) {
    $path = [System.IO.Path]::GetFullPath((Join-Path $Root $Rel))
    New-Item -ItemType Directory -Force -Path (Split-Path $path -Parent) | Out-Null
    if (Test-Path $path) {
        Write-Host "Bỏ qua (đã có): $Rel" -ForegroundColor Yellow
        return
    }
    [System.IO.File]::WriteAllText($path, $Content, $utf8)
}

New-Item -ItemType Directory -Force -Path $Root | Out-Null
Write-Host "Thư mục gốc: $Root" -ForegroundColor Cyan

# 1) Tạo project Expo (tùy chọn). Chạy trước để không bị ghi đè.
if ($CreateExpo) {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Không tìm thấy Node.js. Cài Node.js LTS hoặc bỏ -CreateExpo."
    }
    if (Test-Path (Join-Path $Root "mobile\package.json")) {
        Write-Host "Đã có project Expo trong mobile\, bỏ qua create-expo-app." -ForegroundColor Yellow
    } else {
        Push-Location $Root
        try {
            npx create-expo-app@latest mobile
            if ($LASTEXITCODE -ne 0) { throw "create-expo-app thất bại (mã $LASTEXITCODE)." }
        } finally {
            Pop-Location
        }
    }
}

# 2) Ứng dụng: tổ chức theo tính năng (feature-first). Màn hình nằm trong mobile\app (Expo Router).
$features = @(
    "onboarding", "auth", "friends", "moments", "booth", "backdrop",
    "garden", "safety", "settings",
    "frame_studio", "trending"   # hai tính năng này làm ở bản 1.1
)
$parts = @("components", "hooks", "services")
foreach ($f in $features) {
    foreach ($p in $parts) { New-Dir "mobile\src\features\$f\$p" }
}

@("core\theme", "core\utils", "core\constants", "core\components",
  "data\models", "data\repositories", "data\services", "i18n") |
    ForEach-Object { New-Dir "mobile\src\$_" }

@("backdrops", "stickers", "fonts", "sounds") | ForEach-Object { New-Dir "mobile\assets\$_" }
New-Dir "mobile\targets\widget"   # widget iOS (Swift), thêm bằng @bacons/apple-targets
@("unit", "fixtures") | ForEach-Object { New-Dir "mobile\tests\$_" }

# 3) Cloud Functions (TypeScript) và cấu hình Firebase
@("src\callable", "src\triggers", "src\scheduled", "src\utils", "test") |
    ForEach-Object { New-Dir "functions\$_" }
@("rules", "seed", "emulator-data") | ForEach-Object { New-Dir "firebase\$_" }

# 4) Tài liệu, thiết kế, script, CI
@("01-y-tuong", "02-thiet-ke", "03-ky-thuat", "04-quyet-dinh", "05-store") |
    ForEach-Object { New-Dir "docs\$_" }
@("ui-export", "ui-source", "brand", "backdrops-source", "stickers-source", "store-screenshots") |
    ForEach-Object { New-Dir "design\$_" }
New-Dir "scripts"
New-Dir ".github\workflows"

# 5) Tệp mẫu
New-TextFile "README.md" @'
# LeafyBooth

Ứng dụng chia sẻ khoảnh khắc hằng ngày và chụp photobooth 4 khung cùng nhau.
Khẩu hiệu: *Plant a moment.*

Ra mắt iOS trước, Android sau. Công nghệ: Expo (React Native, TypeScript) + Firebase.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `mobile/` | Ứng dụng Expo (iOS, Android) |
| `mobile/app/` | Màn hình theo đường dẫn (Expo Router) |
| `mobile/src/features/` | Từng tính năng: onboarding, auth, friends, moments (Plant, Pick), booth, backdrop, garden, safety, settings |
| `mobile/src/features/frame_studio`, `trending` | Làm ở bản 1.1 |
| `mobile/targets/widget/` | Widget iOS (Swift, WidgetKit) |
| `functions/` | Cloud Functions (TypeScript) |
| `firebase/` | Security Rules, dữ liệu mẫu cho Emulator |
| `docs/` | Ý tưởng, thiết kế, kỹ thuật, quyết định, tài liệu cho store |
| `design/` | Logo, màu, nền, sticker, ảnh và tệp gốc thiết kế |
| `scripts/` | Script hỗ trợ (chạy Emulator, nạp dữ liệu mẫu) |
| `.github/workflows/` | CI (tsc, eslint, jest) |

## Bắt đầu nhanh (PowerShell)

```powershell
cd mobile
npm install
npx expo start
```

Dùng development build (cần cho widget, thông báo đẩy, Firebase):

```powershell
npm install -g eas-cli
eas login
eas build --profile development --platform ios
```

Chạy Firebase Emulator (cần JDK):

```powershell
firebase emulators:start --project demo-leafybooth
```
'@

New-TextFile ".gitignore" @'
# Hệ điều hành và công cụ
.DS_Store
Thumbs.db
*.log

# Node / Expo
node_modules/
.expo/
dist/
web-build/
functions/lib/

# Expo prebuild: thư mục native được sinh ra, không commit
mobile/ios/
mobile/android/

# Firebase
.firebase/
firebase/emulator-data/

# Bí mật: không đưa lên Git
.env
.env.*
*.p8
*.jks
*.keystore
key.properties
'@

New-TextFile "docs\README.md" @'
# Tài liệu

- 01-y-tuong: báo cáo ý tưởng sản phẩm
- 02-thiet-ke: link thiết kế, bảng màu, font, ghi chú
- 03-ky-thuat: đặc tả kỹ thuật, sơ đồ dữ liệu
- 04-quyet-dinh: các quyết định đã chốt (tên, bundle ID, giới hạn bạn bè, thời hạn lưu ảnh...)
- 05-store: chính sách quyền riêng tư, mô tả store, ảnh chụp màn hình

Bản chính của tài liệu và thiết kế đang ở bản online; khi đội dev bắt đầu, xuất bản chốt vào đây và ghi rõ bản nào là nguồn chính.
'@

New-TextFile "firebase\rules\firestore.rules" @'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Mặc định từ chối tất cả. Sẽ viết quy tắc thật ở giai đoạn tài khoản và sự kiện.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
'@

New-TextFile "firebase\rules\storage.rules" @'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Mặc định từ chối tất cả. Sẽ viết quy tắc thật ở giai đoạn gửi ảnh.
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
'@

# 6) Thêm .gitkeep vào thư mục rỗng để Git giữ lại
Get-ChildItem -Path $Root -Recurse -Directory -Force |
    Where-Object { $_.FullName -notmatch "node_modules" } |
    Where-Object { -not (Get-ChildItem -Path $_.FullName -Force) } |
    ForEach-Object { New-Item -ItemType File -Path (Join-Path $_.FullName ".gitkeep") | Out-Null }

# 7) Git (tùy chọn)
if ($GitInit) {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        git -C $Root init
    } else {
        Write-Host "Không tìm thấy git, bỏ qua git init." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Xong. Cấu trúc thư mục (không gồm node_modules):" -ForegroundColor Green
Get-ChildItem -Path $Root -Directory -Force | ForEach-Object { Write-Host "  $($_.Name)\" }

Write-Host ""
Write-Host "Bước tiếp theo:" -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $Root "mobile\package.json"))) {
    Write-Host "  1. Chưa có project Expo: xóa thư mục $Root rồi chạy lại script với -CreateExpo (create-expo-app cần thư mục mobile\ chưa tồn tại)."
}
Write-Host "  2. Đặt tên ứng dụng và Bundle ID trong mobile\app.json."
Write-Host "  3. Thêm hai profile dev và prod trong eas.json, mỗi profile một project Firebase."
