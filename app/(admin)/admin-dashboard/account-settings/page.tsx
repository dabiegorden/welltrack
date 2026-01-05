"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Shield, Mail, Phone, MapPin, Lock } from "lucide-react";

const profileSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      phone: "",
      address: "",
      password: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        const data = await res.json();
        if (data.user) {
          form.reset({
            firstname: data.user.firstname,
            lastname: data.user.lastname,
            phone: data.user.phone || "",
            address: data.user.address || "",
            password: "",
          });
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [form]);

  async function onSubmit(values: ProfileFormValues) {
    setSubmitting(true);
    try {
      const payload = { ...values };
      if (!payload.password) delete payload.password;

      const res = await fetch("/api/auth/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      toast.success("Profile updated successfully");
      form.setValue("password", "");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-100 items-center justify-center">
        <Spinner className="h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-gray-400 mt-1">
          Manage your personal information and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/50 flex items-center justify-center text-blue-400 text-3xl font-bold mb-4 shadow-lg shadow-blue-500/10">
                  {form.getValues("firstname")?.charAt(0)}
                  {form.getValues("lastname")?.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">
                  {form.getValues("firstname")} {form.getValues("lastname")}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-blue-400 text-sm font-medium bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="capitalize">Active Account</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
              Verification
            </p>
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="truncate">Email Verified</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Lock className="h-4 w-4 text-blue-500" />
                <span>Secure Authentication</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="bg-gray-900 border-gray-800 shadow-xl">
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-lg">
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your contact details and display name.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-950 border-gray-800 focus:ring-blue-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-950 border-gray-800 focus:ring-blue-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-blue-500" /> Phone
                          Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-gray-950 border-gray-800 focus:ring-blue-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />{" "}
                          Physical Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-gray-950 border-gray-800 focus:ring-blue-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 shadow-xl">
                <CardHeader className="border-b border-gray-800">
                  <CardTitle className="text-lg">Security</CardTitle>
                  <CardDescription>
                    Update your account password for better protection.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Leave blank to keep current"
                            className="bg-gray-950 border-gray-800 focus:ring-blue-500/50"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Minimum 6 characters recommended.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="bg-gray-950/30 border-t border-gray-800 pt-6">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 h-10 px-8 shadow-lg shadow-blue-500/20"
                  >
                    {submitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
