export function numberToWordsIndian(num) {
  if (num === 0) return 'Zero';
  
  num = Math.floor(num);
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function helper(n) {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  }
  
  let res = '';
  
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  
  if (crore > 0) {
    res += helper(crore) + ' Crore ';
  }
  if (lakh > 0) {
    res += helper(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    res += helper(thousand) + ' Thousand ';
  }
  if (num > 0) {
    res += helper(num);
  }
  
  return res.trim().replace(/\s+/g, ' ');
}

export function numberToWordsWestern(num) {
  if (num === 0) return 'Zero';
  
  num = Math.floor(num);
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function helper(n) {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  }
  
  let res = '';
  
  const billion = Math.floor(num / 1000000000);
  num %= 1000000000;
  
  const million = Math.floor(num / 1000000);
  num %= 1000000;
  
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  
  if (billion > 0) {
    res += helper(billion) + ' Billion ';
  }
  if (million > 0) {
    res += helper(million) + ' Million ';
  }
  if (thousand > 0) {
    res += helper(thousand) + ' Thousand ';
  }
  if (num > 0) {
    res += helper(num);
  }
  
  return res.trim().replace(/\s+/g, ' ');
}

export function formatSalaryInWords(num, currencyCode = 'INR') {
  if (currencyCode === 'INR') {
    const words = numberToWordsIndian(num);
    if (!words || words === 'Zero') return 'Zero Rupees';
    return `Rupees ${words} Only`;
  }
  
  const words = numberToWordsWestern(num);
  if (!words || words === 'Zero') {
    if (currencyCode === 'USD') return 'Zero Dollars';
    if (currencyCode === 'EUR') return 'Zero Euros';
    if (currencyCode === 'GBP') return 'Zero Pounds';
    return 'Zero';
  }
  
  if (currencyCode === 'USD') return `${words} Dollars Only`;
  if (currencyCode === 'EUR') return `${words} Euros Only`;
  if (currencyCode === 'GBP') return `${words} Pounds Only`;
  return `${words} Only`;
}
