"use client";

import { useState } from "react";
import { CAMPUSES } from "@/lib/constants";

// Student code + campus, shared by sign-up and re-verify.
export function StudentFields({ defaults }: { defaults: { studentCode: string; campus: string } }) {
  const [campus, setCampus] = useState(defaults.campus);
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="studentCode" className="field-label">Mã sinh viên</label>
        <input id="studentCode" name="studentCode" placeholder="SE190123" className="input uppercase" defaultValue={defaults.studentCode} autoComplete="off" required />
      </div>
      <div>
        <label htmlFor="campus" className="field-label">Cơ sở</label>
        {/* Controlled so the chosen campus survives the form reset after a failed submit. */}
        <select id="campus" name="campus" className="input" value={campus} onChange={(e) => setCampus(e.target.value)} required>
          <option value="" disabled>Chọn…</option>
          {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
