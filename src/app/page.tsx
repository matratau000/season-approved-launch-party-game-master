import Link from "next/link";
import { login } from "./actions";
import { roster, seasons } from "@/lib/roster";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-lockup">
          {/* Static brand asset; image optimization adds no value at this size. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/season-approved-logo.png" alt="SeasonApproved" />
          <span>Launch Party</span>
        </div>
        <p className="eyebrow">Find your season</p>
        <h1>Let the games begin.</h1>
        <p className="lede">Choose your name to meet your team, submit challenges, and chase the top prize.</p>
        <form action={login} className="login-form">
          <label htmlFor="participant">Your name</label>
          <select id="participant" name="participant" defaultValue="" required>
            <option value="" disabled>Select your name</option>
            {seasons.map((season) => (
              <optgroup label={season} key={season}>
                {roster[season].map((name) => <option key={name}>{name}</option>)}
              </optgroup>
            ))}
          </select>
          {error && <p className="error">{error}</p>}
          <button type="submit">Enter the party</button>
        </form>
        <Link className="text-link" href="/scoreboard">View live scoreboard →</Link>
      </section>
    </main>
  );
}
