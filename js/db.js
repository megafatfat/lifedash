// Supabase Client & Database Operations
const SUPABASE_URL = 'https://mhmkxrvhepiowyjaalsa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obWt4cnZoZXBpb3d5amFhbHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzIxNjQsImV4cCI6MjA5NTgwODE2NH0.dkInDDmixAKnpDBpML5r2TFZ0O1twwyvPbgFMer_ekM';

// ⚠️ 請改成你自己的密鑰，建議用一組隨機字母數字組合
// 例如：'ld-2024-your-random-string'
const USER_KEY = 'default';

const db = {
  client: null,
  online: navigator.onLine,
  
  init() {
    if (window.supabase) {
      this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: {
          headers: {
            'x-user-key': USER_KEY
          }
        }
      });
    }
    
    window.addEventListener('online', () => { this.online = true; app.showToast('已連接網絡，數據同步中...'); });
    window.addEventListener('offline', () => { this.online = false; app.showToast('已離線，使用本地備份'); });
  },
  
  isReady() {
    return this.client && this.online;
  },
  
  // ========== TRANSACTIONS ==========
  async getTransactions() {
    if (!this.isReady()) return this.getLocal('lifedash_transactions') || [];
    try {
      const { data, error } = await this.client.from('transactions').select('*').eq('user_key', USER_KEY).order('date', { ascending: false });
      if (error) throw error;
      // Cache locally
      this.setLocal('lifedash_transactions', data || []);
      return data || [];
    } catch (e) {
      return this.getLocal('lifedash_transactions') || [];
    }
  },
  
  async addTransaction(tx) {
    if (!this.isReady()) {
      const txs = this.getLocal('lifedash_transactions') || [];
      txs.push({ ...tx, id: Date.now() });
      this.setLocal('lifedash_transactions', txs);
      return { id: Date.now() };
    }
    try {
      const { data, error } = await this.client.from('transactions').insert([{ ...tx, user_key: USER_KEY }]).select().single();
      if (error) throw error;
      // Update local cache
      const txs = await this.getTransactions();
      return data;
    } catch (e) {
      const txs = this.getLocal('lifedash_transactions') || [];
      txs.push({ ...tx, id: Date.now() });
      this.setLocal('lifedash_transactions', txs);
      return { id: Date.now() };
    }
  },
  
  async deleteTransaction(id) {
    if (!this.isReady()) {
      const txs = (this.getLocal('lifedash_transactions') || []).filter(t => t.id !== id);
      this.setLocal('lifedash_transactions', txs);
      return;
    }
    try {
      await this.client.from('transactions').delete().eq('id', id).eq('user_key', USER_KEY);
      const txs = (this.getLocal('lifedash_transactions') || []).filter(t => t.id !== id);
      this.setLocal('lifedash_transactions', txs);
    } catch (e) {
      const txs = (this.getLocal('lifedash_transactions') || []).filter(t => t.id !== id);
      this.setLocal('lifedash_transactions', txs);
    }
  },
  
  // ========== BUDGET ==========
  async getBudget() {
    if (!this.isReady()) return this.getLocal('lifedash_budget') || { budget: 0 };
    try {
      const { data, error } = await this.client.from('budgets').select('*').eq('user_key', USER_KEY).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      const budget = data ? { budget: data.budget_amount } : { budget: 0 };
      this.setLocal('lifedash_budget', budget);
      return budget;
    } catch (e) {
      return this.getLocal('lifedash_budget') || { budget: 0 };
    }
  },
  
  async saveBudget(amount) {
    const payload = { budget_amount: amount, user_key: USER_KEY };
    if (!this.isReady()) {
      this.setLocal('lifedash_budget', { budget: amount });
      return;
    }
    try {
      const { data: existing } = await this.client.from('budgets').select('id').eq('user_key', USER_KEY).limit(1).single();
      if (existing) {
        await this.client.from('budgets').update(payload).eq('id', existing.id).eq('user_key', USER_KEY);
      } else {
        await this.client.from('budgets').insert([payload]);
      }
      this.setLocal('lifedash_budget', { budget: amount });
    } catch (e) {
      this.setLocal('lifedash_budget', { budget: amount });
    }
  },
  
  // ========== POMODORO ==========
  async getPomodoroStats() {
    if (!this.isReady()) return this.getLocal('lifedash_pomodoro') || { totalCompleted: 0, totalFocusMinutes: 0 };
    try {
      const { data, error } = await this.client.from('pomodoro_stats').select('*').eq('user_key', USER_KEY).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      const stats = data ? { totalCompleted: data.total_completed, totalFocusMinutes: data.total_focus_minutes } : { totalCompleted: 0, totalFocusMinutes: 0 };
      this.setLocal('lifedash_pomodoro', stats);
      return stats;
    } catch (e) {
      return this.getLocal('lifedash_pomodoro') || { totalCompleted: 0, totalFocusMinutes: 0 };
    }
  },
  
  async savePomodoroStats(stats) {
    if (!this.isReady()) {
      this.setLocal('lifedash_pomodoro', stats);
      return;
    }
    try {
      const { data: existing } = await this.client.from('pomodoro_stats').select('id').eq('user_key', USER_KEY).limit(1).single();
      const payload = { total_completed: stats.totalCompleted, total_focus_minutes: stats.totalFocusMinutes, user_key: USER_KEY };
      if (existing) {
        await this.client.from('pomodoro_stats').update(payload).eq('id', existing.id).eq('user_key', USER_KEY);
      } else {
        await this.client.from('pomodoro_stats').insert([payload]);
      }
      this.setLocal('lifedash_pomodoro', stats);
    } catch (e) {
      this.setLocal('lifedash_pomodoro', stats);
    }
  },
  
  // ========== CLOCK CITIES ==========
  async getClockCities() {
    if (!this.isReady()) return this.getLocal('lifedash_clocks') || [];
    try {
      const { data, error } = await this.client.from('clock_cities').select('*').eq('user_key', USER_KEY).order('sort_order');
      if (error) throw error;
      this.setLocal('lifedash_clocks', data || []);
      return data || [];
    } catch (e) {
      return this.getLocal('lifedash_clocks') || [];
    }
  },
  
  async saveClockCities(cities) {
    if (!this.isReady()) {
      this.setLocal('lifedash_clocks', cities);
      return;
    }
    try {
      await this.client.from('clock_cities').delete().eq('user_key', USER_KEY);
      if (cities.length > 0) {
        const payload = cities.map((c, i) => ({
          name: c.name,
          region: c.region,
          timezone: c.timezone,
          sort_order: i,
          user_key: USER_KEY
        }));
        await this.client.from('clock_cities').insert(payload);
      }
      this.setLocal('lifedash_clocks', cities);
    } catch (e) {
      this.setLocal('lifedash_clocks', cities);
    }
  },
  
  // ========== LOCAL STORAGE HELPERS ==========
  getLocal(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  
  setLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
