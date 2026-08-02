import { submissions } from "@/lib/data";
import { reviewSubmission } from "../actions";
import { LiveRefresh } from "@/components/live-refresh";

export const dynamic = "force-dynamic";

export default async function GameMasterPage() {
  const allSubmissions = await submissions();
  const pending = allSubmissions.filter((item) => item.status === "pending").length;
  return (
    <main className="admin-shell">
      <LiveRefresh every={4000} />
      <header className="admin-header"><div><p className="eyebrow">SeasonApproved Analyst</p><h1>Game Master</h1><p>{pending} submission{pending === 1 ? "" : "s"} waiting for review</p></div><a href="/scoreboard" target="_blank">Open TV scoreboard ↗</a></header>
      <nav className="admin-nav"><strong>Scavenger Hunt</strong><span>More games will appear when their rules are defined.</span></nav>
      <section className="submission-grid">
        {allSubmissions.length === 0 && <div className="empty-state"><span>📷</span><h2>No submissions yet</h2><p>New Scavenger Hunt evidence will appear here automatically.</p></div>}
        {allSubmissions.map((item) => (
          <article className="submission-card" key={item.id}>
            <a className="evidence" href={`/media/${item.id}`} target="_blank">
              {/* Private R2 media is intentionally streamed directly. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${item.id}`} alt={`Submission from ${item.participant}`} />
            </a>
            <div className="submission-copy"><div className="submission-meta"><div><p className="eyebrow">{item.status}</p><h2>{item.participant}</h2></div><time>{new Date(item.created_at + "Z").toLocaleString()}</time></div>{item.note && <p>{item.note}</p>}
              <form action={reviewSubmission} className="review-form"><input type="hidden" name="submissionId" value={item.id} /><label>Points<input type="number" name="points" min="0" max="1000" defaultValue={item.points || 10} /></label><button name="decision" value="approve">Approve points</button><button className="danger" name="decision" value="reject">Reject</button></form>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
