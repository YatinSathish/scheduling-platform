"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  role: "MANAGER" | "TECHNICIAN";
  variant?: "pill" | "heading";
}

interface User {
  id: string;
  name: string;
}

export default function UserSwitcher({ role, variant = "pill" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentId = searchParams.get("userId");
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const endpoint = role === "MANAGER" ? "/api/managers" : "/api/technicians";
    fetch(endpoint)
      .then((r) => r.json())
      .then((data: User[]) => {
        setUsers(data);
        const active = new URLSearchParams(window.location.search).get(
          "userId",
        );
        if (!active && data.length > 0) {
          const params = new URLSearchParams(window.location.search);
          params.set("userId", data[0].id);
          router.replace(`?${params.toString()}`);
        }
      });
  }, [role, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("userId", id);
    router.replace(`?${params.toString()}`);
    setOpen(false);
  };

  const currentUser = users.find((u) => u.id === currentId);
  const chevron = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );

  return (
    <div ref={wrapperRef} className="relative">
      {variant === "heading" ? (
        <div className="flex flex-col gap-2">
          <span className="text-xl font-bold text-text-primary">
            Hi, {currentUser?.name ?? "…"}
          </span>
          <p className="text-xs text-text-secondary -mt-1">
            Switch {role === "MANAGER" ? "manager" : "technician"}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {users.map((u) => {
              const active = u.id === currentId;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-primary text-white"
                      : "bg-gray-100 text-text-secondary hover:bg-gray-200 hover:text-text-primary"
                  }`}
                >
                  {u.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-colors text-sm"
        >
          <span className="text-text-secondary">Hi,</span>
          <span className="font-medium text-text-primary">
            {currentUser?.name ?? "…"}
          </span>
          {chevron}
        </button>
      )}

      {open && (
        <div className="absolute left-0 mt-2 w-52 bg-surface border border-border rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">
              Switch {role === "MANAGER" ? "manager" : "technician"}
            </p>
          </div>
          <ul className="py-1">
            {users.map((u) => {
              const active = u.id === currentId;
              return (
                <li key={u.id}>
                  <button
                    onClick={() => handleSelect(u.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-surface-muted ${
                      active
                        ? "text-brand-primary font-medium"
                        : "text-text-primary"
                    }`}
                  >
                    {u.name}
                    {active && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
