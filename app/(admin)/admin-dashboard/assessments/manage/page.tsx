"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ManageAssessmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchTemplates = async () => {
      try {
        const profileRes = await fetch("/api/auth/profile");
        const profileData = await profileRes.json();

        if (!profileData.user || profileData.user.role !== "admin") {
          router.push("/sign-in");
          return;
        }

        setUser(profileData.user);

        const templatesRes = await fetch("/api/assessments/templates");
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      } catch (error) {
        console.error("[v0] Error loading assessments:", error);
        toast.error("Failed to load assessments");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndFetchTemplates();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Assessment Templates
          </h1>
          <p className="text-gray-400">
            Manage stress assessment templates for officers
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-400">
                No assessment templates yet. Create one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template._id} className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white">{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">{template.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    {template.questions?.length || 0} questions
                  </span>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                    Max Score: {template.maxScore || 0}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
