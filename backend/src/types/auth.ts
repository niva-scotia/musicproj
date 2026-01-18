export interface UserPayload {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}