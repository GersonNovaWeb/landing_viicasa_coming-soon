"use client";

import { useStore } from "@/lib/store";
import { useState } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";

export default function PropertiesPage() {
  const { properties, deleteProperty, addProperty } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const filtered = properties.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddMock = () => {
    addProperty({
      id: `PROP-${Math.floor(Math.random() * 10000)}`,
      name: "New Luxury Villa",
      location: "Tulum, Q.R.",
      price: 25000,
      status: "Active",
      bedrooms: 4,
      bathrooms: 4
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Properties</h1>
          <p className="text-muted-foreground mt-1">Manage real estate portfolio.</p>
        </div>
        <button onClick={handleAddMock} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition">
          <Plus size={16} /> Add Property
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search properties..." 
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
                <th className="px-6 py-4 font-medium">Property Name</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Price/Night</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(prop => (
                <tr key={prop.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{prop.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{prop.location}</td>
                  <td className="px-6 py-4">{formatter.format(prop.price)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${prop.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {prop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-muted-foreground hover:text-foreground p-1 transition"><Edit2 size={16} /></button>
                    <button onClick={() => deleteProperty(prop.id)} className="text-muted-foreground hover:text-red-500 p-1 ml-2 transition"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No properties found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
