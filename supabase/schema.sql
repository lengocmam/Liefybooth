-- ==============================================================================
-- LEAFYBOOTH SUPABASE DATABASE SCHEMA
-- Bảng dữ liệu người dùng, khoảnh khắc và dải ảnh Photobooth
-- Chạy đoạn script này tại Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. BẢNG HỒ SƠ NGƯỜI DÙNG (PROFILES)
create table if not exists public.profiles (
  id text primary key,
  phone text unique not null,
  name text not null,
  username text unique not null,
  avatar_letter text default 'L',
  avatar_color text default '#C8F135',
  role_description text default 'Thành viên LeafyBooth 🌱',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật tính năng Row Level Security (Bảo mật theo dòng)
alter table public.profiles enable row level security;

-- Cho phép đọc công khai (mọi người trong app đều thấy hồ sơ bạn bè)
create policy "Cho phép mọi người đọc hồ sơ profiles" 
  on public.profiles for select 
  using (true);

-- Cho phép tạo mới và chỉnh sửa hồ sơ của chính mình
create policy "Cho phép người dùng tạo hoặc cập nhật hồ sơ" 
  on public.profiles for all 
  using (true) 
  with check (true);

-- 2. BẢNG KHOẢN KHẮC VÀ DẢI PHOTOBOOTH (USER_MOMENTS)
create table if not exists public.user_moments (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  image_url text not null,
  type text default 'strip', -- 'strip' | 'locket' | 'video'
  caption text,
  likes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chỉ mục tối ưu tốc độ tải danh sách ảnh theo user và thời gian
create index if not exists idx_user_moments_user_id on public.user_moments(user_id);
create index if not exists idx_user_moments_created_at on public.user_moments(created_at desc);

-- Bật tính năng Row Level Security
alter table public.user_moments enable row level security;

-- Cho phép đọc ảnh
create policy "Cho phép mọi người đọc user_moments" 
  on public.user_moments for select 
  using (true);

-- Cho phép thêm ảnh mới
create policy "Cho phép tạo mới user_moments" 
  on public.user_moments for insert 
  with check (true);

-- Cho phép xóa ảnh của chính mình
create policy "Cho phép xóa user_moments" 
  on public.user_moments for delete 
  using (true);

-- 3. TẠO BUCKET LƯU TRỮ ẢNH & VIDEO (STORAGE BUCKET)
-- Bạn cũng có thể tạo bucket này thủ công tại mục "Storage" trên giao diện Supabase với tên: "booth-assets"
insert into storage.buckets (id, name, public) 
values ('booth-assets', 'booth-assets', true)
on conflict (id) do nothing;

create policy "Cho phép tải lên booth-assets" 
  on storage.objects for insert 
  with check (bucket_id = 'booth-assets');

create policy "Cho phép xem công khai booth-assets" 
  on storage.objects for select 
  using (bucket_id = 'booth-assets');
