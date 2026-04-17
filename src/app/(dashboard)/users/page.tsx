"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Eye,
  Users,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { toneBadge } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface User {
  _id: string;
  username: string;
  name: string;
  role: "admin" | "viewer";
  phone?: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    role: string;
  } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const fetchUsers = useCallback(async () => {
    const [usersRes, meRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/auth/me"),
    ]);
    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(data.users);
    }
    if (meRes.ok) {
      const data = await meRes.json();
      setCurrentUser(data.user);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [usersRes, meRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/auth/me"),
      ]);
      if (cancelled) return;
      if (usersRes.ok) {
        const data = await usersRes.json();
        if (!cancelled) setUsers(data.users);
      }
      if (meRes.ok) {
        const data = await meRes.json();
        if (!cancelled) setCurrentUser(data.user);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = currentUser?.role === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-base text-muted-foreground">
          Hanya admin yang dapat mengakses halaman ini
        </p>
        <Link
          href="/"
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  async function confirmDelete() {
    if (!deletingUser) return;
    setDeletePending(true);
    setDeleteError(null);
    const res = await fetch(`/api/users/${deletingUser._id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeletingUser(null);
      fetchUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error || "Gagal menghapus user");
    }
    setDeletePending(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader icon={Users} title="Manajemen User">
        <Dialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingUser(null);
          }}
        >
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-1.5 h-4 w-4" /> Tambah
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Tambah User"}
              </DialogTitle>
            </DialogHeader>
            <UserForm
              user={editingUser}
              onSuccess={() => {
                setFormOpen(false);
                setEditingUser(null);
                fetchUsers();
              }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <SectionCard
        icon={Users}
        title={`${users.length} user`}
        bodyClassName="p-0"
      >
        {users.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Users}
              title="Belum ada user"
              description="Tambahkan admin atau viewer untuk mulai menggunakan dashboard."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {users.map((user) => {
              const isSelf = user._id === currentUser?.userId;
              return (
                <li
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                      </p>
                      <Badge
                        className={cn(
                          "text-xs",
                          user.role === "admin"
                            ? toneBadge.primary
                            : toneBadge.neutral,
                        )}
                      >
                        {user.role === "admin" ? (
                          <>
                            <Shield className="mr-1 h-3 w-3" /> Admin
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1 h-3 w-3" /> Viewer
                          </>
                        )}
                      </Badge>
                      {isSelf && (
                        <Badge variant="outline" className="text-xs">
                          Kamu
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      @{user.username}
                      {user.phone && <> · {user.phone}</>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingUser(user);
                        setFormOpen(true);
                      }}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeletingUser(user);
                          setDeleteError(null);
                        }}
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <Dialog
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open && !deletePending) {
            setDeletingUser(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Hapus user?</DialogTitle>
            </div>
            <DialogDescription>
              {deletingUser ? (
                <>
                  User <span className="font-semibold">{deletingUser.name}</span>{" "}
                  (@{deletingUser.username}) akan dihapus permanen. Aksi ini
                  tidak bisa dibatalkan.
                </>
              ) : (
                "User ini akan dihapus permanen."
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingUser(null);
                setDeleteError(null);
              }}
              disabled={deletePending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePending}
            >
              {deletePending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserForm({
  user,
  onSuccess,
}: {
  user: User | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    username: user?.username ?? "",
    name: user?.name ?? "",
    role: user?.role ?? "viewer",
    phone: user?.phone ?? "",
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = user ? `/api/users/${user._id}` : "/api/users";
    const method = user ? "PUT" : "POST";
    const body = user
      ? {
          name: form.name,
          role: form.role,
          phone: form.phone,
          ...(form.password ? { password: form.password } : {}),
        }
      : form;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Gagal menyimpan");
      setSaving(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!user && (
        <div className="space-y-1.5">
          <Label>Username</Label>
          <Input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Nama</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>
          {user ? "Password Baru (kosongkan jika tidak ganti)" : "Password"}
        </Label>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required={!user}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Role</Label>
        <Select
          value={form.role}
          onValueChange={(v) =>
            setForm({ ...form, role: v as "admin" | "viewer" })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>No. HP (opsional)</Label>
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
        {user ? "Simpan Perubahan" : "Tambah User"}
      </Button>
    </form>
  );
}
