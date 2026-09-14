"use client";
// Archived prototype only. This component is intentionally not a public route.

import { useStore } from "@/lib/store";
import { useState } from "react";
import { Search, Edit2 } from "lucide-react";

export default function ReservationsPage() {
  const { reservations } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const filtered = reservations.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Reservations</h1>
        <p className="text-muted-foreground mt-1">Manage guest bookings and statuses.</p>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search by customer or property..." 
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Reservation ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Property</th>
                <th className="px-6 py-4 font-medium">Dates</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(res => (
                <tr key={res.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{res.id}</td>
                  <td className="px-6 py-4 font-medium">{res.customerName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{res.propertyName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{res.checkIn} ({res.nights} nights)</td>
                  <td className="px-6 py-4">{formatter.format(res.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium 
                      ${res.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        res.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' : 
                        'bg-amber-500/10 text-amber-500'}`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-muted-foreground hover:text-foreground p-1 transition"><Edit2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No reservations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
