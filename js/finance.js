const finance = {
  data: { transactions: [], budget: 0 },
  
  categories: {
    expense: ['飲食', '交通', '購物', '娛樂', '家居', '醫療', '教育', '其他'],
    income: ['薪金', '獎金', '投資', '兼職', '禮金', '其他']
  },
  
  colors: ['#8B7355', '#B85C50', '#6B8E9F', '#7A8B6E', '#D4A373', '#A0937D', '#C4A77D', '#9B8B7A'],
  
  async init() {
    await this.loadData();
    this.updateCategories();
    this.updateDashboard();
    this.updateFinanceView();
  },
  
  async loadData() {
    // Load from Supabase (with localStorage fallback built into db.js)
    const txs = await db.getTransactions();
    const budgetData = await db.getBudget();
    
    // Migrate old localStorage data if exists and Supabase is empty
    if (txs.length === 0) {
      const oldTxs = JSON.parse(localStorage.getItem('lifedash_finance') || '{}').transactions || [];
      if (oldTxs.length > 0) {
        for (const tx of oldTxs) {
          await db.addTransaction({
            type: tx.type,
            amount: tx.amount,
            category: tx.category,
            note: tx.note,
            date: tx.date
          });
        }
        this.data.transactions = await db.getTransactions();
      } else {
        this.data.transactions = [];
      }
    } else {
      this.data.transactions = txs;
    }
    
    this.data.budget = budgetData.budget || 0;
    
    // Also migrate old budget
    if (this.data.budget === 0) {
      const oldFinance = JSON.parse(localStorage.getItem('lifedash_finance') || '{}');
      if (oldFinance.budget) {
        this.data.budget = oldFinance.budget;
        await db.saveBudget(this.data.budget);
      }
    }
  },
  
  updateCategories() {
    const type = document.querySelector('input[name="type"]:checked')?.value || 'expense';
    const select = document.getElementById('categorySelect');
    select.innerHTML = this.categories[type].map(c => `<option value="${c}">${c}</option>`).join('');
  },
  
  getCurrentMonthTransactions() {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    return this.data.transactions.filter(t => t.date && t.date.startsWith(yearMonth));
  },
  
  getMonthStats() {
    const txs = this.getCurrentMonthTransactions();
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    return { income, expense, balance: income - expense };
  },
  
  formatMoney(amount) {
    return 'HK$ ' + (parseFloat(amount) || 0).toLocaleString('zh-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  
  updateDashboard() {
    const stats = this.getMonthStats();
    const budget = this.data.budget || 0;
    const spent = stats.expense;
    const remaining = budget - spent;
    const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    
    document.getElementById('dashIncome').textContent = this.formatMoney(stats.income);
    document.getElementById('dashExpense').textContent = this.formatMoney(stats.expense);
    document.getElementById('dashBalance').textContent = this.formatMoney(stats.balance);
    document.getElementById('dashBudget').textContent = this.formatMoney(Math.max(remaining, 0));
    document.getElementById('dashBudgetPercent').textContent = Math.round(percent) + '%';
    
    const bar = document.getElementById('dashBudgetBar');
    bar.style.width = percent + '%';
    bar.className = 'budget-bar-fill' + (percent > 90 ? ' danger' : percent > 70 ? ' warning' : '');
  },
  
  updateFinanceView() {
    const stats = this.getMonthStats();
    const budget = this.data.budget || 0;
    const spent = stats.expense;
    const remaining = budget - spent;
    const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    
    document.getElementById('finIncome').textContent = this.formatMoney(stats.income);
    document.getElementById('finExpense').textContent = this.formatMoney(stats.expense);
    document.getElementById('finBalance').textContent = this.formatMoney(stats.balance);
    document.getElementById('finBudgetSpent').textContent = this.formatMoney(spent);
    document.getElementById('finBudgetTotal').textContent = this.formatMoney(budget);
    document.getElementById('finBudgetStatus').textContent = budget > 0 
      ? `還剩 ${this.formatMoney(Math.max(remaining, 0))}` 
      : '尚未設定預算';
    
    const bar = document.getElementById('finBudgetBar');
    bar.style.width = percent + '%';
    bar.className = 'budget-bar-fill' + (percent > 90 ? ' danger' : percent > 70 ? ' warning' : '');
    
    this.renderTransactions();
    this.renderChart();
  },
  
  renderTransactions() {
    const list = document.getElementById('transactionList');
    const txs = [...this.data.transactions].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    if (txs.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <p>暫時未有紀錄</p>
          <button class="text-btn" onclick="finance.showAddModal()">新增第一筆</button>
        </div>`;
      return;
    }
    
    list.innerHTML = txs.map(t => `
      <div class="transaction-item">
        <div class="tx-icon ${t.type}">${t.type === 'income' ? '+' : '−'}</div>
        <div class="tx-details">
          <div class="tx-category">${t.category}</div>
          <div class="tx-note">${t.note || ''}</div>
        </div>
        <div>
          <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '−'}${this.formatMoney(t.amount)}</div>
          <div class="tx-date">${t.date}</div>
        </div>
        <button class="tx-delete" onclick="finance.deleteTransaction(${t.id})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `).join('');
  },
  
  renderChart() {
    const txs = this.getCurrentMonthTransactions().filter(t => t.type === 'expense');
    const total = txs.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    
    document.getElementById('chartTotal').textContent = this.formatMoney(total);
    
    const byCategory = {};
    txs.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + (parseFloat(t.amount) || 0);
    });
    
    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const svg = document.querySelector('.donut');
    
    svg.querySelectorAll('.donut-segment').forEach(el => el.remove());
    
    let accumulated = 0;
    
    entries.forEach(([cat, amount], i) => {
      const pct = total > 0 ? amount / total : 0;
      const dashArray = `${pct * 100} ${100 - pct * 100}`;
      const dashOffset = -accumulated * 100 + 25;
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'donut-segment');
      circle.setAttribute('cx', '18');
      circle.setAttribute('cy', '18');
      circle.setAttribute('r', '15.9155');
      circle.setAttribute('stroke', this.colors[i % this.colors.length]);
      circle.setAttribute('stroke-dasharray', dashArray);
      circle.setAttribute('stroke-dashoffset', dashOffset);
      svg.appendChild(circle);
      
      accumulated += pct;
    });
    
    const legend = document.getElementById('chartLegend');
    legend.innerHTML = entries.map(([cat, amount], i) => `
      <div class="legend-item">
        <div class="legend-dot" style="background: ${this.colors[i % this.colors.length]}"></div>
        <span class="legend-label">${cat}</span>
        <span class="legend-value">${this.formatMoney(amount)}</span>
      </div>
    `).join('');
  },
  
  showAddModal() {
    document.getElementById('addModal').classList.add('open');
    this.updateCategories();
  },
  
  hideAddModal() {
    document.getElementById('addModal').classList.remove('open');
    document.querySelector('#addModal form').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    this.updateCategories();
  },
  
  async addTransaction(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tx = {
      type: fd.get('type'),
      amount: parseFloat(fd.get('amount')),
      category: fd.get('category'),
      note: fd.get('note'),
      date: fd.get('date')
    };
    
    await db.addTransaction(tx);
    this.data.transactions = await db.getTransactions();
    this.hideAddModal();
    this.updateDashboard();
    this.updateFinanceView();
    app.showToast('已儲存紀錄');
  },
  
  async deleteTransaction(id) {
    await db.deleteTransaction(id);
    this.data.transactions = await db.getTransactions();
    this.updateDashboard();
    this.updateFinanceView();
    app.showToast('已刪除');
  },
  
  editBudget() {
    document.getElementById('budgetInput').value = this.data.budget || '';
    document.getElementById('budgetModal').classList.add('open');
  },
  
  hideBudgetModal() {
    document.getElementById('budgetModal').classList.remove('open');
  },
  
  async saveBudget(e) {
    e.preventDefault();
    const amount = parseFloat(e.target.budget.value) || 0;
    this.data.budget = amount;
    await db.saveBudget(amount);
    this.hideBudgetModal();
    this.updateDashboard();
    this.updateFinanceView();
    app.showToast('預算已更新');
  }
};
