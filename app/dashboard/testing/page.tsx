"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export default function TestingPage() {
    const [projectName, setProjectName] = useState("");
    const [deploymentId, setDeploymentId] = useState("");
    const [loadingProject, setLoadingProject] = useState(false);
    const [loadingDeployment, setLoadingDeployment] = useState(false);

    const handleDeleteProject = async () => {
        if (!projectName) {
            toast.error("Please enter a project name");
            return;
        }

        setLoadingProject(true);
        try {
            const res = await fetch(`/api/cloudflare/projects/${projectName}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to delete project");

            toast.success(`Project ${projectName} deleted successfully`);
            setProjectName("");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoadingProject(false);
        }
    };

    const handleDeleteDeployment = async () => {
        if (!deploymentId) {
            toast.error("Please enter a deployment ID");
            return;
        }

        setLoadingDeployment(true);
        try {
            const res = await fetch(`/api/cloudflare/deployments/${deploymentId}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to delete deployment");

            toast.success("Deployment cancelled/deleted successfully");
            setDeploymentId("");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoadingDeployment(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold mb-6">Testing Tools</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Delete Cloudflare Project
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-400">
                            Enter the Cloudflare Project Name to delete it permanently.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Project Name (e.g. project-123)"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="bg-white/5 border-white/10"
                            />
                            <Button
                                variant="destructive"
                                onClick={handleDeleteProject}
                                disabled={loadingProject}
                            >
                                {loadingProject ? <Loader2 className="animate-spin w-4 h-4" /> : "Delete"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-orange-500" />
                            Delete/Cancel Deployment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-400">
                            Enter the Deployment ID to cancel or remove it.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Deployment ID"
                                value={deploymentId}
                                onChange={(e) => setDeploymentId(e.target.value)}
                                className="bg-white/5 border-white/10"
                            />
                            <Button
                                variant="destructive"
                                onClick={handleDeleteDeployment}
                                disabled={loadingDeployment}
                            >
                                {loadingDeployment ? <Loader2 className="animate-spin w-4 h-4" /> : "Delete"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
