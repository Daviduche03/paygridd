import { ConnectionStatus } from "@/components/connection-status";
import { UserMenu } from "@/components/user-menu";
import Link from "@/next/link";
import { MobileMenu } from "./mobile-menu";

export function TopBar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-[70] flex h-[70px] items-stretch border-b border-border bg-background transition-transform desktop:rounded-t-[10px]"
      style={{
        transform: "translateY(calc(var(--header-offset, 0px) * -1))",
        transitionDuration: "var(--header-transition, 200ms)",
        willChange: "transform",
      }}
    >
      <div className="hidden md:flex w-[70px] shrink-0 items-center justify-center border-r border-border">
        <Link href="/" className="shrink-0">
          <img src="/images/logo.png" alt="PayGrid" className="h-10 w-auto" />
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-4 px-4 md:px-8">
        <div className="md:hidden">
          <MobileMenu />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ConnectionStatus />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export const Header = TopBar;
