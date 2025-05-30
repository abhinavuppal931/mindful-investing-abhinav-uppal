
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const UserMenu = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getFirstName = () => {
    // Try to get first name from user metadata, fallback to email
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) {
      return fullName.split(' ')[0];
    }
    return user.email?.split('@')[0] || 'User';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-3 h-auto">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarFallback className="bg-mindful-100 text-mindful-700">
              {getInitials(user.email || '')}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{getFirstName()}</span>
            <span className="text-xs text-muted-foreground truncate max-w-32">
              {user.email}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getFirstName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
