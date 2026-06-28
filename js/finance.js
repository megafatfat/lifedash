const finance = {
  data: { transactions: [], budget: 0 },
  calcExpr: '',
  
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
    this.initReportMonth();
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
  
  // ========== Calculator Keypad ==========
  calcInput(char) {
    const operators = ['+', '-', '*', '/'];
    const lastChar = this.calcExpr.slice(-1);
    
    if (operators.includes(char)) {
      if (this.calcExpr === '') return;
      if (operators.includes(lastChar)) {
        this.calcExpr = this.calcExpr.slice(0, -1) + char;
      } else {
        this.calcExpr += char;
      }
    } else {
      this.calcExpr += char;
    }
    
    this.updateCalcDisplay();
  },
  
  calcClear() {
    this.calcExpr = '';
    document.getElementById('calcAmount').value = '';
    this.updateCalcDisplay();
  },
  
  calcBackspace() {
    this.calcExpr = this.calcExpr.slice(0, -1);
    this.updateCalcDisplay();
  },
  
  calcEquals() {
    if (!this.calcExpr) return;
    
    const operators = ['+', '-', '*', '/'];
    let expr = this.calcExpr;
    if (operators.includes(expr.slice(-1))) {
      expr = expr.slice(0, -1);
    }
    
    if (!expr) return;
    
    // Validate expression contains only numbers and operators
    if (!/^[\d+\-*/.()]+$/.test(expr)) {
      app.showToast('計算式無效');
      return;
    }
    
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function('"use strict"; return (' + expr + ')')();
      const amount = parseFloat(result);
      
      if (!isFinite(amount) || isNaN(amount)) {
        app.showToast('計算式無效');
        return;
      }
      
      document.getElementById('calcAmount').value = amount.toFixed(2);
      this.calcExpr = '';
      this.updateCalcDisplay();
    } catch (e) {
      app.showToast('計算式無效');
    }
  },
  
  updateCalcDisplay() {
    const display = document.getElementById('calcDisplay');
    if (display) display.textContent = this.calcExpr;
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
    
    const dashBudget = document.getElementById('dashBudget');
    if (remaining < 0) {
      dashBudget.textContent = this.formatMoney(remaining);
      dashBudget.classList.add('negative');
    } else {
      dashBudget.textContent = this.formatMoney(remaining);
      dashBudget.classList.remove('negative');
    }
    
    document.getElementById('dashBudgetPercent').textContent = Math.round(percent) + '%';
    
    const bar = document.getElementById('dashBudgetBar');
    bar.style.width = Math.min(percent, 100) + '%';
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
    
    const finBudgetStatus = document.getElementById('finBudgetStatus');
    if (budget <= 0) {
      finBudgetStatus.textContent = '尚未設定預算';
      finBudgetStatus.classList.remove('negative');
    } else if (remaining < 0) {
      finBudgetStatus.textContent = `已超支 ${this.formatMoney(Math.abs(remaining))}`;
      finBudgetStatus.classList.add('negative');
    } else {
      finBudgetStatus.textContent = `還剩 ${this.formatMoney(remaining)}`;
      finBudgetStatus.classList.remove('negative');
    }
    
    const bar = document.getElementById('finBudgetBar');
    bar.style.width = Math.min(percent, 100) + '%';
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
  
  // ========== Monthly Report ==========
  initReportMonth() {
    const input = document.getElementById('reportMonth');
    if (input && !input.value) {
      input.value = new Date().toISOString().slice(0, 7);
    }
  },
  
  getMonthTransactions(yearMonth) {
    return this.data.transactions.filter(t => t.date && t.date.startsWith(yearMonth));
  },
  
  getMonthStats(yearMonth) {
    const txs = this.getMonthTransactions(yearMonth);
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    return { income, expense, balance: income - expense };
  },
  
  showReportModal() {
    const input = document.getElementById('reportMonth');
    const yearMonth = input ? input.value : new Date().toISOString().slice(0, 7);
    if (!yearMonth) {
      app.showToast('請選擇月份');
      return;
    }
    this.renderReport(yearMonth);
    document.getElementById('reportModal').classList.add('open');
  },
  
  hideReportModal() {
    document.getElementById('reportModal').classList.remove('open');
  },
  
  renderReport(yearMonth) {
    const [year, month] = yearMonth.split('-');
    const stats = this.getMonthStats(yearMonth);
    const budget = this.data.budget || 0;
    const percent = budget > 0 ? Math.min((stats.expense / budget) * 100, 100) : 0;
    const overBudget = budget > 0 && stats.expense > budget;
    
    document.getElementById('reportTitle').textContent = `${year}年${parseInt(month)}月 收支月結`;
    
    // Category breakdown
    const expenseTxs = this.getMonthTransactions(yearMonth).filter(t => t.type === 'expense');
    const totalExpense = stats.expense;
    const byCategory = {};
    expenseTxs.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + (parseFloat(t.amount) || 0);
    });
    const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    
    // Transaction list
    const allTxs = [...this.getMonthTransactions(yearMonth)].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    const categoryHtml = categories.length > 0
      ? `<div class="report-category-list">${categories.map(([cat, amount], i) => `
          <div class="report-category-item">
            <div class="legend-dot" style="background: ${this.colors[i % this.colors.length]}"></div>
            <div class="report-category-info" style="min-width:110px">
              <span class="report-category-name">${cat}</span>
              <span class="report-category-amount">${this.formatMoney(amount)}</span>
            </div>
            <div class="report-category-bar">
              <div class="report-category-fill" style="width: ${totalExpense > 0 ? (amount / totalExpense * 100) : 0}%; background: ${this.colors[i % this.colors.length]}"></div>
            </div>
            <span class="report-category-amount" style="min-width:40px;text-align:right">${totalExpense > 0 ? Math.round(amount / totalExpense * 100) : 0}%</span>
          </div>
        `).join('')}</div>`
      : '<div class="report-empty"><p>該月份暫時未有支出紀錄</p></div>';
    
    const transactionsHtml = allTxs.length > 0
      ? `<div class="report-transactions">${allTxs.map(t => `
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
          </div>
        `).join('')}</div>`
      : '<div class="report-empty"><p>該月份暫時未有紀錄</p></div>';
    
    document.getElementById('reportBody').innerHTML = `
      <div class="report-summary">
        <div class="summary-card income">
          <div class="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          </div>
          <div class="card-info">
            <span class="card-label">收入</span>
            <span class="card-value">${this.formatMoney(stats.income)}</span>
          </div>
        </div>
        <div class="summary-card expense">
          <div class="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
          </div>
          <div class="card-info">
            <span class="card-label">支出</span>
            <span class="card-value">${this.formatMoney(stats.expense)}</span>
          </div>
        </div>
        <div class="summary-card balance">
          <div class="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          </div>
          <div class="card-info">
            <span class="card-label">結餘</span>
            <span class="card-value ${stats.balance < 0 ? 'negative' : ''}">${this.formatMoney(stats.balance)}</span>
          </div>
        </div>
      </div>
      
      ${budget > 0 ? `
      <div class="report-section">
        <h4>預算使用</h4>
        <div class="budget-bar-container">
          <div class="budget-label">
            <span>${overBudget ? '已超支' : '已使用'}</span>
            <span class="${overBudget ? 'negative' : ''}">${Math.round((stats.expense / budget) * 100)}%</span>
          </div>
          <div class="budget-bar">
            <div class="budget-bar-fill ${overBudget ? 'danger' : percent > 70 ? 'warning' : ''}" style="width: ${percent}%"></div>
          </div>
          <p class="budget-status" style="text-align:left;margin-top:8px">預算 ${this.formatMoney(budget)}，${overBudget ? '超支' : '剩餘'} ${this.formatMoney(Math.abs(budget - stats.expense))}</p>
        </div>
      </div>
      ` : ''}
      
      <div class="report-section">
        <h4>支出分類</h4>
        ${categoryHtml}
      </div>
      
      <div class="report-section">
        <h4>交易明細</h4>
        ${transactionsHtml}
      </div>
    `;
  },
  
  showAddModal() {
    document.getElementById('addModal').classList.add('open');
    this.updateCategories();
    this.calcExpr = '';
    this.updateCalcDisplay();
  },
  
  hideAddModal() {
    document.getElementById('addModal').classList.remove('open');
    document.querySelector('#addModal form').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    this.updateCategories();
    this.calcExpr = '';
    this.updateCalcDisplay();
  },
  
  async addTransaction(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const amount = parseFloat(fd.get('amount'));
    
    if (isNaN(amount) || amount <= 0) {
      app.showToast('請輸入有效金額');
      return;
    }
    
    const tx = {
      type: fd.get('type'),
      amount: amount,
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
