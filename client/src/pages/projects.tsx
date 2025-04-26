import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Trash2, Edit, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const projectSchema = z.object({
  name: z.string().min(1, { message: "Project name is required" }),
  workspaceId: z.number()
});

export default function Projects() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Get user's workspaces
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["/api/workspaces"],
  });
  
  // Default to first workspace if available
  const defaultWorkspaceId = workspaces && workspaces.length > 0 ? workspaces[0].id : 0;
  
  // Get projects for selected workspace
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/workspaces', defaultWorkspaceId, 'projects'],
    queryFn: async () => {
      if (!defaultWorkspaceId) return [];
      const res = await fetch(`/api/workspaces/${defaultWorkspaceId}/projects`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    enabled: !!defaultWorkspaceId
  });
  
  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      workspaceId: defaultWorkspaceId
    },
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof projectSchema>) => {
      const res = await apiRequest("POST", `/api/workspaces/${data.workspaceId}/projects`, {
        name: data.name
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project Created",
        description: "Your new project has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', defaultWorkspaceId, 'projects'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Project",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: z.infer<typeof projectSchema>) => {
    createProjectMutation.mutate(data);
  };
  
  if (isLoadingWorkspaces) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Projects</h1>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">Manage your pipe cutting projects</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new pipe cutting optimization project to your workspace.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="workspaceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          >
                            {workspaces.map((workspace: any) => (
                              <option key={workspace.id} value={workspace.id}>
                                {workspace.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProjectMutation.isPending}>
                      {createProjectMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                      ) : (
                        "Create Project"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoadingProjects ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8 text-center">
            <div className="mx-auto h-12 w-12 text-neutral-400 mb-4">
              <FolderOpen className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">No projects yet</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Get started by creating a new project
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    Created on {new Date(project.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="font-medium">6</span> pipe specifications
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="font-medium">12</span> optimization results
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/90">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
