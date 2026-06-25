import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// Helper function to check if a user is the last active admin
async function isLastActiveAdmin(userId: string) {
  const activeAdminsCount = await prisma.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
    },
  });

  // If there is only 1 or 0 active admin, and the target user is an active admin, demoting/deactivating/deleting them is not allowed.
  if (activeAdminsCount <= 1) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });
    return targetUser?.role === "ADMIN" && targetUser?.isActive === true;
  }
  return false;
}

// 1. GET - List Users
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const roleFilter = searchParams.get("role") || "ALL"; // ALL, USER, ADMIN

    const whereClause: any = {};

    // Apply role filter
    if (roleFilter === "USER") {
      whereClause.role = "USER";
    } else if (roleFilter === "ADMIN") {
      whereClause.role = "ADMIN";
    }

    // Apply search filter (name or email)
    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            paymentStatus: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("[Admin Users GET API] Error:", error?.message);
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

// 2. POST - Create User
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, confirmPassword, phone, role } = body;

    // Validation
    if (!name || !email || !password || !confirmPassword || !role) {
      return NextResponse.json({ error: "Nama, email, password, konfirmasi password, dan role wajib diisi." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Password dan konfirmasi password tidak cocok." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal harus 8 karakter." }, { status: 400 });
    }

    const emailClean = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: emailClean },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar. Gunakan email lain." }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: emailClean,
        password: hashedPassword,
        phone: phone || null,
        role: role as any,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "User berhasil dibuat.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Users POST API] Error:", error?.message);
    return NextResponse.json({ error: "Gagal membuat user baru" }, { status: 500 });
  }
}

// 3. PUT - Update User or Reset Password
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, phone, role, isActive, password, confirmPassword } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID wajib disertakan" }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = {};

    // A. Password Reset operation
    if (password !== undefined) {
      if (password !== confirmPassword) {
        return NextResponse.json({ error: "Password dan konfirmasi password tidak cocok." }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: "Password minimal harus 8 karakter." }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    } else {
      // B. Standard profile & role update operations
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone || null;

      if (email) {
        const emailClean = email.toLowerCase().trim();
        if (emailClean !== targetUser.email) {
          const emailCheck = await prisma.user.findUnique({
            where: { email: emailClean },
          });
          if (emailCheck) {
            return NextResponse.json({ error: "Email sudah digunakan oleh user lain." }, { status: 400 });
          }
          updateData.email = emailClean;
        }
      }

      // Role check and protections
      if (role && role !== targetUser.role) {
        // Demoting target user from ADMIN to USER
        if (targetUser.role === "ADMIN" && role === "USER") {
          if (id === session.user.id) {
            return NextResponse.json({ error: "Anda tidak boleh menurunkan role akun Anda sendiri." }, { status: 400 });
          }
          if (await isLastActiveAdmin(id)) {
            return NextResponse.json({ error: "Gagal mengubah role. Harus ada minimal 1 akun admin aktif di sistem." }, { status: 400 });
          }
        }
        updateData.role = role as any;
      }

      // Deactivation check and protections
      if (isActive !== undefined && isActive !== targetUser.isActive) {
        if (isActive === false) {
          if (id === session.user.id) {
            return NextResponse.json({ error: "Anda tidak boleh menonaktifkan akun Anda sendiri." }, { status: 400 });
          }
          if (await isLastActiveAdmin(id)) {
            return NextResponse.json({ error: "Gagal menonaktifkan. Harus ada minimal 1 akun admin aktif di sistem." }, { status: 400 });
          }
        }
        updateData.isActive = isActive;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: password !== undefined ? "Password berhasil di-reset." : "User berhasil diperbarui.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error: any) {
    console.error("[Admin Users PUT API] Error:", error?.message);
    return NextResponse.json({ error: "Gagal memperbarui user" }, { status: 500 });
  }
}

// 4. DELETE - Delete User
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID wajib disertakan" }, { status: 400 });
    }

    if (id === session.user.id) {
      return NextResponse.json({ error: "Anda tidak boleh menghapus akun Anda sendiri." }, { status: 400 });
    }

    // Protection logic: checking if last active admin is being deleted
    if (await isLastActiveAdmin(id)) {
      return NextResponse.json({ error: "Gagal menghapus. Harus ada minimal 1 akun admin aktif di sistem." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User berhasil dihapus secara permanen." });
  } catch (error: any) {
    console.error("[Admin Users DELETE API] Error:", error?.message);
    return NextResponse.json({ error: "Gagal menghapus user. Silakan pastikan user tidak memiliki dependensi data transaksi aktif." }, { status: 500 });
  }
}
