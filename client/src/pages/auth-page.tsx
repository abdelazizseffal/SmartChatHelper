import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const AuthPage = () => {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registrationData } = data;
    registerMutation.mutate(registrationData);
  };

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col md:flex-row">
      {/* Hero section */}
      <div className="w-full md:w-1/2 bg-primary-600 p-8 flex items-center justify-center">
        <div className="max-w-md text-white">
          <div className="flex items-center mb-6">
            <svg className="h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12c0 1.1-.9 2-2 2v2c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-2c-1.1 0-2-.9-2-2s.9-2 2-2V8c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2c1.1 0 2 .9 2 2zm-2-4H7v8h12V8zm-7 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            <span className="ml-2 text-2xl font-bold">PipeNest</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Revolutionize Your Pipe Cutting Workflow</h1>
          <p className="text-xl mb-6">
            Minimize waste and maximize efficiency with our cutting-edge pipe nesting optimization platform.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold">✓</span>
              </div>
              <p>Reduce material waste by up to 30%</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold">✓</span>
              </div>
              <p>Save time with automated cutting patterns</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold">✓</span>
              </div>
              <p>Collaborate with your team in real-time</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to PipeNest</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username or Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username or email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-neutral-500 text-center">
                By continuing, you agree to PipeNest's <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
