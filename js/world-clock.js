const worldClock = {
  cities: [
    { name: '香港', region: '亞洲', timezone: 'Asia/Hong_Kong' },
    { name: '台北', region: '亞洲', timezone: 'Asia/Taipei' },
    { name: '東京', region: '亞洲', timezone: 'Asia/Tokyo' },
    { name: '首爾', region: '亞洲', timezone: 'Asia/Seoul' },
    { name: '新加坡', region: '亞洲', timezone: 'Asia/Singapore' },
    { name: '曼谷', region: '亞洲', timezone: 'Asia/Bangkok' },
    { name: '迪拜', region: '中東', timezone: 'Asia/Dubai' },
    { name: '倫敦', region: '歐洲', timezone: 'Europe/London' },
    { name: '巴黎', region: '歐洲', timezone: 'Europe/Paris' },
    { name: '柏林', region: '歐洲', timezone: 'Europe/Berlin' },
    { name: '莫斯科', region: '歐洲', timezone: 'Europe/Moscow' },
    { name: '紐約', region: '美洲', timezone: 'America/New_York' },
    { name: '洛杉磯', region: '美洲', timezone: 'America/Los_Angeles' },
    { name: '芝加哥', region: '美洲', timezone: 'America/Chicago' },
    { name: '多倫多', region: '美洲', timezone: 'America/Toronto' },
    { name: '溫哥華', region: '美洲', timezone: 'America/Vancouver' },
    { name: '悉尼', region: '大洋洲', timezone: 'Australia/Sydney' },
    { name: '墨爾本', region: '大洋洲', timezone: 'Australia/Melbourne' },
    { name: '奧克蘭', region: '大洋洲', timezone: 'Pacific/Auckland' }
  ],
  
  selected: [],
  timer: null,
  
  init() {
    this.loadData();
    this.populateSelect();
    this.render();
    this.startTick();
  },
  
  loadData() {
    const stored = localStorage.getItem('lifedash_clocks');
    if (stored) {
      this.selected = JSON.parse(stored);
    } else {
      // Default: Hong Kong, London, New York, Tokyo
      this.selected = [
        { name: '香港', region: '亞洲', timezone: 'Asia/Hong_Kong' },
        { name: '倫敦', region: '歐洲', timezone: 'Europe/London' },
        { name: '紐約', region: '美洲', timezone: 'America/New_York' },
        { name: '東京', region: '亞洲', timezone: 'Asia/Tokyo' }
      ];
    }
  },
  
  saveData() {
    localStorage.setItem('lifedash_clocks', JSON.stringify(this.selected));
  },
  
  populateSelect() {
    const select = document.getElementById('citySelect');
    const used = new Set(this.selected.map(c => c.timezone));
    
    select.innerHTML = '<option value="">選擇城市...</option>' +
      this.cities
        .filter(c => !used.has(c.timezone))
        .map(c => `<option value="${c.timezone}">${c.name} (${c.region})</option>`)
        .join('');
  },
  
  addCity() {
    const select = document.getElementById('citySelect');
    const tz = select.value;
    if (!tz) return;
    
    const city = this.cities.find(c => c.timezone === tz);
    if (city) {
      this.selected.push(city);
      this.saveData();
      this.populateSelect();
      this.render();
      select.value = '';
      app.showToast(`已新增 ${city.name}`);
    }
  },
  
  removeCity(index) {
    const name = this.selected[index].name;
    this.selected.splice(index, 1);
    this.saveData();
    this.populateSelect();
    this.render();
    app.showToast(`已移除 ${name}`);
  },
  
  render() {
    const grid = document.getElementById('clockGrid');
    
    if (this.selected.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>請新增城市</p></div>';
      return;
    }
    
    grid.innerHTML = this.selected.map((city, i) => {
      const time = this.getCityTime(city.timezone);
      return `
        <div class="clock-card">
          <button class="clock-remove" onclick="worldClock.removeCity(${i})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div class="clock-city">${city.name}</div>
          <div class="clock-region">${city.region}</div>
          <div class="clock-time" data-tz="${city.timezone}">${time.time}</div>
          <div class="clock-date" data-tz="${city.timezone}">${time.date}</div>
          <div class="clock-offset">${time.offset}</div>
        </div>
      `;
    }).join('');
  },
  
  getCityTime(timezone) {
    const now = new Date();
    const options = { timeZone: timezone, hour12: false };
    
    const timeStr = now.toLocaleTimeString('zh-HK', { ...options, hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('zh-HK', { ...options, month: 'short', day: 'numeric', weekday: 'short' });
    
    // Calculate offset
    const hkTime = now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong', hour12: false });
    const cityTime = now.toLocaleString('en-US', { timeZone: timezone, hour12: false });
    const hkDate = new Date(hkTime);
    const cDate = new Date(cityTime);
    const diff = (cDate - hkDate) / (1000 * 60 * 60);
    const diffRounded = Math.round(diff);
    const offsetText = diffRounded === 0 ? '與香港相同' : 
      diffRounded > 0 ? `快 ${diffRounded} 小時` : `慢 ${Math.abs(diffRounded)} 小時`;
    
    return { time: timeStr, date: dateStr, offset: offsetText };
  },
  
  startTick() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      document.querySelectorAll('.clock-time').forEach(el => {
        const tz = el.dataset.tz;
        const time = this.getCityTime(tz);
        el.textContent = time.time;
        el.nextElementSibling.textContent = time.date;
      });
    }, 1000);
  }
};
