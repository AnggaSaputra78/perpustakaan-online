const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');

class AuthService {
  async register(data) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async login(data) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Email atau password salah');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Email atau password salah');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    return user;
  }

  async updateProfile(userId, data) {
    const updateData = {};
    
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email) updateData.email = data.email;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.avatar) updateData.avatar = data.avatar;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}

module.exports = new AuthService();