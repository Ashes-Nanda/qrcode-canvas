import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QrCode, LogOut, Settings, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  profile?: any;
}

export const Navigation = ({
  activeTab,
  onTabChange,
  profile,
}: NavigationProps) => {
  const { toast } = useToast();

  const handleToggleDarkMode = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "create", label: "Create" },
    { id: "manage", label: "Manage" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              QRCode Canvas Pro
            </span>
          </div>

          {/* Main Navigation */}
          <TooltipProvider delayDuration={200}>
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                        activeTab === item.id
                          ? "bg-primary text-white shadow-md"
                          : "text-gray-600 hover:text-primary hover:bg-gray-50"
                      }`}
                      aria-label={`Go to ${item.label}`}
                    >
                      {item.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-sm">
                    {item.id === 'dashboard' && 'Overview of your QR performance'}
                    {item.id === 'create' && 'Create a new QR code'}
                    {item.id === 'manage' && 'Manage and edit your QR codes'}
                    {item.id === 'analytics' && 'Explore scan analytics'}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={profile?.avatar_url}
                    alt={profile?.full_name}
                  />
                  <AvatarFallback className="bg-primary text-white">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{profile?.full_name || "User"}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: 'Upgrade', description: 'Upgrade to Pro coming soon.' })}>
                <Settings className="mr-2 h-4 w-4" />
                Upgrade Tier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleDarkMode}>
                <Settings className="mr-2 h-4 w-4" />
                Toggle Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "text-primary bg-primary/5 border-t-2 border-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
