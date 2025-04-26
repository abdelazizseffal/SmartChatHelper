import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  User,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [notificationCount] = useState(3); // Example notification count
  
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white dark:bg-neutral-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 12c0 1.1-.9 2-2 2v2c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-2c-1.1 0-2-.9-2-2s.9-2 2-2V8c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2c1.1 0 2 .9 2 2zm-2-4H7v8h12V8zm-7 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
                <span className="ml-2 text-xl font-semibold text-primary">PipeNest</span>
              </div>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/" className={`${location === '/' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary'} px-1 pt-1 font-medium`}>
                Dashboard
              </Link>
              <Link href="/projects" className={`${location === '/projects' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary'} px-1 pt-1 font-medium`}>
                Projects
              </Link>
              {/* Billing link hidden */}
              {user?.role === 'admin' && (
                <Link href="/admin" className={`${location === '/admin' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary'} px-1 pt-1 font-medium`}>
                  Admin
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <WorkspaceSwitcher />
            
            <ThemeToggle />
            
            <div className="relative">
              <Button variant="ghost" className="p-1 rounded-full text-neutral-500 hover:text-primary focus:outline-none" aria-label="View notifications">
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
                  {notificationCount}
                </span>
                <Bell className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-200 text-primary-700">
                        {user ? getUserInitials(user.username) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-2 font-medium hidden md:block text-neutral-700 dark:text-neutral-200">
                      {user?.username}
                    </span>
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Account</span>
                    </Link>
                  </DropdownMenuItem>
                  {/* Billing dropdown item hidden */}
                  {/* Settings dropdown item hidden */}
                  {user?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center cursor-pointer">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <div className="px-2 pt-2 pb-3 space-y-1">
                    <Link href="/" className={`${location === '/' ? 'bg-primary text-white' : 'text-neutral-500 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'} block px-3 py-2 rounded-md text-base font-medium`}>
                      Dashboard
                    </Link>
                    <Link href="/projects" className={`${location === '/projects' ? 'bg-primary text-white' : 'text-neutral-500 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'} block px-3 py-2 rounded-md text-base font-medium`}>
                      Projects
                    </Link>
                    <Link href="/account" className={`${location === '/account' ? 'bg-primary text-white' : 'text-neutral-500 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'} block px-3 py-2 rounded-md text-base font-medium`}>
                      My Account
                    </Link>
                    {/* Billing mobile link hidden */}
                    {user?.role === 'admin' && (
                      <Link href="/admin" className={`${location === '/admin' ? 'bg-primary text-white' : 'text-neutral-500 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'} block px-3 py-2 rounded-md text-base font-medium`}>
                        Admin
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
