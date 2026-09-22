import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CtaSection() {
  return (
    <section className="px-5 pb-24 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-xl2 bg-gradient-to-r from-deep-blue via-midnight to-deep-blue bg-grid-glow p-12 text-center shadow-glow-violet">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to see nit Solution in action?</h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Explore the admin dashboard and employee experience with a fully interactive frontend demo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/login">
            <Button size="lg">Try the Demo</Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Contact Sales</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
