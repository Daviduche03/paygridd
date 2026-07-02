"use client";

import { track } from "eventbus/client";
import { LogEvents } from "eventbus/events";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "ui/form";
import { Input } from "ui/input";
import { useToast } from "ui/use-toast";
import { getDefaultFiscalYearStartMonth } from "utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { use, useEffect, useRef, useState } from "react";
import { z } from "zod/v3";
import { SelectCompanyType } from "@/components/select-company-type";
import { SelectHeardAbout } from "@/components/select-heard-about";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
  countryCode: z.string(),
  baseCurrency: z.string(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).nullable().optional(),
  companyType: z.enum(
    [
      "freelancer",
      "solo_founder",
      "small_team",
      "startup",
      "agency",
      "ecommerce",
      "creator",
      "non_profit",
      "accountant",
      "exploring",
    ],
    { required_error: "Please select a company type." },
  ),
  heardAbout: z.enum(
    [
      "twitter",
      "youtube",
      "friend",
      "google",
      "blog",
      "podcast",
      "github",
      "other",
    ],
    { required_error: "Please select an option." },
  ),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  defaultCurrencyPromise: Promise<string>;
  defaultCountryCodePromise: Promise<string>;
  onComplete: () => void;
  onLoadingChange?: (loading: boolean) => void;
};

export function CreateBusinessStep({
  defaultCurrencyPromise,
  defaultCountryCodePromise,
  onComplete,
  onLoadingChange,
}: Props) {
  const currency = use(defaultCurrencyPromise);
  const countryCode = use(defaultCountryCodePromise);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittedRef = useRef(false);

  const createBusinessMutation = useMutation(
    trpc.business.create.mutationOptions({
      onSuccess: async () => {
        track({
          event: LogEvents.OnboardingTeamCreated.name,
          channel: LogEvents.OnboardingTeamCreated.channel,
          countryCode: form.getValues("countryCode"),
          currency: form.getValues("baseCurrency"),
          companyType: form.getValues("companyType"),
          heardAbout: form.getValues("heardAbout"),
        });
        await queryClient.invalidateQueries();
        onComplete();
      },
      onError: (error) => {
        setIsLoading(false);
        isSubmittedRef.current = false;

        toast({
          duration: 6000,
          title: "Unable to create business",
          variant: "info",
          description:
            error.data?.code === "FORBIDDEN"
              ? "All existing businesses must be on a paid plan before creating another."
              : "Something went wrong. Please try again.",
        });
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      name: "",
      baseCurrency: currency,
      countryCode: countryCode ?? "",
      fiscalYearStartMonth: getDefaultFiscalYearStartMonth(countryCode),
    },
  });

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const isFormLocked = isLoading || isSubmittedRef.current;

  async function onSubmit(values: FormValues) {
    if (isFormLocked) return;

    setIsLoading(true);
    isSubmittedRef.current = true;

    try {
      createBusinessMutation.mutate({
        name: values.name,
        baseCurrency: values.baseCurrency,
        countryCode: values.countryCode,
        fiscalYearStartMonth: values.fiscalYearStartMonth,
        companyType: values.companyType,
        heardAbout: values.heardAbout,
        switchBusiness: true,
      });
    } catch {
      setIsLoading(false);
      isSubmittedRef.current = false;
    }
  }

  return (
    <div className="space-y-4">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-lg lg:text-xl font-serif"
      >
        Business details
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-sm text-muted-foreground leading-relaxed"
      >
        Tell us a bit about your business so we can personalize your workspace.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        <Form {...form}>
          <form
            id="create-business-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-primary font-normal">
                    Company name
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Ex: Acme Marketing or Acme Co"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
              <FormField
                control={form.control}
                name="companyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-primary font-normal">
                      What best describes you?
                    </FormLabel>
                    <FormControl>
                      <SelectCompanyType
                        value={field.value}
                        onChange={field.onChange}
                        className="bg-secondary border-border text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heardAbout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-primary font-normal">
                      How did you hear about us?
                    </FormLabel>
                    <FormControl>
                      <SelectHeardAbout
                        value={field.value}
                        onChange={field.onChange}
                        className="bg-secondary border-border text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
