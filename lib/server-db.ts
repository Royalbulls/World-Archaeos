import fs from 'fs';
import path from 'path';

// Server-side mock DB for authentication
export function getUsers() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
      return [];
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error('Failed to read users:', e);
    return [];
  }
}

export function saveUsers(users: any[]) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}
