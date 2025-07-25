// import { jwtVerify, SignJWT } from "jose"
// import { cookies } from "next/headers"
// import { type NextRequest, NextResponse } from "next/server"
// import prisma from "./prisma"
// import * as bcrypt from "bcryptjs"

// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// export async function getJwtSecretKey() {
//   return new TextEncoder().encode(JWT_SECRET)
// }

// export async function verifyAuth(token: string) {
//   try {
//     const { payload } = await jwtVerify(token, await getJwtSecretKey())
//     return payload
//   } catch (error) {
//     return null
//   }
// }

// export async function login(username: string, password: string) {
//   try {
//     // Find user by username
//     const user = await prisma.user.findUnique({
//       where: { username },
//     })

//     if (!user) {
//       return null
//     }

//     // Check password
//     const passwordMatch = await bcrypt.compare(password, user.password)

//     if (!passwordMatch) {
//       return null
//     }

//     // Create JWT token
//     const token = await new SignJWT({
//       id: user.id,
//       username: user.username,
//       name: user.name,
//       role: user.role,
//     })
//       .setProtectedHeader({ alg: "HS256" })
//       .setIssuedAt()
//       .setExpirationTime("7d")
//       .sign(await getJwtSecretKey())

//     // Set cookie
//     const cookieStore = await cookies()
//     cookieStore.set({
//       name: "auth-token",
//       value: token,
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 60 * 60 * 24 * 7, // 1 week
//       path: "/",
//     })

//     return {
//       id: user.id,
//       username: user.username,
//       name: user.name,
//       role: user.role,
//     }
//   } catch (error) {
//     console.error("Login error:", error)
//     return null
//   }
// }

// export async function logout() {
//   const cookieStore = await cookies()
//   cookieStore.delete("auth-token")
//   return true
// }

// export async function getUser() {
//   const cookieStore = await cookies()
//   const token = cookieStore.get("auth-token")?.value

//   if (!token) {
//     return null
//   }

//   const payload = await verifyAuth(token)
//   if (!payload) {
//     return null
//   }

//   // Ensure the user still exists in the database and fetch their permissions and group permissions
//   const user = await prisma.user.findUnique({
//     where: { id: payload.id as string },
//     include: {
//       permissions: {
//         include: { role: true },
//       },
//       groups: {
//         include: {
//           group: {
//             include: { groupPermissions: { include: { role: true } } },
//           },
//         },
//       },
//     },
//   })

//   if (!user || user.status === "INACTIVE" || user.status === "SUSPENDED") {
//     return null
//   }

//   // Aggregate all permissions
//   const effectivePermissions = new Set<string>();

//   // Add direct user permissions
//   user.permissions.forEach(p => {
//     if (!p.expiry || p.expiry > new Date()) {
//       effectivePermissions.add(p.systemId);
//     }
//   });

//   // Add group permissions
//   user.groups.forEach(userGroup => {
//     userGroup.group.groupPermissions.forEach(gp => {
//       if (!gp.expiry || gp.expiry > new Date()) {
//         effectivePermissions.add(gp.systemId);
//       }
//     });
//   });

//   return {
//     id: user.id,
//     username: user.username,
//     name: user.name,
//     email: user.email,
//     role: user.role,
//     status: user.status,
//     permissions: Array.from(effectivePermissions),
//   }
// }

// export async function hasPermission(requiredPermission: string, systemId?: string) {
//   const user = await getUser()

//   if (!user) {
//     return false
//   }

//   // If the user has an "admin" role, they have all permissions
//   if (user.role === "admin") {
//     return true;
//   }

//   // Check if the user has the required permission in their permissions array
//   return user.permissions.includes(requiredPermission);
// }

// // Fixed handler type definition to accept context parameter
// export function withAuth(
//   handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
//   requiredPermission?: string
// ) {
//   return async (req: NextRequest, context?: any) => {
//     const token = req.cookies.get("auth-token")?.value

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const payload = await verifyAuth(token)
//     if (!payload) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     if (requiredPermission) {
//       // Pass systemId if available from context/request path
//       const hasRequiredPermission = await hasPermission(requiredPermission)
//       if (!hasRequiredPermission) {
//         return NextResponse.json({ error: "Forbidden" }, { status: 403 })
//       }
//     }

//     // Pass both request and context to the handler
//     return handler(req, context)
//   }
// }


import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import prisma from "./prisma"
import * as bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function getJwtSecretKey() {
  const secret = new TextEncoder().encode(JWT_SECRET);
  // Log a portion of the secret to confirm consistency, but not the whole thing for security
  console.log("getJwtSecretKey: Using secret (first 5 bytes):", secret.slice(0, 5));
  return secret;
}

export async function verifyAuth(token: string) {
  try {
    const { payload } = await jwtVerify(token, await getJwtSecretKey())
    console.log("verifyAuth: Token payload successfully verified:", payload);
    return payload
  } catch (error) {
    console.error("verifyAuth: Token verification failed:", error);
    return null
  }
}

export async function login(username: string, password: string, rememberMe = false) {
  try {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      console.log("Login attempt: User not found for username:", username);
      return null
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      console.log("Login attempt: Password mismatch for username:", username);
      return null
    }

    // Create JWT token
    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(rememberMe ? "30d" : "2h")
      .sign(await getJwtSecretKey())

    // Determine secure flag based on environment
    const secureCookie = false;
    console.log(`Login: Setting cookie with secure: ${secureCookie} (NODE_ENV: ${process.env.NODE_ENV})`);

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: secureCookie, // Updated secure flag
      sameSite: "lax",
      path: "/",
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 2,
    })

    console.log(`Login successful for ${username}. Auth token cookie attempted to be set.`);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }
  } catch (error) {
    console.error("Login error in auth.ts:", error)
    return null
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
  console.log("Logout: auth-token cookie deleted.");
  return true
}

export async function getUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  const payload = await verifyAuth(token)
  if (!payload) {
    return null
  }

  // Ensure the user still exists in the database and fetch their permissions and group permissions
  const user = await prisma.user.findUnique({
    where: { id: payload.id as string },
    include: {
      permissions: {
        include: { role: true },
      },
      groups: {
        include: {
          group: {
            include: { groupPermissions: { include: { role: true } } },
          },
        },
      },
    },
  })

  if (!user || user.status === "INACTIVE" || user.status === "SUSPENDED") {
    return null
  }

  // Aggregate all permissions
  const effectivePermissions = new Set<string>();

  // Add direct user permissions
  user.permissions.forEach(p => {
    if (!p.expiry || p.expiry > new Date()) {
      effectivePermissions.add(p.systemId);
    }
  });

  // Add group permissions
  user.groups.forEach(userGroup => {
    userGroup.group.groupPermissions.forEach(gp => {
      if (!gp.expiry || gp.expiry > new Date()) {
        effectivePermissions.add(gp.systemId);
      }
    });
  });

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: Array.from(effectivePermissions),
  }
}

export async function hasPermission(requiredPermission: string, systemId?: string) {
  const user = await getUser()

  if (!user) {
    return false
  }

  // If the user has an "admin" role, they have all permissions
  if (user.role === "admin") {
    return true;
  }

  // Check if the user has the required permission in their permissions array
  return user.permissions.includes(requiredPermission);
}

// Fixed handler type definition to accept context parameter
export function withAuth(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  requiredPermission?: string
) {
  return async (req: NextRequest, context?: any) => {
    const token = req.cookies.get("auth-token")?.value

    if (!token) {
      console.log("withAuth: No token found in request cookies. Returning 401.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAuth(token)
    if (!payload) {
      console.log("withAuth: Invalid token payload. Returning 401.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (requiredPermission) {
      // Pass systemId if available from context/request path
      const hasRequiredPermission = await hasPermission(requiredPermission)
      if (!hasRequiredPermission) {
        console.log(`withAuth: User lacks required permission: ${requiredPermission}. Returning 403.`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Pass both request and context to the handler
    return handler(req, context)
  }
}
