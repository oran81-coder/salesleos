import { dbPool } from '../config/db.js';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export class UserService {
    static async getAllUsers() {
        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT id, email, full_name, sheet_name, role, department_id, is_active FROM users ORDER BY full_name ASC'
        );
        return rows;
    }

    static async toggleUserStatus(id: number, isActive: boolean) {
        await dbPool.query(
            'UPDATE users SET is_active = ? WHERE id = ?',
            [isActive ? 1 : 0, id]
        );
    }

    static async createUser(data: any) {
        // Handle both camelCase and snake_case to be resilient
        const fullName = data.fullName || data.full_name;
        const sheetName = data.sheetName || data.sheet_name;
        const email = data.email;
        const role = data.role;
        const departmentId = data.departmentId || data.department_id;
        const password = data.password || 'password123';

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await dbPool.query<mysql.ResultSetHeader>(
            'INSERT INTO users (full_name, sheet_name, email, role, department_id, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
            [fullName, sheetName || null, email, role, departmentId, hash]
        );
        return result.insertId;
    }

    static async updateUser(id: number, data: any) {
        const fullName = data.full_name || data.fullName;
        const sheetName = data.sheet_name || data.sheetName;
        const email = data.email;
        const role = data.role;
        const departmentId = data.department_id || data.departmentId;
        const isActive = data.is_active !== undefined ? (data.is_active ? 1 : 0) : undefined;

        let query = 'UPDATE users SET full_name = ?, sheet_name = ?, email = ?, role = ?, department_id = ?';
        const params = [fullName, sheetName || null, email, role, departmentId];

        if (isActive !== undefined) {
            query += ', is_active = ?';
            params.push(isActive);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await dbPool.query(query, params);
    }

    static async getDepartments() {
        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT * FROM departments ORDER BY name ASC'
        );
        return rows;
    }
}
