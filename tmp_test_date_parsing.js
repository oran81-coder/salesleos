function parseHebrewMonthTab(tabName) {
    const monthMap = {
        'ינואר': '01', 'פברואר': '02', 'פבואר': '02', 'מרץ': '03', 'אפריל': '04',
        'מאי': '05', 'יוני': '06', 'יולי': '07', 'אוגוסט': '08',
        'ספטמבר': '09', 'אוקטובר': '10', 'נובמבר': '11', 'דצמבר': '12',
        'אוק': '10'
    };

    let monthNum = null;
    let year = '2026';

    for (const [key, val] of Object.entries(monthMap)) {
        if (tabName.includes(key)) {
            monthNum = val;
            const yearPart = tabName.replace(key, '').trim().replace(/\D/g, '');
            if (yearPart) {
                year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
            }
            break;
        }
    }

    if (!monthNum) return null;
    return `${year}-${monthNum}-01`;
}

const testCases = [
    'ינואר 26',
    'פברואר 2026',
    'מרץ 2026',
    'ינואר 17',
    'פבואר17',
    'אוק 20',
    'נובמבר'
];

testCases.forEach(t => console.log(`${t} => ${parseHebrewMonthTab(t)}`));
