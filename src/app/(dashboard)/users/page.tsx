"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import Link from "next/link";
import { Plus, Pencil, Trash2, Shield, Eye, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
    fetchUsers();
  }, [fetchUsers]);

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

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus user ini?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
    else {
      const data = await res.json();
      alert(data.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Manajemen User">
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingUser(null); }}>
          <DialogTrigger render={<Button />}>
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
                setDialogOpen(false);
                setEditingUser(null);
                fetchUsers();
              }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user._id} className="shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <p className="text-base font-semibold">{user.name}</p>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? (
                      <><Shield className="mr-1 h-3 w-3" /> Admin</>
                    ) : (
                      <><Eye className="mr-1 h-3 w-3" /> Viewer</>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">@{user.username}</p>
                {user.phone && (
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingUser(user);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {user._id !== currentUser?.userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(user._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
      ? { name: form.name, role: form.role, phone: form.phone, ...(form.password ? { password: form.password } : {}) }
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {!user && (
        <div className="space-y-2">
          <Label>Username</Label>
          <Input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>Nama</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{user ? "Password Baru (kosongkan jika tidak ganti)" : "Password"}</Label>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required={!user}
        />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "viewer" })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>No. HP (opsional)</Label>
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={saving}>
        {user ? "Simpan Perubahan" : "Tambah User"}
      </Button>
    </form>
  );
}
