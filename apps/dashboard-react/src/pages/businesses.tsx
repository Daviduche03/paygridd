"use client";

import { Button } from "ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BusinessesSkeleton } from "@/components/businesses-skeleton";
import { SelectBusinessTable } from "@/components/tables/select-business/table";
import { UserMenu } from "@/components/user-menu";
import { useTRPC } from "@/trpc/client";
import { useUserQuery } from "@/hooks/use-user";

export default function BusinessesPage() {
  const trpc = useTRPC();
  const { data: user, isLoading: userLoading } = useUserQuery();
  const { data: businesses, isLoading: businessesLoading } = useQuery(
    trpc.business.list.queryOptions(),
  );

  if (businessesLoading || userLoading) {
    return <BusinessesSkeleton />;
  }

  return (
    <>
      <header className="w-full absolute left-0 right-0 flex justify-between items-center">
        <div className="p-6">
          <Link to="/overview">
            <img src="/images/logo.png" alt="PayGrid" className="h-10 w-auto" />
          </Link>
        </div>

        <div className="mr-6 mt-4">
          <UserMenu onlySignOut />
        </div>
      </header>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[480px] flex-col">
          <div>
            <div className="text-center">
              <h1 className="text-lg lg:text-xl mb-2 font-serif">
                Welcome, {user?.fullName?.split(" ").at(0)}
              </h1>
              <p className="text-[#878787] text-sm mb-8">
                Select a business or create a new one.
              </p>
            </div>
          </div>

          {businesses?.length > 0 && (
            <>
              <span className="text-sm text-[#878787] mb-4">Businesses</span>
              <div className="max-h-[260px] overflow-y-auto">
                <SelectBusinessTable data={businesses} />
              </div>
            </>
          )}

          <div className="text-center mt-12 border-t-[1px] border-border pt-6 w-full relative border-dashed">
            <span className="absolute left-1/2 -translate-x-1/2 text-sm text-[#878787] bg-background -top-3 px-4">
              Or
            </span>
            <Link to="/onboarding" className="w-full">
              <Button className="w-full mt-2" variant="outline">
                Create business
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
