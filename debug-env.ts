import dotenv from 'dotenv';
dotenv.config();

const required = [
    'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'JWT_SECRET', 'SHEETS_SPREADSHEET_ID', 'SHEETS_CLIENT_EMAIL', 'SHEETS_PRIVATE_KEY'
];

required.forEach(name => {
    console.log(`${name}: ${process.env[name] ? 'PRESENT' : 'MISSING'}`);
});
