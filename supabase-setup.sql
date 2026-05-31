-- LifeDash Supabase Database Setup
-- 請去 https://app.supabase.com/project/mhmkxrvhepiowyjaalsa/sql/editor
-- 貼上以下 SQL 並執行

-- 收支紀錄表
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL
);

-- 預算表
CREATE TABLE IF NOT EXISTS budgets (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  budget_amount DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- 番茄時鐘統計表
CREATE TABLE IF NOT EXISTS pomodoro_stats (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_completed INTEGER NOT NULL DEFAULT 0,
  total_focus_minutes INTEGER NOT NULL DEFAULT 0
);

-- 世界時間城市表
CREATE TABLE IF NOT EXISTS clock_cities (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  timezone TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 關閉 Row Level Security（因為冇用戶認證，純個人使用）
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE clock_cities DISABLE ROW LEVEL SECURITY;
