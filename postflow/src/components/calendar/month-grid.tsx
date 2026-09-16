"use client";

import { useState } from "react";
import { PostChip } from "./post-chip";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function startOfMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MonthGrid({
  cursor,
  posts,
  onReschedule,
  onDayClick,
}: {
  cursor: Date;
  posts: Post[];
  onReschedule: (postId: string, newDate: Date) => void;
  onDayClick: (date: Date) => void;
}) {
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const days = startOfMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const today = new Date();

  function postsForDay(day: Date) {
    return posts.filter((p) => p.scheduledAt && sameDay(new Date(p.scheduledAt), day));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-surface-border">
      <div className="grid grid-cols-7 border-b border-surface-border bg-surface-raised text-center text-xs font-medium text-ink-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = sameDay(day, today);
          const dayKey = day.toISOString();
          const dayPosts = postsForDay(day);

          return (
            <div
              key={dayKey}
              onClick={() => onDayClick(day)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDay(dayKey);
              }}
              onDragLeave={() => setDragOverDay((d) => (d === dayKey ? null : d))}
              onDrop={(e) => {
                e.preventDefault();
                const postId = e.dataTransfer.getData("text/post-id");
                if (postId) onReschedule(postId, day);
                setDragOverDay(null);
              }}
              className={cn(
                "min-h-[92px] cursor-pointer border-b border-r border-surface-border p-1.5 last:border-r-0",
                i % 7 === 6 && "border-r-0",
                !inMonth && "bg-surface/40",
                dragOverDay === dayKey && "bg-accent/10"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  isToday ? "bg-accent text-white" : inMonth ? "text-ink-muted" : "text-ink-faint"
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <PostChip
                    key={post.id}
                    post={post}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/post-id", post.id);
                      e.stopPropagation();
                    }}
                  />
                ))}
                {dayPosts.length > 3 && (
                  <p className="px-1 text-[10px] text-ink-faint">+{dayPosts.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
