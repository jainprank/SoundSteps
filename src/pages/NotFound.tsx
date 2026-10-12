import { Link } from "react-router-dom";
import { Guide } from "@/components/Guide";

export function NotFound() {
  return (
    <main className="flex flex-col items-center gap-4 p-10 text-center">
      <Guide mood="think" size={120} />
      <h1 className="font-display text-3xl">Oops! This page went for a walk.</h1>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </main>
  );
}
