const cheque = {
  chineseDigits: ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'],
  chineseUnits: ['', '拾', '佰', '仟'],
  chineseBigUnits: ['', '萬', '億'],
  
  englishOnes: ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'],
  englishTeens: ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'],
  englishTens: ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'],
  
  init() {
    this.generate();
  },
  
  generate() {
    const input = document.getElementById('chequeAmount');
    const amount = parseFloat(input.value) || 0;
    
    const chinese = this.toChinese(amount);
    const english = this.toEnglish(amount);
    const numStr = amount.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById('chequeChinese').textContent = chinese;
    document.getElementById('chequeEnglish').textContent = english;
    
    document.getElementById('previewAmountChi').textContent = chinese;
    document.getElementById('previewAmountEng').textContent = english;
    document.getElementById('previewAmountNum').textContent = numStr;
  },
  
  toChinese(amount) {
    if (amount === 0) return '港幣零元正';
    
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);
    
    let result = '港幣';
    
    if (dollars > 0) {
      result += this.convertIntegerToChinese(dollars) + '元';
    } else {
      result += '零元';
    }
    
    if (cents > 0) {
      const jiao = Math.floor(cents / 10);
      const fen = cents % 10;
      if (dollars > 0 && jiao === 0 && fen > 0) result += '零';
      if (jiao > 0) result += this.chineseDigits[jiao] + '角';
      if (fen > 0) result += this.chineseDigits[fen] + '分';
    } else {
      result += '正';
    }
    
    return result;
  },
  
  convertIntegerToChinese(num) {
    if (num === 0) return '零';
    
    let result = '';
    let unitIndex = 0;
    
    while (num > 0) {
      const segment = num % 10000;
      if (segment !== 0) {
        const segmentStr = this.convertSegment(segment);
        result = segmentStr + this.chineseBigUnits[unitIndex] + result;
      } else if (result !== '' && !result.startsWith('零')) {
        result = '零' + result;
      }
      num = Math.floor(num / 10000);
      unitIndex++;
    }
    
    // Clean up consecutive zeros
    result = result.replace(/零+/g, '零');
    result = result.replace(/零$/, '');
    result = result.replace(/零萬/g, '萬');
    result = result.replace(/零億/g, '億');
    
    return result;
  },
  
  convertSegment(num) {
    let result = '';
    let hasZero = false;
    
    for (let i = 0; i < 4 && num > 0; i++) {
      const digit = num % 10;
      if (digit === 0) {
        hasZero = true;
      } else {
        if (hasZero) {
          result = '零' + result;
          hasZero = false;
        }
        result = this.chineseDigits[digit] + this.chineseUnits[i] + result;
      }
      num = Math.floor(num / 10);
    }
    
    return result;
  },
  
  toEnglish(amount) {
    if (amount === 0) return 'SAY HONG KONG DOLLARS ZERO ONLY';
    
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);
    
    let result = 'SAY HONG KONG DOLLARS ';
    
    if (dollars > 0) {
      result += this.convertIntegerToEnglish(dollars);
    } else {
      result += 'ZERO';
    }
    
    if (cents > 0) {
      result += ' AND CENTS ' + this.convertIntegerToEnglish(cents);
    }
    
    result += ' ONLY';
    return result;
  },
  
  convertIntegerToEnglish(num) {
    if (num === 0) return 'ZERO';
    if (num < 10) return this.englishOnes[num];
    if (num < 20) return this.englishTeens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return this.englishTens[ten] + (one > 0 ? '-' + this.englishOnes[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      return this.englishOnes[hundred] + ' HUNDRED' + (rest > 0 ? ' AND ' + this.convertIntegerToEnglish(rest) : '');
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const rest = num % 1000;
      return this.convertIntegerToEnglish(thousand) + ' THOUSAND' + (rest > 0 ? ' ' + this.convertIntegerToEnglish(rest) : '');
    }
    if (num < 1000000000) {
      const million = Math.floor(num / 1000000);
      const rest = num % 1000000;
      return this.convertIntegerToEnglish(million) + ' MILLION' + (rest > 0 ? ' ' + this.convertIntegerToEnglish(rest) : '');
    }
    
    const billion = Math.floor(num / 1000000000);
    const rest = num % 1000000000;
    return this.convertIntegerToEnglish(billion) + ' BILLION' + (rest > 0 ? ' ' + this.convertIntegerToEnglish(rest) : '');
  },
  
  copy(lang) {
    const text = document.getElementById(lang === 'chinese' ? 'chequeChinese' : 'chequeEnglish').textContent;
    navigator.clipboard.writeText(text).then(() => {
      app.showToast('已複製到剪貼簿');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      app.showToast('已複製到剪貼簿');
    });
  }
};
