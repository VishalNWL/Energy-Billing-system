"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Consumer = {
  id: string;
  consumerNumber: string;
  consumerType: string;
  user: { name: string };
  meter: { _count: { readings: number } } | null;
};

export function ConsumerSelector({
  consumers,
  selectedId,
}: {
  consumers: Consumer[];
  selectedId?: string;
}) {
  const router = useRouter();

  return (
    <div className="space-y-1 w-full max-w-sm">
      <Label>Select Consumer</Label>
      <Select
        value={selectedId}
        onValueChange={(id) => router.push(`/admin/load-analysis/${id}`)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a consumer..." />
        </SelectTrigger>
        <SelectContent>
          {consumers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.consumerNumber} — {c.user.name}{" "}
              <span className="text-muted-foreground text-xs">
                ({c.meter?._count.readings ?? 0} readings)
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}