import { login } from "./actions";
import Link from "next/link";
import { seasons, type Season } from "@/lib/roster";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; season?: string }> }) {
  const { error, season: value } = await searchParams;
  const season = seasons.includes(value as Season) ? value as Season : undefined;
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
        <p className="lede">Choose your Season Team, then tell us your name to join the party.</p>
        <div className="season-picker">{seasons.map((item) => <Link className={`season-choice theme-${item.toLowerCase()}`} href={`/?season=${item}`} key={item}>Team {item}</Link>)}</div>
        {error && !season && <p className="error">{error}</p>}
        {season && <dialog aria-labelledby="signup-title" className={`signup-dialog theme-${season.toLowerCase()}`} open>
          <p className="eyebrow">Team {season}</p><h2 id="signup-title">What&apos;s your name?</h2>
          <form action={login} className="login-form">
            <input type="hidden" name="season" value={season} />
            <label htmlFor="participant-name">Your name</label>
            <input autoComplete="name" autoFocus id="participant-name" maxLength={50} name="name" required type="text" />
            {error && <p className="error">{error}</p>}
            <button type="submit">Join Team {season}</button>
            <Link className="dialog-cancel" href="/">Choose another season</Link>
          </form>
        </dialog>}
      </section>
    </main>
  );
}
