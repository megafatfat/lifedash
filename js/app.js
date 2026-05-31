const app = {
  currentView: 'dashboard',
  
  async init() {
    db.init();
    
    // Init modules (async data loading)
    await finance.init();
    await worldClock.init();
    await pomodoro.init();
    cheque.init();
    
    this.navigate('dashboard');
    this.setupPWA();
    
    // Set default date in modal
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('transactionDate');
    if (dateInput) dateInput.value = today;
  },
  
  navigate(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    
    const target = document.getElementById(`view-${view}`);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');
    
    this.currentView = view;
    
    if (view === 'dashboard') finance.updateDashboard();
    if (view === 'finance') finance.updateFinanceView();
  },
  
  toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
  },
  
  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  },
  
  setupPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
