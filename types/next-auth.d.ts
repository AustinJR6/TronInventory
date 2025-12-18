import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      vehicleNumber?: string;
      branchId?: string | null;
    };
  }

  interface User {
    role: string;
    vehicleNumber?: string;
    branchId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    vehicleNumber?: string;
    branchId?: string | null;
  }
}
