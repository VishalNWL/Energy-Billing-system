"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateUserRole } from "@/lib/actions/user-role";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ENGINEER" | "CONSUMER";
  consumer: { consumerNumber: string } | null;
};

export function UserRoleTable({ users }: { users: UserRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleRoleChange(userId: string, newRole: "ADMIN" | "ENGINEER" | "CONSUMER") {
    setPendingId(userId);
    startTransition(async () => {
      await updateUserRole(userId, newRole);
      setPendingId(null);
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Consumer #</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              {user.consumer ? (
                <Badge variant="outline">{user.consumer.consumerNumber}</Badge>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </TableCell>
            <TableCell>
              <Select
                value={user.role}
                disabled={isPending && pendingId === user.id}
                onValueChange={(value) =>
                  handleRoleChange(user.id, value as "ADMIN" | "ENGINEER" | "CONSUMER")
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ENGINEER">Engineer</SelectItem>
                  <SelectItem value="CONSUMER">Consumer</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}