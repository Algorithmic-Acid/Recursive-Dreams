import { db } from '../config/postgres';
import { IUser } from '../types';
import bcrypt from 'bcryptjs';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  is_admin: boolean;
  bio: string;
  location: string;
  avatar_url: string;
  created_at: Date;
  updated_at: Date;
}

class UserRepository {
  private mapRowToUser(row: UserRow): IUser {
    return {
      id: row.id,
      email: row.email,
      password: row.password_hash,
      name: row.name,
      isAdmin: row.is_admin,
      bio: row.bio || '',
      location: row.location || '',
      avatarUrl: row.avatar_url || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(): Promise<IUser[]> {
    const result = await db.query<UserRow>(
      'SELECT * FROM users ORDER BY created_at DESC'
    );
    return result.rows.map(row => this.mapRowToUser(row));
  }

  async findById(id: string): Promise<IUser | null> {
    const result = await db.query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const result = await db.query<UserRow>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async create(userData: { email: string; password: string; name: string }): Promise<IUser> {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const result = await db.query<UserRow>(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userData.email, passwordHash, userData.name]
    );

    return this.mapRowToUser(result.rows[0]);
  }

  async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (userData.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(userData.name);
    }

    if (userData.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(userData.email);
    }

    if (userData.password !== undefined) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(passwordHash);
    }

    if (userData.bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(userData.bio);
    }

    if (userData.location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(userData.location);
    }

    if (userData.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(userData.avatarUrl);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await db.query<UserRow>(
      `UPDATE users
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  async verifyPassword(email: string, password: string): Promise<IUser | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  }

  async findPublicProfile(id: string): Promise<{
    id: string; name: string; bio: string; location: string;
    avatarUrl: string; createdAt: Date;
  } | null> {
    const result = await db.query(
      `SELECT id, name, bio, location, avatar_url, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      bio: row.bio || '',
      location: row.location || '',
      avatarUrl: row.avatar_url || '',
      createdAt: row.created_at,
    };
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);

      const result = await db.query(
        `UPDATE users
         SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [passwordHash, userId]
      );

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  }
}

export default new UserRepository();
