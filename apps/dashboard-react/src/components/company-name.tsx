"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "ui/form";
import { Input } from "ui/input";
import { SubmitButton } from "ui/submit-button";
import { z } from "zod/v3";
import { useBusinessMutation, useBusinessQuery } from "@/hooks/use-business";
import { useZodForm } from "@/hooks/use-zod-form";

const formSchema = z.object({
  name: z.string().min(2).max(32),
});

export function CompanyName() {
  const { data } = useBusinessQuery();
  const updateBusinessMutation = useBusinessMutation();

  const form = useZodForm(formSchema, {
    defaultValues: {
      name: data?.name ?? "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateBusinessMutation.mutate(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Company name</CardTitle>
            <CardDescription>
              This is your company's visible name within PayGrid. For example,
              the name of your company or department.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      className="max-w-[300px]"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      maxLength={32}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <div>Please use 32 characters at maximum.</div>
            <SubmitButton
              isSubmitting={updateBusinessMutation.isPending}
              disabled={updateBusinessMutation.isPending}
            >
              Save
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
