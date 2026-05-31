const pomodoro = {
  modes: {
    focus: { minutes: 25, label: '專注時間' },
    short: { minutes: 5, label: '短休息' },
    long: { minutes: 15, label: '長休息' }
  },
  
  currentMode: 'focus',
  timeLeft: 25 * 60,
  isRunning: false,
  timer: null,
  totalCompleted: 0,
  totalFocusMinutes: 0,
  
  async init() {
    const stats = await db.getPomodoroStats();
    this.totalCompleted = stats.totalCompleted || 0;
    this.totalFocusMinutes = stats.totalFocusMinutes || 0;
    this.updateDisplay();
    this.updateStats();
    
    if ('Notification' in navigator && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },
  
  setMode(mode) {
    this.pause();
    this.currentMode = mode;
    this.timeLeft = this.modes[mode].minutes * 60;
    this.updateDisplay();
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    document.getElementById('pomoLabel').textContent = this.modes[mode].label;
  },
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    document.getElementById('pomoStartBtn').textContent = '進行中';
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      
      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  },
  
  pause() {
    this.isRunning = false;
    clearInterval(this.timer);
    document.getElementById('pomoStartBtn').textContent = '開始';
  },
  
  reset() {
    this.pause();
    this.timeLeft = this.modes[this.currentMode].minutes * 60;
    this.updateDisplay();
  },
  
  async complete() {
    this.pause();
    
    if (this.currentMode === 'focus') {
      this.totalCompleted++;
      this.totalFocusMinutes += this.modes.focus.minutes;
      await db.savePomodoroStats({
        totalCompleted: this.totalCompleted,
        totalFocusMinutes: this.totalFocusMinutes
      });
      this.updateStats();
    }
    
    if ('Notification' in navigator && Notification.permission === 'granted') {
      const title = this.currentMode === 'focus' ? '專注完成！' : '休息結束！';
      const body = this.currentMode === 'focus' ? '做得好！是時候休息一下。' : '準備好開始下一個專注時段了嗎？';
      new Notification(title, { body, icon: 'icons/icon-192x192.png' });
    }
    
    app.showToast(this.currentMode === 'focus' ? '專注時段完成！' : '休息結束！');
    
    if (this.currentMode === 'focus') {
      this.setMode('short');
    } else {
      this.setMode('focus');
    }
  },
  
  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    document.getElementById('pomoTime').textContent = 
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const total = this.modes[this.currentMode].minutes * 60;
    const progress = (total - this.timeLeft) / total;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference * (1 - progress);
    document.getElementById('pomoProgress').style.strokeDashoffset = offset;
  },
  
  updateStats() {
    document.getElementById('pomoCompleted').textContent = this.totalCompleted;
    document.getElementById('pomoFocusTime').textContent = this.totalFocusMinutes;
  }
};
