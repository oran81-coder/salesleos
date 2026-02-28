import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbPool } from '../config/db.js';
import { getAppConfig } from '../config/env.js';
import type { User, UserRole } from '@laos/shared-types';
import mysql from 'mysql2/promise';

const config = getAppConfig();

export class AuthService {
    static async login(email: string, password: string) {
        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT id, email, password_hash, full_name, role, department_id, is_active FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) return null;
        const user = rows[0];

        if (!user.is_active) throw new Error('User account is inactive');

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return null;

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn || '8h' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role as UserRole,
                departmentId: user.department_id,
                isActive: !!user.is_active
            }
        };
    }

    static async getUserById(id: number) {
        const [rows] = await dbPool.query<mysql.RowDataPacket[]>(
            'SELECT id, email, full_name, role, department_id, is_active FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }
}
