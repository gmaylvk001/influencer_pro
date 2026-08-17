import { Link } from "react-router";
import { Instagram, Mail, Youtube } from "lucide-react";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-[image:var(--gradient-gold)]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Influbrand is an influencer marketing platform connecting Indian brands with creators
            who actually move the needle.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Platform</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/influencers">
                Find influencers
              </Link>
            </li>
            <li>
              <Link to="/for-brands" >
                For brands
              </Link>
            </li>
            <li>
              <Link to="/signup/influencer" >
                Join as a creator
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Company</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact us
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Reach us</h3>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" /> hello@influbrand.in
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Bangalore &middot; Chennai &middot; Madurai</p>
          <div className="mt-4 flex gap-3 text-muted-foreground">
            <Instagram className="size-5" />
            <Youtube className="size-5" />
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Influbrand. All rights reserved.
      </div>
    </footer>
  );
}
