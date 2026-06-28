-- LifeDash Supabase Database Setup
-- 請去 https://app.supabase.com/project/mhmkxrvhepiowyjaalsa/sql/editor
-- 貼上以下 SQL 並執行

-- 收支紀錄表
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_key TEXT NOT NULL DEFAULT 'default',
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
  user_key TEXT NOT NULL DEFAULT 'default',
  budget_amount DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- 番茄時鐘統計表
CREATE TABLE IF NOT EXISTS pomodoro_stats (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_key TEXT NOT NULL DEFAULT 'default',
  total_completed INTEGER NOT NULL DEFAULT 0,
  total_focus_minutes INTEGER NOT NULL DEFAULT 0
);

-- 世界時間城市表
CREATE TABLE IF NOT EXISTS clock_cities (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_key TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  timezone TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 為現有數據加上預設 user_key（如果已經有舊數據）
UPDATE transactions SET user_key = 'default' WHERE user_key IS NULL;
UPDATE budgets SET user_key = 'default' WHERE user_key IS NULL;
UPDATE pomodoro_stats SET user_key = 'default' WHERE user_key IS NULL;
UPDATE clock_cities SET user_key = 'default' WHERE user_key IS NULL;

-- 啟用 Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_cities ENABLE ROW LEVEL SECURITY;

-- 刪除舊政策（如果存在）
DROP POLICY IF EXISTS access_with_user_key ON transactions;
DROP POLICY IF EXISTS access_with_user_key ON budgets;
DROP POLICY IF EXISTS access_with_user_key ON pomodoro_stats;
DROP POLICY IF EXISTS access_with_user_key ON clock_cities;

-- 建立新政策：只有帶正確 x-user-key header 的請求才能讀寫自己的數據
CREATE POLICY access_with_user_key ON transactions
  FOR ALL
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key')
  WITH CHECK (user_key = current_setting('request.headers', true)::json->>'x-user-key');

CREATE POLICY access_with_user_key ON budgets
  FOR ALL
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key')
  WITH CHECK (user_key = current_setting('request.headers', true)::json->>'x-user-key');

CREATE POLICY access_with_user_key ON pomodoro_stats
  FOR ALL
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key')
  WITH CHECK (user_key = current_setting('request.headers', true)::json->>'x-user-key');

CREATE POLICY access_with_user_key ON clock_cities
  FOR ALL
  USING (user_key = current_setting('request.headers', true)::json->>'x-user-key')
  WITH CHECK (user_key = current_setting('request.headers', true)::json->>'x-user-key');
