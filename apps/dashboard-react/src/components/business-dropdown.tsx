"use client";

import { LogEvents } from "eventbus/events";
import { Avatar, AvatarFallback, AvatarImageNext } from "ui/avatar";
import { Button } from "ui/button";
import { Icons } from "ui/icons";
import { Skeleton } from "ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip";
import { useOpenPanel } from "@openpanel/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/next/link";
import { useEffect, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";

type Props = {
  isExpanded?: boolean;
};

function BusinessDropdownSkeleton({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div className="relative h-[32px]">
      <div className="fixed left-[19px] bottom-4 w-[32px] h-[32px]">
        <Skeleton className="w-[32px] h-[32px] rounded-none" />
      </div>
      {isExpanded && (
        <div className="fixed left-[62px] bottom-4 h-[32px] flex items-center">
          <Skeleton className="h-4 w-24" />
        </div>
      )}
    </div>
  );
}

export function BusinessDropdown({ isExpanded = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: user } = useUserQuery();
  const trpc = useTRPC();
  const { track } = useOpenPanel();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | undefined>(
    user?.businessId,
  );
  const [isActive, setActive] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const changeBusinessMutation = useMutation(
    trpc.user.switchBusiness.mutationOptions({
      onSuccess: async () => {
        queryClient.clear();
        setIsChanging(false);
        navigate("/", { replace: true });
      },
    }),
  );

  const { data: businesses, isLoading: isBusinessesLoading } = useQuery(
    trpc.business.list.queryOptions(),
  );

  useEffect(() => {
    if (user?.businessId) {
      setSelectedId(user.businessId);
    }
  }, [user?.businessId]);

  const sortedBusinesses =
    businesses?.sort((a, b) => {
      if (a.id === selectedId) return -1;
      if (b.id === selectedId) return 1;

      return (a.id ?? "").localeCompare(b.id ?? "");
    }) ?? [];

  // @ts-expect-error
  useOnClickOutside(ref, () => {
    if (!isChanging) {
      setActive(false);
    }
  });

  const toggleActive = () => setActive((prev) => !prev);

  if (isBusinessesLoading && !businesses) {
    return <BusinessDropdownSkeleton isExpanded={isExpanded} />;
  }

  const handleBusinessChange = (businessId: string) => {
    if (businessId === selectedId) {
      toggleActive();
      return;
    }

    setIsChanging(true);
    setSelectedId(businessId);
    setActive(false);

    track(LogEvents.ChangeTeam.name);
    changeBusinessMutation.mutate({ businessId });
  };

  return (
    <TooltipProvider delayDuration={50}>
      <div className="relative h-[32px]" ref={ref}>
        <div className="fixed left-[19px] bottom-4 w-[32px] h-[32px]">
          <div className="relative w-[32px] h-[32px]">
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="w-[32px] h-[32px] left-0 overflow-hidden absolute"
                  style={{ zIndex: 1 }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -(32 + 10) * sortedBusinesses.length, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    mass: 1.2,
                  }}
                >
                  <Link href="/onboarding" onClick={() => setActive(false)}>
                    <Button
                      className="w-[32px] h-[32px] bg-background"
                      size="icon"
                      variant="outline"
                    >
                      <Icons.Add />
                    </Button>
                  </Link>
                </motion.div>
              )}
              {sortedBusinesses.map((business, index) => {
                const isSelected = business.id === selectedId;
                return (
                  <motion.div
                    key={business.id}
                    className="w-[32px] h-[32px] left-0 overflow-hidden absolute"
                    style={{ zIndex: -index }}
                    initial={{
                      scale: `${100 - index * 16}%`,
                      y: index * 5,
                    }}
                    animate={
                      isActive
                        ? {
                            y: -(32 + 10) * index,
                            scale: "100%",
                          }
                        : {
                            scale: `${100 - index * 16}%`,
                            y: index * 5,
                          }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      mass: 1.2,
                    }}
                  >
                    {!isSelected ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar
                            className="w-[32px] h-[32px] rounded-none border border-[#DCDAD2] dark:border-[#2C2C2C] cursor-pointer"
                            onClick={() => {
                              if (index === 0) {
                                toggleActive();
                              } else {
                                handleBusinessChange(business?.id ?? "");
                              }
                            }}
                          >
                            <AvatarImageNext
                              src={business?.logoUrl ?? ""}
                              alt={business?.name ?? ""}
                              width={20}
                              height={20}
                              quality={100}
                            />
                            <AvatarFallback className="rounded-none w-[32px] h-[32px]">
                              <span className="text-xs">
                                {business?.name?.charAt(0)?.toUpperCase()}
                                {business?.name?.charAt(1)?.toUpperCase()}
                              </span>
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={8}
                          className="px-2 py-1"
                        >
                          <p className="text-xs">{business.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Avatar
                        className="w-[32px] h-[32px] rounded-none border border-[#DCDAD2] dark:border-[#2C2C2C] cursor-pointer"
                        onClick={() => {
                          if (index === 0) {
                            toggleActive();
                          } else {
                            handleBusinessChange(business?.id ?? "");
                          }
                        }}
                      >
                        <AvatarImageNext
                          src={business?.logoUrl ?? ""}
                          alt={business?.name ?? ""}
                          width={20}
                          height={20}
                          quality={100}
                        />
                        <AvatarFallback className="rounded-none w-[32px] h-[32px]">
                          <span className="text-xs">
                            {business?.name?.charAt(0)?.toUpperCase()}
                            {business?.name?.charAt(1)?.toUpperCase()}
                          </span>
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {isExpanded && sortedBusinesses[0] && (
          <div className="fixed left-[62px] bottom-4 h-[32px] flex items-center">
            <span
              className="text-sm text-primary truncate transition-opacity duration-200 ease-in-out cursor-pointer hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                toggleActive();
              }}
            >
              {sortedBusinesses[0].name}
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
