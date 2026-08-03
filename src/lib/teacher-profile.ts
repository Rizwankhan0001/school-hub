import { formatDate, formatDateTime } from "./format";
import type { School, Teacher, TeacherRating, TeacherYearAward } from "./types";

export type TeacherProfileDocumentInput = {
  school: School;
  teacher: Teacher;
  averageRating: number;
  ratingCount: number;
  ratings: TeacherRating[];
  awards: TeacherYearAward[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function starsText(n: number) {
  const full = Math.round(n);
  return `${"★".repeat(Math.min(5, full))}${"☆".repeat(Math.max(0, 5 - Math.min(5, full)))} (${n.toFixed(1)})`;
}

export function buildTeacherProfileHtml(input: TeacherProfileDocumentInput): string {
  const { school, teacher, averageRating, ratingCount, ratings, awards } = input;
  const assignments = teacher.classAssignments
    .map(
      (a) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(a.className)}${a.section ? `-${escapeHtml(a.section)}` : ""}</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(a.subject)}</td></tr>`,
    )
    .join("");
  const timeline = [...teacher.timeline]
    .reverse()
    .map(
      (e) => `
      <div style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(e.year)} · ${escapeHtml(e.kind)}</p>
        <p style="margin:4px 0 0;font-weight:700;">${escapeHtml(e.title)}</p>
        <p style="margin:2px 0 0;color:#334155;">${escapeHtml(e.organization)}</p>
        <p style="margin:6px 0 0;color:#64748b;font-size:14px;">${escapeHtml(e.description)}</p>
      </div>`,
    )
    .join("");
  const awardRows = awards
    .map(
      (a) =>
        `<li style="margin:0 0 8px;"><strong>${escapeHtml(a.title)} (${escapeHtml(a.academicYear)})</strong> — ${escapeHtml(a.reason)}</li>`,
    )
    .join("");
  const ratingRows = ratings
    .slice(0, 8)
    .map(
      (r) =>
        `<li style="margin:0 0 8px;"><strong>${"★".repeat(r.stars)}</strong> ${escapeHtml(r.comment || "No comment")} <span style="color:#64748b;">— ${escapeHtml(r.ratedBy)} · ${formatDateTime(r.ratedAt)}</span></li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Teacher Profile · ${escapeHtml(teacher.name)}</title>
  <style>
    body { font-family: "IBM Plex Sans", Arial, sans-serif; color: #0a0c10; margin: 0; background: #f4f6f8; }
    .sheet { max-width: 800px; margin: 28px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
    .head { background: #0a0c10; color: #fff; padding: 28px 32px; display: flex; gap: 18px; align-items: center; }
    .avatar { width: 64px; height: 64px; border-radius: 16px; background: #00a67e; display: grid; place-items: center; font-weight: 800; font-size: 20px; }
    h1 { margin: 0; font-size: 28px; letter-spacing: -0.04em; }
    .sub { margin: 6px 0 0; opacity: 0.65; font-size: 14px; }
    .body { padding: 28px 32px 36px; }
    h2 { margin: 28px 0 10px; font-size: 16px; letter-spacing: -0.02em; }
    table { width: 100%; border-collapse: collapse; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 4px; }
    .value { margin: 0; font-weight: 600; }
    @media print { body { background: #fff; } .sheet { margin: 0; border: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="avatar">${escapeHtml(teacher.avatarInitials)}</div>
      <div>
        <h1>${escapeHtml(teacher.name)}</h1>
        <p class="sub">${escapeHtml(teacher.subject)} · ${escapeHtml(teacher.specialty)} · ${escapeHtml(school.name)}</p>
      </div>
    </div>
    <div class="body">
      <div class="meta">
        <div><p class="label">Qualification</p><p class="value">${escapeHtml(teacher.highestQualification)}</p></div>
        <div><p class="label">Experience</p><p class="value">${teacher.yearsExperience} years · joined ${formatDate(teacher.joinedOn)}</p></div>
        <div><p class="label">Department</p><p class="value">${escapeHtml(teacher.department ?? "—")}</p></div>
        <div><p class="label">Languages</p><p class="value">${escapeHtml((teacher.languagesSpoken ?? []).join(", ") || "—")}</p></div>
        <div><p class="label">Contact</p><p class="value">${escapeHtml(teacher.email)} · ${escapeHtml(teacher.phone)}</p></div>
        <div><p class="label">Room</p><p class="value">${escapeHtml(teacher.room)}</p></div>
        <div><p class="label">School rating</p><p class="value">${ratingCount ? starsText(averageRating) + ` · ${ratingCount} ratings` : "Not rated yet"}</p></div>
        <div><p class="label">Classes</p><p class="value">${escapeHtml(teacher.classes.join(", "))}</p></div>
      </div>
      <p style="margin:20px 0 0;line-height:1.55;color:#334155;">${escapeHtml(teacher.bio)}</p>
      ${
        teacher.highlights?.length
          ? `<p style="margin:14px 0 0;color:#0f766e;font-size:14px;"><strong>Highlights:</strong> ${escapeHtml(teacher.highlights.join(" · "))}</p>`
          : ""
      }

      <h2>Class-wise teaching</h2>
      <table>
        <thead><tr><th style="text-align:left;padding:8px 0;border-bottom:2px solid #0a0c10;">Class</th><th style="text-align:left;padding:8px 0;border-bottom:2px solid #0a0c10;">Subject</th></tr></thead>
        <tbody>${assignments}</tbody>
      </table>

      <h2>Education & career timeline</h2>
      ${timeline}

      ${
        awards.length
          ? `<h2>Awards</h2><ul style="padding-left:18px;margin:0;">${awardRows}</ul>`
          : ""
      }

      ${
        ratings.length
          ? `<h2>Recent encouragement ratings</h2><ul style="padding-left:18px;margin:0;">${ratingRows}</ul>`
          : ""
      }

      <p style="margin-top:28px;font-size:12px;color:#64748b;">Generated from EduFee360 school panel · ${escapeHtml(school.academicSession)}</p>
    </div>
  </div>
</body>
</html>`;
}

export function downloadTeacherProfile(input: TeacherProfileDocumentInput) {
  const html = buildTeacherProfileHtml(input);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${input.teacher.avatarInitials}-${input.teacher.name.replace(/\s+/g, "-")}-profile.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function openTeacherProfile(input: TeacherProfileDocumentInput, autoPrint = false) {
  const html = buildTeacherProfileHtml(input);
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!win) {
    downloadTeacherProfile(input);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  if (autoPrint) {
    win.focus();
    window.setTimeout(() => win.print(), 350);
  }
}
