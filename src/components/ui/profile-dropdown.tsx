import * as React from "react"
import { User, Settings, LogOut, Crown, Moon, Sun, Monitor, CreditCard, HelpCircle } from "lucide-react"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Badge } from "./badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  full_name?: string;
  email?: string;
  avatar_url?: string;
  subscription_tier?: 'free' | 'pro' | 'enterprise';
}

interface ProfileDropdownProps {
  profile: UserProfile | null;
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  currentTheme?: 'light' | 'dark' | 'system';
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ 
  profile, 
  onThemeChange,
  currentTheme = 'system' 
}) => {
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      
      // Redirect will be handled by auth state change
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'pro':
        return <Badge variant="secondary" className="text-xs">Pro</Badge>;
      case 'enterprise':
        return <Badge variant="default" className="text-xs">Enterprise</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Free</Badge>;
    }
  };

  const handleUpgrade = () => {
    toast({
      title: "Upgrade Coming Soon",
      description: "Premium plans will be available soon with advanced features!",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || profile?.email} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(profile?.full_name, profile?.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {profile?.full_name || 'User'}
              </p>
              {getTierBadge(profile?.subscription_tier)}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>

        {profile?.subscription_tier === 'free' && (
          <DropdownMenuItem className="cursor-pointer" onClick={handleUpgrade}>
            <Crown className="mr-2 h-4 w-4 text-yellow-500" />
            <span className="text-yellow-600">Upgrade to Pro</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            {currentTheme === 'light' && <Sun className="mr-2 h-4 w-4" />}
            {currentTheme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
            {currentTheme === 'system' && <Monitor className="mr-2 h-4 w-4" />}
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onThemeChange?.('light')} className="cursor-pointer">
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onThemeChange?.('dark')} className="cursor-pointer">
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onThemeChange?.('system')} className="cursor-pointer">
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ProfileDropdown };
